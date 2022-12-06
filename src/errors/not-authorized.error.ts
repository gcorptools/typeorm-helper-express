import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Current user not authorized for this operation
 * @typedef {object} NotAuthorizedError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code - enum:401
 */
export class NotAuthorizedError extends BaseCustomError {
  statusCode = 401;

  /**
   * Create an instance of NotAuthorizedError
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   */
  constructor(
    message: string = 'Anonymous not allowed',
    localeMessage: string = TRANSLATION_KEYS.error.notAuthorized
  ) {
    super(message, localeMessage);
    Object.setPrototypeOf(this, NotAuthorizedError.prototype);
  }

  /**
   * Single error indicating that resource access is not allowed
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      { message: this.message, localeMessage: translator(this.localeMessage) }
    ];
  }
}
