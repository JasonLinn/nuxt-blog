# Authentication security rollout

## Required Vercel configuration

Before merging, the owner must verify these variables and their Production, Preview, and Development scopes in the Vercel security interface. Do not copy their values to a PR, issue, or chat:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `JWT_SECRET_ADMIN`
- `JWT_SECRET_HOMESTAY`
- `JWT_SECRET_USER`

Use independent JWT secrets. Missing variables cause authentication to fail closed. Validate administrator and homestay sign-in in a Preview deployment before approving merge. Do not merge while any configuration or Preview check is outstanding.

## Read-only homestay hash count

Run this query against the homestay database. It returns one count only and does not select account identifiers or hashes:

```sql
SELECT COUNT(*) AS homestays_missing_valid_bcrypt_hash
FROM homestays
WHERE password_hash IS NULL
   OR btrim(password_hash) = ''
   OR password_hash !~ '^\$2[aby]\$\d{2}\$.{53}$';
```

If the count is nonzero, affected accounts cannot sign in after this change. Do not change password data as part of this PR. Propose a separate, owner-approved reset migration that verifies each account owner through an out-of-band channel, issues a one-time expiring reset flow, stores only a bcrypt hash, and records completion without logging the password or hash. Wait for approval and verify the affected-account count before any migration.

## Rollback

Keep this pull request as Draft until all configuration, hash-count, and Preview checks are complete. If authentication fails after release, revert this change through a reviewed deployment rollback and restore a previously approved application version; do not restore exposed hard-coded credentials or reuse old JWT secrets. Reconfigure required secrets through Vercel and require users to sign in again. Do not alter homestay password data during rollback.
