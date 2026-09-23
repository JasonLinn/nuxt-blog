// Read-only comparison. Inputs are private files containing direct PostgreSQL URLs.
// Usage: node scripts/verify-database-copy.mjs source.url target.url report.json
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import pg from 'pg'

const [sourceFile, targetFile, outputFile] = process.argv.slice(2)
if (!sourceFile || !targetFile || !outputFile) throw new Error('Expected source URL file, target URL file, report file')
const quote = value => '"' + value.replaceAll('"', '""') + '"'
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex')
async function inventory(file) {
  const client = new pg.Client({ connectionString: readFileSync(file, 'utf8').trim(), application_name: 'migration-readonly-verify', connectionTimeoutMillis: 30000 })
  await client.connect()
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
    await client.query("SET LOCAL timezone = 'UTC'")
    const tables = (await client.query("SELECT schemaname, tablename FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2")).rows
    const data = {}
    for (const t of tables) {
      const name = `${quote(t.schemaname)}.${quote(t.tablename)}`
      // Server-side canonical JSON preserves numerics, timestamp precision and nulls.
      const rows = (await client.query(`SELECT to_jsonb(t)::text AS row FROM ${name} t ORDER BY to_jsonb(t)::text COLLATE "C"`)).rows
      data[name] = { rows: rows.length, sha256: hash(rows.map(r => r.row)) }
    }
    const sequences = {}
    for (const s of (await client.query("SELECT schemaname, sequencename FROM pg_sequences WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2")).rows) {
      const name = `${quote(s.schemaname)}.${quote(s.sequencename)}`
      sequences[name] = (await client.query(`SELECT last_value::text, is_called FROM ${name}`)).rows[0]
    }
    const metadataQueries = {
      columns: "SELECT table_schema,table_name,column_name,row_number() OVER (PARTITION BY table_schema,table_name ORDER BY ordinal_position) AS visible_position,column_default,is_nullable,data_type,udt_schema,udt_name,character_maximum_length,numeric_precision,numeric_scale,is_identity,identity_generation FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,4",
      indexes: "SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3",
      constraints: "SELECT n.nspname,c.relname,k.conname,k.contype,k.convalidated,pg_get_constraintdef(k.oid) definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3",
      functions: "SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND p.prokind IN ('f','p') ORDER BY 1,2,3",
      triggers: "SELECT n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE NOT t.tgisinternal AND n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3",
      views: "SELECT schemaname,viewname,definition FROM pg_views WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2",
      relations: "SELECT n.nspname,c.relname,c.relkind,pg_get_userbyid(c.relowner) owner,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname !~ '^pg_toast' ORDER BY 1,2",
      sequenceDefinitions: "SELECT schemaname,sequencename,sequenceowner,data_type::text,start_value::text,min_value::text,max_value::text,increment_by::text,cycle,cache_size::text FROM pg_sequences ORDER BY 1,2",
      policies: 'SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check FROM pg_policies ORDER BY 1,2,3',
      defaultPrivileges: "SELECT pg_get_userbyid(d.defaclrole) role,n.nspname,d.defaclobjtype,d.defaclacl::text FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace WHERE pg_get_userbyid(d.defaclrole) <> 'cloud_admin' ORDER BY 1,2,3",
      extensions: 'SELECT extname,extversion FROM pg_extension ORDER BY 1',
      schemas: "SELECT nspname,pg_get_userbyid(nspowner) owner,nspacl::text FROM pg_namespace WHERE nspname NOT IN ('pg_catalog','information_schema') AND nspname !~ '^pg_toast' AND nspname !~ '^pg_temp' ORDER BY 1",
      functionPermissions: "SELECT n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) args,pg_get_userbyid(p.proowner) owner,p.proacl::text,p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') ORDER BY 1,2,3",
      memberships: "SELECT pg_get_userbyid(roleid) role,pg_get_userbyid(member) member,admin_option,inherit_option,set_option FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname=current_user) ORDER BY 1,2",
      databasePrivileges: "SELECT datname,pg_get_userbyid(datdba) owner,encoding,datcollate,datctype,datacl::text FROM pg_database WHERE datname=current_database()",
      role: "SELECT rolname,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolconfig FROM pg_roles WHERE rolname = current_user"
    }
    const metadata = {}
    for (const [key, sql] of Object.entries(metadataQueries)) {
      const rows = (await client.query(sql)).rows
      if (key === 'constraints') {
        // PG 17 deparses older array-wide varchar->text casts differently after
        // dump/restore. Normalize only literal varchar arrays, not arbitrary SQL.
        for (const row of rows) row.definition = row.definition.replace(
          /\(ARRAY\[((?:'[^']*'::character varying)(?:, '[^']*'::character varying)*)\]\)::text\[\]/g,
          (_, values) => `ARRAY[${values.split(', ').map(value => `(${value})::text`).join(', ')}]`
        )
      }
      metadata[key] = { count: rows.length, sha256: hash(rows) }
    }
    await client.query('COMMIT')
    return { data, sequences, metadata }
  } finally { await client.end() }
}
try {
  const source = await inventory(sourceFile)
  const target = await inventory(targetFile)
  const differences = []
  for (const group of ['data','sequences','metadata']) {
    for (const key of new Set([...Object.keys(source[group]), ...Object.keys(target[group])])) {
      if (JSON.stringify(source[group][key]) !== JSON.stringify(target[group][key])) differences.push(`${group}.${key}`)
    }
  }
  const result = { checkedAt: new Date().toISOString(), equal: differences.length === 0, differences, normalizations: ['Visible column order ignores dropped-column physical slots', 'Literal varchar array casts are canonicalized for PG 17 deparser equivalence'], source, target }
  writeFileSync(outputFile, JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ equal: result.equal, differences, tables: Object.keys(source.data).length, rows: Object.values(source.data).reduce((n,t) => n+t.rows,0), sequences: Object.keys(source.sequences).length, metadata: source.metadata }))
  if (!result.equal) process.exitCode = 1
} catch (error) {
  console.error('Database verification failed', { code: error.code || 'VERIFY_ERROR' })
  process.exitCode = 1
}
