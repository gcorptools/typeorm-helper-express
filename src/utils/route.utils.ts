import { Page } from '@gcorptools/typeorm-helper';
import { Request, NextFunction } from 'express';
import { FindOptionsWhere, IsNull } from 'typeorm';
import { GenericDto } from '../dtos';
import {
  BuilderConfig,
  ExternalEndpointConfig,
  PartialBuilderConfig,
  PartialEndpointConfig
} from '../types';
import { toDto } from './dto.utils';

export const defaultExternalEndpointConfig = <T>(
  path: string,
  globalConfig?: BuilderConfig<T>
): ExternalEndpointConfig<T> => {
  let withDeleted;
  let softDelete;
  if (globalConfig) {
    withDeleted = globalConfig.defaultWithDeleted;
    softDelete = globalConfig.defaultSoftDelete;
  } else {
    withDeleted = async (req: Request) => false;
    softDelete = async (req: Request, resultData?: any) => false;
  }

  return {
    path,
    disabled: false,
    middleWares: [],
    loadBeforeDelete: false,
    beforeQuery: async (
      req: Request,
      next: NextFunction,
      data?: any,
      records?: T | T[]
    ) => {
      return {
        nextCalled: false,
        resultData: data
      };
    },
    afterQuery: async (records?: any | any[] | Page<T>, savedData?: any) => {
      return records;
    },
    withDeleted,
    softDelete
  };
};

export const toExternalEndpointConfig = <T>(
  path: string,
  providedConfig?: PartialEndpointConfig<T>,
  globalConfig?: BuilderConfig<T>
): ExternalEndpointConfig<T> => {
  const defaultConfig = defaultExternalEndpointConfig<T>(path, globalConfig);
  if (!providedConfig) {
    return defaultConfig;
  }
  return {
    ...defaultConfig,
    ...providedConfig
  };
};

export const toBuilderConfig = <T>(
  providedConfig?: PartialBuilderConfig<T>
): BuilderConfig<T> => {
  const defaultConfig: BuilderConfig<T> = {
    idField: 'id',
    globalMiddleWares: [],
    defaultRelations: [],
    defaultSelect: {},
    globalWhere: async (req: Request) => ({}),
    defaultWithDeleted: async (req: Request) => false,
    defaultSoftDelete: async (req: Request, resultData?: any) => false,
    readAll: {
      builderMethod: 'readAll',
      routerMethod: 'get',
      ...defaultExternalEndpointConfig('/all')
    },
    readOne: {
      builderMethod: 'readOne',
      routerMethod: 'get',
      ...defaultExternalEndpointConfig('/one')
    },
    readById: {
      builderMethod: 'readById',
      routerMethod: 'get',
      ...defaultExternalEndpointConfig('/:id')
    },
    readPage: {
      builderMethod: 'readPage',
      routerMethod: 'get',
      ...defaultExternalEndpointConfig('')
    },
    create: {
      builderMethod: 'create',
      routerMethod: 'post',
      ...defaultExternalEndpointConfig('')
    },
    update: {
      builderMethod: 'update',
      routerMethod: 'put',
      ...defaultExternalEndpointConfig('/:id')
    },
    patch: {
      builderMethod: 'patch',
      routerMethod: 'patch',
      ...defaultExternalEndpointConfig('/:id')
    },
    deleteAll: {
      builderMethod: 'deleteAll',
      routerMethod: 'delete',
      ...defaultExternalEndpointConfig('/all')
    },
    deleteById: {
      builderMethod: 'deleteById',
      routerMethod: 'delete',
      ...defaultExternalEndpointConfig('/:id')
    },
    deleteByIds: {
      builderMethod: 'deleteByIds',
      routerMethod: 'delete',
      ...defaultExternalEndpointConfig('')
    }
  };
  if (!providedConfig) {
    return defaultConfig;
  }
  const config = Object.keys(defaultConfig)
    .filter((key: string) => !(defaultConfig as any)[key].routerMethod)
    .reduce((result: any, key: string) => {
      const defaultValue = (defaultConfig as any)[key];
      const providedValue = (providedConfig as any)[key];
      // Normal field
      return {
        ...result,
        [key]: providedValue || defaultValue
      };
    }, {});
  return Object.keys(defaultConfig)
    .filter((key: string) => !!(defaultConfig as any)[key].routerMethod)
    .reduce((result: any, key: string) => {
      const defaultValue = (defaultConfig as any)[key];
      const providedValue = (providedConfig as any)[key];
      return {
        ...result,
        [key]: {
          ...defaultValue,
          ...toExternalEndpointConfig(defaultValue.path, providedValue, result)
        }
      };
    }, config);
};

/**
 * Enable soft deletion for a given endpoint
 * @param {Request} req the received request
 * @param {any} resultData data received by route builder
 * @returns {Promise<boolean>} always true
 */
export const enableSoftDelete = async (
  req: Request,
  resultData: any
): Promise<boolean> => true;

/**
 * Filters endpoints records for current logged user
 * @param {Request} req the received request
 * @param {Request} currentUserOptions options allowing to retrieve current user's records on endpoint model
 * @returns {FindOptionsWhere<T>} the options to apply on records of this endpoint
 */
export const ownerGlobalWhere = async <T>(
  req: Request,
  currentUserOptions: FindOptionsWhere<T>
): Promise<FindOptionsWhere<T>> => {
  const currentUser = req.currentUser;
  if (!currentUser) {
    // Impossible where
    return { id: IsNull() } as any;
  }
  // The other user can only browse their own records
  return currentUserOptions;
};

/**
 * Configuration to disable an endpoint
 * @returns {PartialEndpointConfig<T>} configuration to apply on route builder
 */
export const disabledEndpoint = <T>(): PartialEndpointConfig<T> => ({
  disabled: true
});

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
export const toDtoEndpointConfig = <D extends GenericDto, T>(
  type: new () => D
): PartialEndpointConfig<T> => ({
  afterQuery: async (records: any | any[] | Page<T>, savedData?: any) =>
    toDtoAfterQuery(type, records, savedData)
});
