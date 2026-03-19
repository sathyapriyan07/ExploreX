import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const frontendDir = path.resolve(__dirname, '..')
const src = path.join(frontendDir, 'dist')
const dst = path.resolve(frontendDir, '..', 'dist')

async function exists(p) {
  try {
    await fs.access(p)
    return true
  } catch {
    return false
  }
}

if (!(await exists(src))) {
  console.warn(`[sync-root-dist] skip: missing ${src}`)
  process.exit(0)
}

await fs.rm(dst, { recursive: true, force: true })
await fs.mkdir(dst, { recursive: true })
await fs.cp(src, dst, { recursive: true })
console.log(`[sync-root-dist] copied ${src} -> ${dst}`)

