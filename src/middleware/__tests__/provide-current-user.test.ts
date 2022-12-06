import { Request, Response } from 'express';
import { provideCurrentUser } from '..';
import { newJwtToken } from '../../utils';

describe('Provide current user', () => {
  it('should not set user if no (valid) JWT session provided', async () => {
    await provideCurrentUser()(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockRequest.currentUser).toBeUndefined();

    process.env.JWT_SECRET = 'a secret';
    global.mockRequest.session = {
      jwt: 'fake token'
    };
    process.env.JWT_SECRET = 'a secret';
    await provideCurrentUser()(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockRequest.currentUser).toBeUndefined();
  });

  it('should set request current user if JWT session provided', async () => {
    process.env.JWT_SECRET = 'another secret';
    const userData = {
      id: '1',
      email: 'fake-email@mail.com'
    };
    const token = newJwtToken(
      userData,
      {},
      'jwt',
      global.mockRequest as Request
    );
    global.mockRequest.session = {
      jwt: token
    };
    await provideCurrentUser()(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockRequest.currentUser).toBeDefined();
    expect(global.mockRequest.currentUser?.id).toEqual('1');
  });

  it('should set request current user if Header provided', async () => {
    process.env.JWT_SECRET = 'another secret';
    const userData = {
      id: '1',
      email: 'fake-email@mail.com'
    };
    const token = newJwtToken(userData, {});
    global.mockRequest.headers = {
      authorization: `Bearer ${token}`
    };
    await provideCurrentUser()(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.mockRequest.currentUser).toBeDefined();
    expect(global.mockRequest.currentUser?.id).toEqual('1');
  });
});
