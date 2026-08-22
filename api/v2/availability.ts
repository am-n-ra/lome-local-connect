import { handleApi } from '../../src/server/http';

export default async function handler(req: any, res: any) {
  const protocol = String(req.headers?.['x-forwarded-proto'] ?? 'https');
  const host = String(req.headers?.host ?? 'localhost');
  const url = new URL(String(req.url ?? '/api/v2/availability'), `${protocol}://${host}`);
  await handleApi(req, res, '/api/v2/availability', url);
}
