import { createReadStream, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi } from '../src/server/http';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const mime: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  if (await handleApi(req, res, url.pathname, url)) return;
  const requested = url.pathname === '/' ? '/index.html' : url.pathname;
  const safePath = normalize(join(dist, requested));
  const filePath = safePath.startsWith(dist) && existsSync(safePath) ? safePath : join(dist, 'index.html');
  res.statusCode = 200;
  res.setHeader('Content-Type', mime[extname(filePath)] ?? 'application/octet-stream');
  createReadStream(filePath).pipe(res);
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, '0.0.0.0', () => console.log(`Omni V2 server listening on http://0.0.0.0:${port}`));
