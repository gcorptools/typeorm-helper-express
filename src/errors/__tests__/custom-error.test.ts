import { CustomError } from '../../types';
import { ValidationError } from 'express-validator';
import { BaseCustomError, GenericError, TokenValidationError } from '..';
import { BadRequestError } from '../bad-request.error';
import { DatabaseConnectionError } from '../database-connection.error';
import { ForbiddenError } from '../forbidden.error';
import { NotAuthorizedError } from '../not-authorized.error';
import { NotFoundError } from '../not-found.error';
import { RequestValidationError } from '../request-validation.error';

const translator = (key: string | i18n.TranslateOptions, ...data: string[]) =>
  `Translated ${key}`;

const checkCustomError = <T extends BaseCustomError>(
  error: T,
  prototype: any,
  expectField: boolean
) => {
  expect(Object.getPrototypeOf(error)).toEqual(prototype);
  expect(error.message).toBeDefined();
  expect(error.statusCode).toBeGreaterThanOrEqual(400);
  const serializedErrors = error.serializeErrors(translator);
  expect(serializedErrors.length).toBeGreaterThan(0);
  serializedErrors.forEach((serializedError: CustomError, index: number) => {
    expect(serializedError.message).toBeDefined();
    expect(serializedError.localeMessage).toBeDefined();
    expect(serializedError.localeMessage.startsWith('Translated')).toEqual(
      true
    );
    if (!expectField || index === 0) {
      return;
    }
    expect(serializedError.field).toBeDefined();
  });
};

describe('Custom errors', () => {
  it('should have correct custom errors structures', async () => {
    const TEST_MESSAGE = 'This is a test message';
    checkCustomError(
      new BadRequestError(TEST_MESSAGE),
      BadRequestError.prototype,
      false
    );
    checkCustomError(new BadRequestError(), BadRequestError.prototype, false);

    checkCustomError(
      new DatabaseConnectionError(),
      DatabaseConnectionError.prototype,
      false
    );
    checkCustomError(
      new NotAuthorizedError(),
      NotAuthorizedError.prototype,
      false
    );
    checkCustomError(new ForbiddenError(), ForbiddenError.prototype, false);
    checkCustomError(
      new NotAuthorizedError(),
      NotAuthorizedError.prototype,
      false
    );
    checkCustomError(new NotFoundError(), NotFoundError.prototype, false);
    const errors: ValidationError[] = [
      { msg: TEST_MESSAGE, param: 'field1' } as ValidationError,
      { msg: TEST_MESSAGE, param: 'field2' } as ValidationError,
      { msg: TEST_MESSAGE, param: 'field3' } as ValidationError,
      { msg: TEST_MESSAGE, param: 'field4' } as ValidationError
    ];
    checkCustomError(
      new RequestValidationError(errors),
      RequestValidationError.prototype,
      true
    );

    checkCustomError(
      new GenericError('any message', 404),
      GenericError.prototype,
      false
    );
    checkCustomError(
      new GenericError('any message', 201),
      GenericError.prototype,
      false
    );
    checkCustomError(
      new GenericError('another message'),
      GenericError.prototype,
      false
    );
    checkCustomError(new GenericError(), GenericError.prototype, false);

    checkCustomError(
      new TokenValidationError('one message'),
      TokenValidationError.prototype,
      false
    );
    checkCustomError(
      new TokenValidationError(),
      TokenValidationError.prototype,
      false
    );
  });
});
