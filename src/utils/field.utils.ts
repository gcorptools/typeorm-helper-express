import 'reflect-metadata';

export interface NestedFieldHelper {
  field: string;
  array: boolean;
  builder: new () => any;
}

export interface MappedFieldHelper {
  field: string;
  getter: (data: any) => any;
}

/**
 * Annotates entities column fields with this decorator in order to
 * map its value from a given object.
 *
 */
export const mapped =
  (getter: (data: any) => any) =>
  (target: unknown | any, field: string): any => {
    const _constructor = target.constructor;
    const helper: MappedFieldHelper = {
      field,
      getter
    };
    _defineMetadata(MAPPED_METADATA_KEY, _constructor, field, helper);
  };

/**
 * Get a list of fields that are mapped
 * @param {unknown | any} target the class/instance on which we're looking for metadata
 * @returns {MappedFieldHelper[]} the metadata information for this whole class inheritance (current and parents)
 */
export const getMapped = (target: unknown | any): MappedFieldHelper[] => {
  return Object.values(_getMetadata(MAPPED_METADATA_KEY, target));
};

/**
 * Annotates entities column fields with this decorator in order to
 * indicates that they are nested field their serialization (override of toJSON).
 *
 */
export const nested =
  (builder: new () => any, array: boolean = false) =>
  (target: unknown | any, field: string): any => {
    const _constructor = target.constructor;
    const helper: NestedFieldHelper = {
      field,
      array,
      builder
    };
    _defineMetadata(NESTED_METADATA_KEY, _constructor, field, helper);
  };

/**
 * Get a list of fields that are nested
 * @param {unknown | any} target the class/instance on which we're looking for metadata
 * @returns {NestedFieldHelper[]} the metadata information for this whole class inheritance (current and parents)
 */
export const getNested = (target: unknown | any): NestedFieldHelper[] => {
  return Object.values(_getMetadata(NESTED_METADATA_KEY, target));
};

const _getMetadata = (symbol: Symbol, target: unknown | any): any => {
  return Reflect.getMetadata(symbol, target.constructor) || {};
};

const _defineMetadata = (
  symbol: Symbol,
  _constructor: any,
  field: string,
  helper: NestedFieldHelper | MappedFieldHelper
): void => {
  const currentHelper = Reflect.getMetadata(symbol, _constructor) || {};
  // 2- Defensive copy in order to avoid setting value on all inheritance tree
  const newHelper = { ...currentHelper };
  newHelper[field] = helper;

  // 2- Define metadata for given class with new value
  Reflect.defineMetadata(symbol, newHelper, _constructor);
};

const NESTED_METADATA_KEY = Symbol('nested');
const MAPPED_METADATA_KEY = Symbol('mapped');
