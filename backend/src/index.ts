import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'
import { buildServer } from './server.js'

// Load env from repo root by default (works with `npm run dev` workspaces)
const rootEnv = path.resolve(process.cwd(), '..', '.env')
const localEnv = path.resolve(process.cwd(), '.env')
dotenv.config({ path: fs.existsSync(rootEnv) ? rootEnv : localEnv })

const port = Number(process.env.PORT ?? 8787)
const host = process.env.HOST ?? '0.0.0.0'

const server = await buildServer()

try {
  await server.listen({ port, host })
  server.log.info({ port, host }, 'api listening')
} catch (error) {
  server.log.error(error, 'failed to start server')
  process.exit(1)
}
