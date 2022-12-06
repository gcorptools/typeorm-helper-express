import { Request, Response } from 'express';
import { errorHandler } from '..';
import { NotAuthorizedError, NotFoundError } from '../../errors';

describe('Error handler', () => {
  it('should generic error for non specific Error types', async () => {
    errorHandler(
      new Error('Non-specific error instance with dev-only message'),
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockResponse.status).toBeCalledWith(500);
    expect(global.mockResponse.send).toBeCalledWith({
      errors: [
        {
          localeMessage: 'error.default',
          message: 'Something went wrong' // Generic message
        }
      ]
    });
  });

  it('should return custom error body and status', async () => {
    errorHandler(
      new NotAuthorizedError(),
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockResponse.status).toBeCalledWith(401);
    expect(global.mockResponse.send).toHaveBeenCalled();
  });

  it('should return custom error with fields', async () => {
    const message = 'Field invalid';
    const localeMessage = 'field.invalid';
    const field = 'field';
    errorHandler(
      new NotFoundError('My message', 'My translated message', [
        {
          message,
          localeMessage,
          field,
          value: 3
        },
        {
          message,
          localeMessage,
          field,
          value: null
        },
        {
          message,
          localeMessage,
          field,
          value: [true, false]
        }
      ]),
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockResponse.status).toBeCalledWith(404);
    expect(global.mockResponse.send).toHaveBeenCalled();
  });
});
