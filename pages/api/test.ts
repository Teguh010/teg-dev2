import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ 
    status: 'ok',
    message: 'API is working',
    path: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
} 