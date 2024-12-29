import { Request, Response, NextFunction } from 'express';

export const wrapMiddleware = (middleware: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(middleware(req, res, next)).catch(next);
  };
};
