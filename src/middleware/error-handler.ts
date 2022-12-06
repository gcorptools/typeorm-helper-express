import { TRANSLATION_KEYS } from '../constants';
import { Request, Response, NextFunction } from 'express';
import { BaseCustomError } from '../errors';

/**
 * Handler will deal with transformation to same-syntax JSON when an error occurs on a given request
 * @param {Error} err the raised error
 * @param {Request} req the received request
 * @param {Response} res the response to send
 * @param {NextFunction} next the next block in request handling chain
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.requestId;
  if (err instanceof BaseCustomError) {
    // Generic type of errors
    res.status(err.statusCode).send({
      requestId,
      errors: err.serializeErrors(req.__)
    });
    return;
  }
  // An unexpected error occurred
  const message = 'Something went wrong';
  console.error(message, err);
  res.status(500).send({
    requestId,
    errors: [{ message, localeMessage: req.__(TRANSLATION_KEYS.error.default) }]
  });
};
