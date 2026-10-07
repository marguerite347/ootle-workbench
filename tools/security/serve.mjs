// Local static acceptance server uses production headers, with loopback RPC permitted locally.
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const root = resolve('dist/apps/remix-ide')
http.createServer(async (req, res) => {
  for (const h of config.headers[0].headers) res.setHeader(h.key, h.value.replace('; upgrade-insecure-requests', '').replace("connect-src 'self'", "connect-src 'self' http://127.0.0.1:4510 http://localhost:4510"))
  res.setHeader('Cache-Control', 'no-store')
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname))
    if (path !== root && !path.startsWith(root + '/')) throw new Error('Unsafe path')
    const data = await readFile(path === root ? root + '/index.html' : path)
    res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' })[extname(path)] || (path === root ? 'text/html' : 'application/octet-stream'))
    res.end(data)
  } catch { res.statusCode = 404; res.end('Not found') }
}).listen(8087, '127.0.0.1', () => console.log('Security acceptance server http://127.0.0.1:8087'))
