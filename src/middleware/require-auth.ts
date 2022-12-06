import { ForbiddenError, NotAuthorizedError } from '../errors';
import { Request, Response, NextFunction } from 'express';
import { UserCredentials } from '../types';

type RequestValidationMethod = (
  req: Request,
  user: UserCredentials
) => Promise<boolean>;
/**
 * Middleware for blocking non-authenticated users
 * @param {RequestValidationMethod} validateRequest a method to run on request in order to decide if logged user have access to path
 * @return {any} a middleware for enforcing logged users
 */
export const requireAuth = (validateRequest?: RequestValidationMethod): any => {
  /**
   * Middleware for blocking non-authenticated users
   * @param {Request} req the received request
   * @param {Response} res the response to send
   * @param {NextFunction} next the next block in request handling chain
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentUser = req.currentUser;
    if (!currentUser) {
      return next(new NotAuthorizedError());
    }
    if (validateRequest && !(await validateRequest(req, currentUser!))) {
      return next(new ForbiddenError());
    }
    return next();
  };
};
