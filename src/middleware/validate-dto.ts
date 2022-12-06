import { plainToInstance } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import { DtoValidationError } from '../errors';

/**
 * Enforce validation logic on received dto
 * @param {any} type the DTO type to use as validation base
 * @param {ValidatorOptions} options configuration of the validator
 * @return {any} a middleware for validating DTO
 */
export const validateDto = (
  type: any,
  options: ValidatorOptions = { whitelist: true }
): any => {
  /**
   * Enforce validation logic of dto on received request
   * @param {Request} req the received request
   * @param {Response} res the response to send
   * @param {NextFunction} next the next block in request handling chain
   */
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoObj = plainToInstance(type, req.body);
    const errors = await validate(dtoObj, options);
    if (errors.length > 0) {
      next(new DtoValidationError(errors));
    }
    // TODO: Sanitize the object and call the next middleware
    req.body = dtoObj;
    return next();
  };
};
