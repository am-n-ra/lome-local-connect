import { accountContextHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await accountContextHandler(req, res);
}
