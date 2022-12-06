import { ForbiddenError } from '../errors';
import { Request, Response, NextFunction } from 'express';

/**
 * Enforce rules for allowing only a given role
 * @param {UserRole} roles the expected roles
 * @return {any} a middleware for enforcing role access
 */
export const requireRole = (roles: string[]): any => {
  /**
   * Enforce rules for allowing only a given role
   * @param {Request} req the received request
   * @param {Response} res the response to send
   * @param {NextFunction} next the next block in request handling chain
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser || !roles.includes(req.currentUser.role)) {
      next(new ForbiddenError());
    }
    return next();
  };
};
