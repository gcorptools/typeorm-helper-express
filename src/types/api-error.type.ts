import { CustomError } from './custom-error.type';

/**
 *
 * Representation of error sent by API
 * @typedef {object} ApiError
 * @property {string} requestId.required - UID associated to received request
 * @property {array<CustomError>} errors.required - The list of errors generated when running request
 */
export interface ApiError {
  requestId: string;
  errors: CustomError[];
}
