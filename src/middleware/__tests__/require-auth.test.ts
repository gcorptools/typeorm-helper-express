import { Request, Response } from 'express';
import { UserCredentials } from '../../types';
import { requireAuth } from '..';
import { ForbiddenError, NotAuthorizedError } from '../../errors';

describe('Require auth', () => {
  it('should raise an error for anonymous user', async () => {
    await requireAuth()(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalledWith(new NotAuthorizedError());
  });

  it('should not raise any error when user is set', async () => {
    global.mockRequest.currentUser = {
      id: '1',
      username: 'an-email@mail.com'
    } as UserCredentials;
    await requireAuth()(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalled();
    expect(global.nextFunction).not.toHaveBeenCalledWith(
      new NotAuthorizedError()
    );
  });

  it('should check request against specific predicate if requested', async () => {
    global.mockRequest.currentUser = {
      id: '1',
      username: 'an-email@mail.com'
    } as UserCredentials;

    const validateRequest = jest
      .fn()
      .mockImplementation(
        async (req: Request, user: UserCredentials): Promise<boolean> => {
          const userId = req.params?.userId;
          return !!userId && userId === user.id;
        }
      );

    await requireAuth(validateRequest)(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalledWith(new ForbiddenError());
    expect(validateRequest).toHaveBeenCalledTimes(1);

    await requireAuth(validateRequest)(
      Object.assign(global.mockRequest, { params: { userId: '1' } }) as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(validateRequest).toHaveBeenCalledTimes(2);
    const calls = (global.nextFunction as jest.Mock).mock.calls;
    expect(calls[1][0]).toBeUndefined();
  });
});
