import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Current resource did not exist
 * @typedef {object} NotFoundError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code - enum:404
 */
export class NotFoundError extends BaseCustomError {
  statusCode = 404;

  /**
   * Create an instance of NotFoundError
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   * @param {CustomError[]} fieldErrors extra fields errors
   */
  constructor(
    message: string = 'Resource not found',
    localeMessage: string = TRANSLATION_KEYS.error.notFound,
    fieldErrors: CustomError[] = []
  ) {
    super(message, localeMessage, fieldErrors);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }

  /**
   * Single error indicating that resource weren't found
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      { message: 'Not found', localeMessage: translator(this.localeMessage) },
      ...this._fieldErrors(translator)
    ];
  }
}
