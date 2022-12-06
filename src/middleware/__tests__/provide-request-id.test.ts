import { Request, Response } from 'express';
import { provideRequestId } from '..';

describe('Provide request ID', () => {
  it('should add ID to request and response', async () => {
    const req = global.mockRequest as Request;
    const res = new FakeResponse() as any as Response;
    expect(req.requestId).toBeUndefined();

    const headerName = 'Request-Id';
    expect(res.getHeader(headerName)).toBeUndefined();

    provideRequestId()(req, res, global.nextFunction);

    const requestId = req.requestId;
    expect(requestId).toBeDefined();
    expect(res.getHeader(headerName)).toEqual(requestId);
  });

  it('should add ID to response with specified header name', async () => {
    const req = global.mockRequest as Request;
    const res = new FakeResponse() as any as Response;
    expect(req.requestId).toBeUndefined();

    const headerName = 'Request-Test-Id';
    expect(res.getHeader(headerName)).toBeUndefined();

    provideRequestId(headerName)(req, res, global.nextFunction);

    const requestId = req.requestId;
    expect(requestId).toBeDefined();
    expect(res.getHeader(headerName)).toEqual(requestId);
  });

  class FakeResponse {
    private _headers: any = {};

    setHeader(name: string, value: any): void {
      this._headers = {
        ...this._headers,
        [name]: value
      };
    }

    getHeader(name: string): any {
      return this._headers[name];
    }
  }
});
