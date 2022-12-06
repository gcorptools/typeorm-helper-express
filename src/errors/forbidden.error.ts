import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Anonymous user not authorized for this operation
 * @typedef {object} ForbiddenError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code - enum:403
 */
export class ForbiddenError extends BaseCustomError {
  statusCode = 403;

  /**
   * Create an instance of ForbiddenError
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   */
  constructor(
    message: string = 'User do not have required accesses',
    localeMessage: string = TRANSLATION_KEYS.error.forbidden
  ) {
    super(message, localeMessage);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }

  /**
   * Single error indicating that resource access is not forbidden
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      { message: 'Forbidden', localeMessage: translator(this.localeMessage) }
    ];
  }
}
