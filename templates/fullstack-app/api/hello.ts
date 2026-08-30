import { Request, Response } from 'express';

export const get = (req: Request, res: Response) => {
  res.json({
    message: 'Hello from the API!',
    timestamp: new Date().toISOString()
  });
};

export const post = (req: Request, res: Response) => {
  const { name = 'Guest' } = req.body;
  
  res.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    receivedData: req.body
  });
};
