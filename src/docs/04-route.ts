import { Request } from 'express';
import { Page } from '@gcorptools/typeorm-helper';
import { RouteBuilder } from '../builders';
import { VALIDATION_GROUPS } from '../constants';
import { GenericDto } from '../dtos';
import {
  provideCurrentUser,
  requireAuth,
  requireRole,
  validateDto
} from '../middleware';
import { PartialEndpointConfig } from '../types';
import { toDto } from '../utils';
import { Country } from './01-model';
import { countryRepository } from './02-repository';
import { CountryDto } from './03-dto';
import { UserRole } from './00-test-utils';

const administratorOnlyPath: PartialEndpointConfig<Country> = {
  middleWares: [
    provideCurrentUser(),
    requireAuth(),
    requireRole([UserRole.ADMINISTRATOR])
  ]
};

export const COUNTRIES = '/countries';

const administratorOnlyWithDeleted = async (req: Request): Promise<boolean> => {
  const currentUser = req.currentUser;
  if (!currentUser) {
    return false;
  }
  return (
    [UserRole.ADMINISTRATOR].includes(currentUser.role) &&
    !!req.query?.withDeleted
  );
};

/**
 * Convert result to return into expected DTO
 * @param {new () => D} type expected DTO class
 * @param {any | any[] | Page<T>} records the object to convert (a single record, a list of records or a page of records)
 * @param {any} savedData savedData coming from before Query
 * @returns the converted object
 */
export const toDtoAfterQuery = async <D extends GenericDto, T>(
  type: new () => D,
  records: any | any[] | Page<T>,
  savedData?: any
) => {
  const dtoRecords = toDto(type, records);
  return dtoRecords;
};

/**
 * Get an endpoint config with afterQuery converting object to DTO
 * @param {new () => D} type expected DTO class
 * @returns {PartialEndpointConfig<T>} the configuration to apply in route builder
 */
const toDtoEndpointConfig = <D extends GenericDto, T>(
  type: new () => D
): PartialEndpointConfig<T> => ({
  afterQuery: async (records: any | any[] | Page<T>, savedData?: any) =>
    toDtoAfterQuery(type, records, savedData)
});

const router = new RouteBuilder<Country>(COUNTRIES, () => countryRepository, {
  defaultWithDeleted: administratorOnlyWithDeleted,
  create: {
    ...administratorOnlyPath,
    ...toDtoEndpointConfig(CountryDto),
    middleWares: administratorOnlyPath.middleWares!.concat(
      validateDto(CountryDto, {
        groups: [VALIDATION_GROUPS.create, VALIDATION_GROUPS.default]
      })
    )
  },
  patch: {
    ...administratorOnlyPath,
    ...toDtoEndpointConfig(CountryDto),
    middleWares: administratorOnlyPath.middleWares!.concat(
      validateDto(CountryDto, {
        groups: [VALIDATION_GROUPS.patch, VALIDATION_GROUPS.default]
      })
    )
  },
  update: {
    ...administratorOnlyPath,
    ...toDtoEndpointConfig(CountryDto),
    middleWares: administratorOnlyPath.middleWares!.concat(
      validateDto(CountryDto, {
        groups: [VALIDATION_GROUPS.update, VALIDATION_GROUPS.default]
      })
    )
  },

  readById: toDtoEndpointConfig(CountryDto),
  readOne: toDtoEndpointConfig(CountryDto),
  readPage: toDtoEndpointConfig(CountryDto),
  readAll: toDtoEndpointConfig(CountryDto),

  deleteById: administratorOnlyPath,
  deleteByIds: administratorOnlyPath,
  deleteAll: administratorOnlyPath
}).build();

export { router as countriesRouter };
