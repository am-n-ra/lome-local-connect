import { qrIssuanceHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await qrIssuanceHandler(req, res);
}
