/**
 *
 * Custom error object
 * @typedef {object} CustomError
 * @property {string} message.required - The error's message
 * @property {string} localeMessage.required - The error's message
 * @property {string} field - Field responsible for this error (when provided)
 * @property {any} value - Value of the field (when provided)
 */
export interface CustomError {
  message: string;
  localeMessage: string;
  field?: string;
  value?: any;
}
