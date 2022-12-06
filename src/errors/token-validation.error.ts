import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Given token did not match expectations
 * @typedef {object} TokenValidationError
 * @property {string} message.required - The error message
 * @property {number} statusCode.required - The HTTP status code - enum:400
 */
export class TokenValidationError extends BaseCustomError {
  statusCode = 401;

  /**
   * Create an instance of TokenValidationError
   * @param {string} message the message to display to user
   * @property {string} localeMessage.required - The error translated message
   * @param {string} localeMessage the translated message
   */
  constructor(
    message: string = 'Invalid token received',
    localeMessage: string = TRANSLATION_KEYS.error.tokenValidation
  ) {
    super(message, localeMessage);
    Object.setPrototypeOf(this, TokenValidationError.prototype);
  }

  /**
   * List of all validation issues happening on DTO validation
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      {
        message: 'Invalid or expired token received',
        localeMessage: translator(this.localeMessage)
      }
    ];
  }
}
