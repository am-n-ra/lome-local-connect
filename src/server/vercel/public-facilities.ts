import { publicFacilitiesHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await publicFacilitiesHandler(req, res);
}
