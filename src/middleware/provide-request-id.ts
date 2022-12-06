import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

/**
 * Augmenting definition of express/Request object
 */
declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Add a ID in every request and response
 * @param {string} headerName the name to put the request's ID on
 */
export const provideRequestId = (headerName: string = 'Request-Id'): any => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID().toString();
    req.requestId = requestId;
    res.setHeader(headerName, requestId);
    return next();
  };
};
