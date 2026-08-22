import { availabilityHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await availabilityHandler(req, res);
}
