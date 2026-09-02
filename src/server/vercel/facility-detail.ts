import { facilityDetailHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await facilityDetailHandler(req, res);
}
