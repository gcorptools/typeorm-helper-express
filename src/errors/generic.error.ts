import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Generic error when no specific one available
 * @typedef {object} GenericError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code
 */
export class GenericError extends BaseCustomError {
  statusCode: number;

  /**
   * Create an instance of GenericError
   * @param {string} message the message to display to user
   * @param {string} statusCode the HTTP status code
   * @param {string} localeMessage the translated message
   */
  constructor(
    message: string = 'Unexpected error occurred',
    statusCode: number = 500,
    localeMessage: string = TRANSLATION_KEYS.error.generic
  ) {
    super(message, localeMessage);
    this.statusCode = statusCode >= 400 ? statusCode : 500;
    Object.setPrototypeOf(this, GenericError.prototype);
  }

  /**
   * Single error indicating that something went wrong with the input provided by user
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      { message: this.message, localeMessage: translator(this.localeMessage) }
    ];
  }
}
