import { Page } from '@gcorptools/typeorm-helper';
import { Request, NextFunction } from 'express';
import {
  BuilderConfig,
  ExternalEndpointConfig,
  PartialBuilderConfig,
  PartialEndpointConfig
} from '../types';

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
