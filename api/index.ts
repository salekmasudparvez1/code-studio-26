import { handleApiRequest } from '../server/apiHandler.ts';

export default async function handler(req: any, res: any) {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers?.host || 'localhost'}`);
    const queryParams: Record<string, string> = {};
    urlObj.searchParams.forEach((val, key) => {
      queryParams[key] = val;
    });

    const result = await handleApiRequest(
      urlObj.pathname,
      req.method || 'GET',
      req.body,
      queryParams
    );

    res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('Serverless function error:', err);
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  }
}

