import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { RequestValidationError } from '../errors';

/**
 * Enforce validation logic of inputs on received request
 * @param {Request} req the received request
 * @param {Response} res the response to send
 * @param {NextFunction} next the next block in request handling chain
 */
export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(new RequestValidationError(errors.array()));
  }
  next();
};
