import { purchaseIntentHandler } from '../vercel-handlers';

export default async function handler(req: any, res: any) {
  await purchaseIntentHandler(req, res);
}
