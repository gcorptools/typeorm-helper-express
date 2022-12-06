import { newJwtToken, verifyJwtToken } from '..';

describe('Token utils', () => {
  const _setEnv = () => (process.env.JWT_SECRET = 'a secret');

  it('should fail with invalid payload', async () => {
    _setEnv();
    expect(() => newJwtToken(null)).toThrowError();
  });

  it('should generate new token', async () => {
    _setEnv();
    const req: any = {};
    const key = 'jwt';
    expect(newJwtToken({})).toBeDefined();
    expect(newJwtToken({}, {}, key)).toBeDefined();
    expect(newJwtToken({}, {}, key, req)).toBeDefined();
    expect(req.session[key]).toBeDefined();
  });

  it('should be able to verify token authenticity', async () => {
    expect(verifyJwtToken('Invalid token')).toBeNull();
    _setEnv();
    const token = newJwtToken({ working: 'token' });
    expect(verifyJwtToken(token)).toBeDefined();
    process.env.JWT_SECRET = undefined;
    expect(verifyJwtToken(token)).toBeNull();
  });
});
