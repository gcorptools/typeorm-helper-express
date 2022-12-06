import { IsString, MinLength, IsEmail } from 'class-validator';
import { Request, Response } from 'express';
import { validateDto } from '..';
import { DtoValidationError } from '../../errors';

const translator = (key: string | i18n.TranslateOptions, ...data: string[]) =>
  `Translated ${key}`;

describe('Validate dto', () => {
  it('should raise an error on empty input', async () => {
    Object.assign(global.mockRequest, { body: {} });
    await validateDto(SimpleDto)(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );

    expect(global.nextFunction).toHaveBeenCalled();
    const calls = (global.nextFunction as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);

    const e = calls[0][0] as DtoValidationError;

    expect(e.statusCode).toEqual(400);
    expect(
      e
        .serializeErrors(translator)
        .map((e: any) => e.field)
        .filter((e: string) => !!e)
    ).toEqual(['firstName', 'lastName', 'email']);
  });

  it('should raise an error on invalid input', async () => {
    Object.assign(global.mockRequest, {
      body: {
        email: 'not an email',
        // Expecting 5 characters
        firstName: 'not',
        lastName: 'fail'
      }
    });
    await validateDto(SimpleDto)(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalled();
    const calls = (global.nextFunction as jest.Mock).mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(1);

    const e = calls[0][0] as DtoValidationError;
    expect(e.statusCode).toEqual(400);
    expect(
      e
        .serializeErrors(translator)
        .map((e: any) => e.field)
        .filter((e: string) => !!e)
    ).toEqual(['firstName', 'lastName', 'email']);
  });

  it('should not raise an error when ignoring missing fields', async () => {
    Object.assign(global.mockRequest, { body: {} });
    await validateDto(SimpleDto, { skipMissingProperties: true })(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalled();
  });

  it('should go to next handler when sending valid dto', async () => {
    Object.assign(global.mockRequest, {
      body: {
        email: 'valid@email.com',
        // Expecting 5 characters
        firstName: 'Jean-Neige',
        lastName: 'DOPPAMINE'
      }
    });
    await validateDto(SimpleDto)(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalled();
  });
});

/* eslint-disable */
export class SimpleDto {
  @IsString()
  @MinLength(5, { message: 'FirstName should be minimum of 5 characters' })
  // @ts-ignore
  firstName?: string;

  @IsString()
  @MinLength(5, { message: 'LastName should be minimum of 5 characters' })
  // @ts-ignore
  lastName?: string;

  @IsEmail({}, { message: 'Provided Email is not valid' })
  // @ts-ignore
  email?: string;
}
/* eslint-enable */
