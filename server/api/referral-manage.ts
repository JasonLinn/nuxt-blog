import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const filePath = path.resolve(__dirname, '../../utils/referral.js')

export default defineEventHandler(async (event) => {
  const method = event.method

  if (method === 'GET') {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      // Extract the array part. 
      // Assumption: The file contains `export const referral = [...]`
      const match = content.match(/export const referral = ([\s\S]*)/)
      
      if (match && match[1]) {
        // Use a safe way to parse the JS array string
        // Since the file uses single quotes and unquoted keys, JSON.parse won't work.
        // We use new Function to evaluate it.
        // Remove potential trailing semicolon or whitespace
        let arrayString = match[1].trim()
        if (arrayString.endsWith(';')) {
          arrayString = arrayString.slice(0, -1)
        }
        
        const parse = new Function(`return ${arrayString}`)
        return { success: true, data: parse() }
      } else {
         return { success: false, message: 'Could not parse referral file format' }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  if (method === 'POST') {
    try {
      const body = await readBody(event)
      
      if (!Array.isArray(body)) {
        return { success: false, message: 'Data must be an array' }
      }

      // Convert back to string. We'll use JSON.stringify but it quotes keys. 
      // Often acceptable. If we really wanted to unquote keys we could, but it's complex.
      // Let's stick to valid JS syntax via JSON.stringify.
      // To make it look slightly more like the original, we can replace "key": with key: 
      // but only if key is safe variable name.
      
      // However, `export const referral = [...]` is perfectly valid with JSON inside.
      const jsonString = JSON.stringify(body, null, 2)
      
      // Optional: Convert double quotes to single quotes for values, and unquote simple keys
      // purely for aesthetic consistency with the original file style
      let formattedString = jsonString
         // unquote keys (simple regex, applies to "key": )
        .replace(/"(\w+)":/g, '$1:')
        // replace double quotes with single quotes for values
        .replace(/: "([^"]*)"/g, ": '$1'")
      
      const fileContent = `export const referral = ${formattedString}\n`
      
      await fs.writeFile(filePath, fileContent, 'utf-8')
      
      return { success: true, message: 'Updated successfully' }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }
})
