import { BaseModel, getJsonIgnoredFields } from '@gcorptools/typeorm-helper';

export type Constructor = new (...args: any[]) => {};

export class EmptyClass {}

export const BaseMixins = () => {
  class Base extends BaseModel {
    /**
     * List fields that should be ignored when copying in DTO
     * @returns {string[]} list of fields not copied
     */
    ignoredFields(): string[] {
      return getJsonIgnoredFields(this);
    }
  }
  return Base;
};
