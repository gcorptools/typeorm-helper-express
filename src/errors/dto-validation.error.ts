import { TRANSLATION_KEYS } from '../constants';
import { CustomError, TranslateMethod } from '../types';
import { ValidationError } from 'class-validator';
import { BaseCustomError } from './base-custom-error';

/**
 * Given input did not match DTO specs
 * @typedef {object} DtoValidationError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code - enum:400
 */
export class DtoValidationError extends BaseCustomError {
  statusCode = 400;

  /**
   * Create an instance of DtoValidationError
   * @param {ValidationError[]} _errors the list of errors generated by class-validator
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   */
  constructor(
    private _errors: ValidationError[],
    message: string = 'Invalid input received',
    localeMessage: string = TRANSLATION_KEYS.error.dtoValidation
  ) {
    super(message, localeMessage);
    Object.setPrototypeOf(this, DtoValidationError.prototype);
  }

  /**
   * List of all validation issues happening on DTO validation
   * @param {TranslateMethod} translator method translating keys into sentences
   * @return {CustomError[]} an array of current errors
   */
  override serializeErrors(translator: TranslateMethod): CustomError[] {
    return [
      {
        message: this.message,
        localeMessage: translator(this.localeMessage)
      }
    ].concat(
      this._errors.map((error: ValidationError) => {
        const messages = (Object as any).values(error.constraints);
        const message = messages.join(', ');
        const field = error.property;
        // Remove field from message since we do not want to translate all fields
        const localeMessage = this._toLocaleMessage(
          field,
          'validation.',
          messages,
          translator
        );
        return {
          message,
          localeMessage,
          field
        };
      })
    );
  }
}
