import { Request, Response } from 'express';
import { validateRequest } from '..';
import { RequestValidationError } from '../../errors';

describe('Validate request', () => {
  it('should raise an error on invalid input', async () => {
    Object.assign(global.mockRequest, {
      'express-validator#contexts': [
        {
          errors: [
            { msg: 'first parameter', param: 'field1' },
            { msg: 'second parameter', param: 'field2' }
          ]
        }
      ]
    });

    validateRequest(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    const calls = (global.nextFunction as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);
    const translator = (
      key: string | i18n.TranslateOptions,
      ...data: string[]
    ) => `${key}`;
    const e = calls[0][0] as RequestValidationError;
    expect(e.statusCode).toEqual(400);
    expect(e.serializeErrors(translator)).toEqual([
      {
        localeMessage: 'error.requestValidation',
        message: 'Invalid request received'
      },
      {
        field: 'field1',
        message: 'first parameter',
        localeMessage: 'validation.first_parameter'
      },
      {
        field: 'field2',
        message: 'second parameter',
        localeMessage: 'validation.second_parameter'
      }
    ]);
  });

  it('should go to next handler when sending valid input', async () => {
    validateRequest(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalled();
    const calls = (global.nextFunction as jest.Mock).mock.calls;
    expect(calls[0][0]).toBeUndefined(); // Called with nothing
  });
});
