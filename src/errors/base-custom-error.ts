import { isEmpty } from '@gcorptools/typeorm-helper';
import { CustomError, TranslateMethod } from '../types';

/**
 * Base custom error
 * @typedef {object} BaseCustomError
 * @property {string} message.required - The error message
 * @property {string} localeMessage.required - The error translated message
 * @property {number} statusCode.required - The HTTP status code
 * @property {string} fieldErrors - The error translated message
 */
export abstract class BaseCustomError extends Error {
  /**
   * Get the appropriate status code to return
   */
  abstract statusCode: number;

  /**
   * Super constructor for custom errors
   * @param {string} message the message to display to user
   * @param {string} localeMessage the translated message
   */
  constructor(
    message: string,
    public localeMessage: string,
    public fieldErrors: CustomError[] = []
  ) {
    super(message);
    // Since we are inheriting a built-in object
    Object.setPrototypeOf(this, BaseCustomError.prototype);
  }

  /**
   * Get a generic-serialized version of the error
   * @param {TranslateMethod} translator method translating keys into sentences
   */
  abstract serializeErrors(translator: TranslateMethod): CustomError[];

  /**
   * Convert a normal message to a translation key
   * @param {string} field the field to remove from each message (if found at start)
   * @param {string} prefixKey the translation key prefix
   * @param {string[]} messages the list of messages
   * @param {TranslateMethod} translator method translating keys into sentences
   * @returns {string} a valid localeMessage
   */
  protected _toLocaleMessage(
    field: string,
    prefixKey: string,
    messages: string[],
    translator: TranslateMethod
  ): string {
    return messages
      .map((m: string) => (m.startsWith(field) ? m.slice(field.length + 1) : m))
      .map((m: string) => {
        const re = /\d+/g;
        const key = `${prefixKey}${m.replace(/\s/g, '_').replace(re, 'xyz')}`;
        const values = this._getMatchingValues(re, m);
        return translator(key, ...values);
      })
      .join(', ');
  }

  protected _fieldErrors(translator: TranslateMethod): CustomError[] {
    if (isEmpty(this.fieldErrors)) {
      return [];
    }
    return this.fieldErrors.map((e: CustomError) => {
      let values = e.value || [];
      values = Array.isArray(values) ? values : [values];
      return {
        ...e,
        localeMessage: translator(e.localeMessage, ...values)
      };
    });
  }

  private _getMatchingValues(re: RegExp, value: string): any[] {
    const values = [];
    let match = null;
    do {
      match = re.exec(value);
      if (match !== null) {
        values.push(match[0]);
      }
    } while (match != null);
    return values;
  }
}
