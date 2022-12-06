import 'reflect-metadata';

import { NextFunction, Request, Response } from 'express';

declare global {
  var mockRequest: Partial<Request>;
  var mockResponse: Partial<Response>;
  var nextFunction: NextFunction;
}

// Mock repositories and templates import with their fake version

/**
 * Creating in-memory mongo instance
 */
beforeAll(async () => {
  process.env.JWT_SECRET = 'alphabet';
});

beforeEach(() => {
  global.mockResponse = {
    status: jest.fn().mockImplementation((status: number) => {
      return global.mockResponse;
    }),
    send: jest.fn().mockImplementation((value: any) => {
      return global.mockResponse;
    })
  };
  global.mockRequest = {
    body: {},
    params: {},
    query: {},
    headers: {},
    __: jest
      .fn()
      .mockImplementation(
        (phraseOrOptions: any, ...replace: any[]) => `${phraseOrOptions}`
      )
  };
  global.nextFunction = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

// -----------------------------------------------------------------------------
// Global methods implementation
// -----------------------------------------------------------------------------
