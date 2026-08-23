import { availabilityResponseHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await availabilityResponseHandler(req, res);
}
