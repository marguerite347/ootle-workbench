import { createService } from './server.mjs'
import { Store } from './store.mjs'
let service
export default async function handler(req, res) {
  if (!process.env.DATABASE_URL || !process.env.PUBLIC_URL) return res.status(503).json({ error: 'Agent service deployment is not configured.' })
  service ||= createService({ store: Store.postgres(process.env.DATABASE_URL), origin: process.env.PUBLIC_URL, ideOrigins: (process.env.IDE_ORIGINS || '').split(',').filter(Boolean), githubClientId: process.env.GITHUB_CLIENT_ID, githubClientSecret: process.env.GITHUB_CLIENT_SECRET, allowedLogins: (process.env.ALLOWED_GITHUB_LOGINS || '').toLowerCase().split(',').filter(Boolean), proxyHops: 1 })
  return service.app(req, res)
}
