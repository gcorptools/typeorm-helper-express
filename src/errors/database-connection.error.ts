import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { BaseCustomError } from './base-custom-error';

/**
 * Connection to database failed for some reason
 * @typedef {object} DatabaseConnectionError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code - enum:500
 */
export class DatabaseConnectionError extends BaseCustomError {
  statusCode = 500;

  /**
   * Create an instance of DatabaseConnectionError
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   */
  constructor(
    message: string = 'Error connecting to database',
    localeMessage: string = TRANSLATION_KEYS.error.databaseConnection
  ) {
    super(message, localeMessage);
    Object.setPrototypeOf(this, DatabaseConnectionError.prototype);
  }

  /**
   * Single error indicating that there was a problem when connecting to database
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      {
        message: 'Failed to connect to database',
        localeMessage: translator(this.localeMessage)
      }
    ];
  }
}
