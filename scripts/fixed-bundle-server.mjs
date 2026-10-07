import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.DIST ? path.resolve(process.env.DIST) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const PROD = 'https://omni.sparkafrika.online';
const PORT = Number(process.env.PORT || 4199);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    try {
      const upstream = await fetch(PROD + req.url, { method: req.method, headers: { 'content-type': req.headers['content-type'] || 'application/json', accept: 'application/json' } });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, { 'content-type': upstream.headers.get('content-type') || 'application/json', 'access-control-allow-origin': '*' });
      res.end(body);
    } catch (e) { res.writeHead(502); res.end('proxy error ' + e.message); }
    return;
  }
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || !path.extname(p)) p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
server.listen(PORT, () => console.log('fixed-bundle server on http://localhost:4199'));
