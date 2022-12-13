import { Request, Response } from 'express';
import { UserCredentials } from '../../types';
import { requireRole } from '..';
import { ForbiddenError } from '../../errors';

const UserRole = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  CUSTOMER: 'CUSTOMER'
};

describe('Require role', () => {
  it('should raise an error for anonymous user', async () => {
    await requireRole([])(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalledWith(new ForbiddenError());
  });

  it('should raise error when user is set with bad role', async () => {
    global.mockRequest.currentUser = {
      id: '1',
      username: 'an-email@mail.com'
    } as UserCredentials;
    await requireRole([])(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalled();
    expect(global.nextFunction).toHaveBeenCalledWith(new ForbiddenError());
  });

  it('should not raise error for users with correct role', async () => {
    global.mockRequest.currentUser = {
      id: '1',
      username: 'an-email@mail.com',
      roles: [UserRole.ADMINISTRATOR]
    } as UserCredentials;

    await requireRole([UserRole.ADMINISTRATOR])(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).not.toHaveBeenCalledWith(new ForbiddenError());

    global.mockRequest.currentUser = {
      id: '1',
      username: 'an-email@mail.com',
      roles: [UserRole.CUSTOMER]
    } as UserCredentials;
    await requireRole([UserRole.ADMINISTRATOR])(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    expect(global.nextFunction).toHaveBeenCalledWith(new ForbiddenError());
  });

  it('should apply strict rules when requested', async () => {
    global.mockRequest.currentUser = {
      id: '1',
      username: 'an-email@mail.com',
      roles: [UserRole.CUSTOMER, UserRole.ADMINISTRATOR, 'UNKNOWN']
    } as UserCredentials;

    await requireRole([UserRole.ADMINISTRATOR, UserRole.CUSTOMER])(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    // Because at least one role is in allowed roles
    expect(global.nextFunction).not.toHaveBeenCalledWith(new ForbiddenError());

    await requireRole([UserRole.ADMINISTRATOR, UserRole.CUSTOMER], true)(
      global.mockRequest as Request,
      global.mockResponse as Response,
      global.nextFunction
    );
    // Because UNKNOWN role is not allowed
    expect(global.nextFunction).toHaveBeenCalledWith(new ForbiddenError());
  });
});
