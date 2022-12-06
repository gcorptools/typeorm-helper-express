import { Request, Response, NextFunction } from 'express';
import { UserCredentials } from '../types';
import { verifyJwtToken } from '../utils';

/**
 * Augmenting definition of express/Request object
 */
declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Express {
    // eslint-disable-next-line no-unused-vars
    interface Request {
      currentUser?: UserCredentials;
    }
  }
}

const getAccessToken = (req: Request, key: string) => {
  const session = (req.session || {})[key];
  if (session) {
    return session;
  }
  const authorization = (req.headers.authorization || '').split('Bearer ');
  if (authorization.length < 2) {
    return null;
  }
  return authorization[1];
};

/**
 * Get current user from JWT token
 * and set it on the request
 * @param {string} key the key to use in session for getting accessToken
 * @return {void} call to the next function
 */
export const provideCurrentUser = (key: string = 'jwt') => {
  /**
   * Enforce validation logic of dto on received request
   * @param {Request} req the received request
   * @param {Response} res the response to send
   * @param {NextFunction} next the next block in request handling chain
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    const accessToken = getAccessToken(req, key);
    if (!accessToken) {
      return next();
    }
    const payload = verifyJwtToken(accessToken) as UserCredentials;
    if (payload) {
      req.currentUser = payload;
    }
    return next();
  };
};
