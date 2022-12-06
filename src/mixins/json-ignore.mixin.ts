import { getJsonIgnoredFields } from '@gcorptools/typeorm-helper';
import { getNested, NestedFieldHelper } from '../utils';
import { Constructor, EmptyClass } from './generic.mixin';

export const JsonIgnoreMixins = <T extends Constructor>(base?: T) => {
  const baseClass: any = base || EmptyClass;
  class JsonIgnore extends baseClass {
    /**
     * List fields that should be considered as nested (these fields will be instanced before copy)
     * @returns {Record<string, NestedFieldHelper>} the list of nested fields
     */
    nestedFields(): Record<string, NestedFieldHelper> {
      const nestedFieldHelpers = getNested(this);
      return nestedFieldHelpers.reduce(
        (
          result: Record<string, NestedFieldHelper>,
          helper: NestedFieldHelper
        ) => ({
          ...result,
          [helper.field]: helper
        }),
        {}
      );
    }

    /**
     * Override JS method for object serialization into JSON
     * @returns the object JSON representation
     */
    toJSON(): { [name: string]: any } {
      const json: any = {};
      const ignoredFields: string[] = getJsonIgnoredFields(this);
      Object.keys(this)
        .filter((field: string) => !ignoredFields.includes(field))
        .forEach((field: string) => {
          json[field] = (this as any)[field];
        });
      return json;
    }
  }

  return JsonIgnore;
};
