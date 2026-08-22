import { handleApi } from '../../../src/server/http';

export default async function handler(req: any, res: any) {
  const protocol = String(req.headers?.['x-forwarded-proto'] ?? 'https');
  const host = String(req.headers?.host ?? 'localhost');
  const rawPath = String(req.url ?? '/api/v2/');
  const url = new URL(rawPath, `${protocol}://${host}`);
  await handleApi(req, res, url.pathname, url);
}
