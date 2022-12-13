import { ForbiddenError } from '../errors';
import { Request, Response, NextFunction } from 'express';

const check = (allowedRoles: any[], userRoles: any[], strict: boolean) => {
  const safeAllowedRoles = allowedRoles.map((r: any) => `${r}`);
  const safeUserRoles = (userRoles || []).map((r: any) => `${r}`);
  if (!strict) {
    // Any user role is allowed
    return safeUserRoles.some((userRole: any) =>
      safeAllowedRoles.includes(userRole)
    );
  }
  // All user roles must be in allowed roles
  return safeUserRoles.every((userRole: any) =>
    safeAllowedRoles.includes(userRole)
  );
};

/**
 * Enforce rules for allowing only a given role
 * @param {UserRole} roles the expected roles
 * @param {boolean} strict if true, all current user roles must be part of the allowed roles
 * @return {any} a middleware for enforcing role access
 */
export const requireRole = (roles: any[], strict: boolean = false): any => {
  /**
   * Enforce rules for allowing only a given role
   * @param {Request} req the received request
   * @param {Response} res the response to send
   * @param {NextFunction} next the next block in request handling chain
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser || !check(roles, req.currentUser.roles, strict)) {
      next(new ForbiddenError());
    }
    return next();
  };
};
