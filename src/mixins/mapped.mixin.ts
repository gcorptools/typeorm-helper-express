import { getMapped, MappedFieldHelper } from '../utils';
import { Constructor, EmptyClass } from './generic.mixin';

export const MappedMixins = <T extends Constructor>(base?: T) => {
  const baseClass: any = base || EmptyClass;
  class Mapped extends baseClass {
    /**
     * List fields that should be considered as nested (these fields will be instanced before copy)
     * @returns {Record<string, MappedFieldHelper>} the list of nested fields
     */
    mappedFields(): Record<string, MappedFieldHelper> {
      const mappedFieldHelpers = getMapped(this);
      return mappedFieldHelpers.reduce(
        (
          result: Record<string, MappedFieldHelper>,
          helper: MappedFieldHelper
        ) => ({
          ...result,
          [helper.field]: helper
        }),
        {}
      );
    }
  }
  return Mapped;
};
