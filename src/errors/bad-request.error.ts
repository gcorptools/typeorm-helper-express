import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Received request from user is not valid
 * @typedef {object} BadRequestError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code - enum:400
 */
export class BadRequestError extends BaseCustomError {
  statusCode = 400;

  /**
   * Create an instance of BadRequestError
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   * @param {CustomError[]} fieldErrors extra fields errors
   */
  constructor(
    message: string = 'Provided inputs were not valid',
    localeMessage: string = TRANSLATION_KEYS.error.badRequest,
    fieldErrors: CustomError[] = []
  ) {
    super(message, localeMessage, fieldErrors);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }

  /**
   * Single error indicating that something went wrong with the input provided by user
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      { message: this.message, localeMessage: translator(this.localeMessage) },
      ...this._fieldErrors(translator)
    ];
  }
}
