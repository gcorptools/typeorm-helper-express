import { Request } from 'express';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

/**
 * Check the validity of the given token
 * @param {string} token the token to verify
 * @return {string | JwtPayload | null} a payload if valid token (else null)
 */
export const verifyJwtToken = (token: string): string | JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    return null;
  }
};

/**
 * Generate new JWT token
 * @param {any} data data to put in token
 * @param {SignOptions} options data to put in token
 * @param {string | undefined} key storing key in cookies (optional)
 * @param {Request | undefined} req request containing the cookies (optional)
 * @return {string}the string representation of the token
 */
export const newJwtToken = (
  data: any,
  options?: SignOptions,
  key?: string,
  req?: Request
): string => {
  const newToken = jwt.sign(
    data,
    // Exclamation mark for ensuring typescript
    // That we already checked this variable
    process.env.JWT_SECRET!,
    options
  );
  if (req && key) {
    req.session = {
      ...req.session,
      [key]: newToken
    };
  }
  return newToken;
};
