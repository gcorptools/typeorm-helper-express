import { Page } from '@gcorptools/typeorm-helper';
import { GenericDto } from '../dtos';
import { GenericModel } from '../models';
import { MappedFieldHelper, NestedFieldHelper } from './field.utils';

type Model<T> = T | T[] | Page<T>;

/**
 * Convert given records to expected DTO
 * @param {any} type target DTO type
 * @param {any} records the records to convert
 * @returns {any} the converted record/array/page
 */
export const toDto = <D extends GenericDto, T extends GenericModel>(
  type: new () => D,
  records: Model<T>
): Model<T> | Model<D> => {
  if (!records) {
    return records;
  }
  if (Array.isArray(records)) {
    return _toDtoArray(type, records);
  }
  if (_isPage(records)) {
    return _toDtoPage(type, records as Page<T>);
  }
  return _toDtoRecord(type, records as T);
};

const _isPage = (item: any): boolean => {
  const knownProperties = [
    'page',
    'size',
    'count',
    'data',
    'totalElements',
    'totalPages'
  ];
  const currentProperties = Object.getOwnPropertyNames(item);
  return (
    knownProperties.filter(
      (property: string) => !currentProperties.includes(property)
    ).length === 0
  );
};

const _toDtoPage = <D extends GenericDto, T extends GenericModel>(
  type: new () => D,
  page: Page<T>
): Page<D> => {
  const data = _toDtoArray(type, page.data);
  return {
    ...page,
    data
  };
};

const _toDtoArray = <D extends GenericDto, T extends GenericModel>(
  type: new () => D,
  records: T[]
): D[] => {
  return (records || []).map((record: T) => _toDtoRecord(type, record));
};

const _toDtoRecord = <D extends GenericDto, T extends GenericModel>(
  type: new () => D,
  record: T
): D => {
  const instance = new type();
  const recordValue = record as any;
  const ignoredFields = record.ignoredFields();
  const nestedFields = instance.nestedFields();
  const mappedFields = instance.mappedFields();

  const recordFields = Object.keys(recordValue);
  const extraFields = Object.keys(mappedFields);
  const fields = recordFields.concat(extraFields);

  const safeValues = fields
    .filter(
      (field: string) =>
        !ignoredFields.includes(field) || extraFields.includes(field)
    )
    .reduce((result: any, field: string) => {
      const fieldValue = _getFieldValue(
        field,
        recordValue,
        nestedFields,
        mappedFields
      );
      return { ...result, [field]: fieldValue };
    }, {});
  return Object.assign(instance, safeValues);
};

const _getFieldValue = (
  field: string,
  recordValue: any,
  nestedFields: Record<string, NestedFieldHelper>,
  mappedFields: Record<string, MappedFieldHelper>
) => {
  const mappedField = mappedFields[field];
  const nestedField = nestedFields[field];
  const fieldValue = recordValue[field];
  if (!!mappedField) {
    return mappedField.getter(recordValue);
  }
  if (!nestedField || !fieldValue) {
    return fieldValue;
  }
  if (nestedField.array) {
    return _toDtoArray(nestedField.builder, fieldValue);
  }
  return _toDtoRecord(nestedField.builder, fieldValue);
};
