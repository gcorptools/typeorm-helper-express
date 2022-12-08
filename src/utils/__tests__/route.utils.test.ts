import {
  defaultExternalEndpointConfig,
  disabledEndpoint,
  enableSoftDelete,
  ownerGlobalWhere,
  toBuilderConfig,
  toDtoAfterQuery,
  toDtoEndpointConfig,
  toExternalEndpointConfig
} from '..';
import { Request, NextFunction } from 'express';
import {
  BuilderConfig,
  EndpointConfig,
  ExternalEndpointConfig
} from '../../types';
import { GenericDto } from '../../dtos';
import { GenericModel } from '../../models';
import { Page } from '@gcorptools/typeorm-helper';
import { FindOperator, FindOptionsWhere, IsNull } from 'typeorm';

describe('Route utils', () => {
  const request = {} as Request;
  const next = {} as NextFunction;

  it('should have default config', async () => {
    const defaultConfig = defaultExternalEndpointConfig('/any-path');
    expect(defaultConfig).toBeDefined();
    expect(defaultConfig.disabled).toEqual(false);
    expect(defaultConfig.middleWares).toBeDefined();
    const data = { a: 1, b: 2 };
    const { resultData, savedData, nextCalled } =
      await defaultConfig.beforeQuery(request, next, data);
    expect(resultData).toEqual(data);
    expect(savedData).toBeUndefined();
    expect(nextCalled).toEqual(false);

    const records = [{ a: 1 }, { b: 2 }];
    const result = await defaultConfig.afterQuery(records, data);
    expect(result).toEqual(records);
  });

  it('should get safe endpoint config', async () => {
    const path = '/any-path';

    let endpointConfig = toExternalEndpointConfig(path);
    expect(_checkExternalEndpointConfig(endpointConfig, path)).toEqual(true);

    const newPath = '/new-path';
    endpointConfig = toExternalEndpointConfig(path, {
      path: newPath
    });
    expect(_checkExternalEndpointConfig(endpointConfig, newPath)).toEqual(true);
  });

  it('should get safe builder config', async () => {
    // Builder with nothing
    let builderConfig = toBuilderConfig();
    expect(await _checkBuilderConfig(builderConfig, 'id')).toEqual(true);

    // Builder with ID
    const uid = 'uid';
    builderConfig = toBuilderConfig({ idField: uid });
    expect(await _checkBuilderConfig(builderConfig, uid)).toEqual(true);

    // Builder with some disable route
    builderConfig = toBuilderConfig({
      idField: uid,
      readById: { disabled: true },
      create: { path: 'create' },
      deleteAll: undefined,
      deleteByIds: {}
    });
    expect(await _checkBuilderConfig(builderConfig, uid)).toEqual(true);

    // Builder with custom methods
    const complicated = 'complicated';
    builderConfig = toBuilderConfig({
      idField: complicated,
      globalMiddleWares: [1, 2],
      globalWhere: async (req: Request) => ({ [complicated]: true } as any),
      defaultSoftDelete: async (req: Request, resultData?: any) => ({
        ...resultData,
        ok: true
      }),
      defaultWithDeleted: async (req: Request) => !!req.query
    });
    expect(await _checkBuilderConfig(builderConfig, complicated)).toEqual(true);
  });

  it('should give same result on default methods', async () => {
    // Defining default methods
    const defaultSoftDelete = async (req: Request, resultData?: any) =>
      !!resultData && !!resultData.ok;
    const defaultWithDeleted = async (req: Request) =>
      !!req.query && !!req.query.ok;

    // Defining builder
    const builderConfig = toBuilderConfig({
      defaultSoftDelete,
      defaultWithDeleted
    });
    expect(builderConfig).toBeDefined();
    const req = global.mockRequest as Request;

    // Simple request
    let defaultSofDeleteResult = await builderConfig.defaultSoftDelete(req, {});
    expect(defaultSofDeleteResult).toEqual(false);
    let defaultWithDeletedResult = await builderConfig.defaultWithDeleted(req);
    expect(defaultWithDeletedResult).toEqual(false);

    // Testing inner methods
    expect(await builderConfig.readById.softDelete(req, {})).toEqual(
      defaultSofDeleteResult
    );
    expect(await builderConfig.readById.withDeleted(req)).toEqual(
      defaultWithDeletedResult
    );

    // With query and resultData
    Object.assign(req, { query: { ok: true } });
    defaultSofDeleteResult = await builderConfig.defaultSoftDelete(req, {
      ok: true
    });
    expect(defaultSofDeleteResult).toEqual(true);
    defaultWithDeletedResult = await builderConfig.defaultWithDeleted(req);
    expect(defaultWithDeletedResult).toEqual(true);

    // Testing inner methods
    expect(await builderConfig.readById.softDelete(req, { ok: true })).toEqual(
      defaultSofDeleteResult
    );
    expect(await builderConfig.readById.withDeleted(req)).toEqual(
      defaultWithDeletedResult
    );
  });

  const _checkBuilderConfig = async <T>(
    config: BuilderConfig<T>,
    idField: string
  ): Promise<boolean> => {
    expect(config).toBeDefined();
    expect(config.idField).toEqual(idField);
    expect(config.globalMiddleWares).toBeDefined();
    expect(await config.globalWhere(request)).toBeDefined();
    expect(await config.defaultWithDeleted(request)).toBeDefined();
    expect(await config.defaultSoftDelete(request, {})).toBeDefined();

    const builderFields = 10;
    const baseBuilderFields = 7;
    const fields = Object.keys(config);
    expect(fields.length).toEqual(builderFields + baseBuilderFields);

    fields
      .filter(
        (field: string) =>
          ![
            'idField',
            'globalMiddleWares',
            'defaultRelations',
            'defaultSelect',
            'globalWhere',
            'defaultWithDeleted',
            'defaultSoftDelete'
          ].includes(field)
      )
      .forEach((field: string) => {
        const endpointConfig = (config as any)[field];
        expect(
          _checkExternalEndpointConfig(
            endpointConfig,
            endpointConfig.path,
            true
          )
        ).toEqual(true);
      });
    return true;
  };

  const _checkExternalEndpointConfig = <T>(
    config: ExternalEndpointConfig<T>,
    path: string,
    hasInternal: boolean = false
  ): boolean => {
    const fieldsNumber = hasInternal ? 9 : 7;
    expect(config).toBeDefined();
    expect(config.path).toEqual(path);
    expect(config.middleWares).toBeDefined();
    expect(config.disabled).toBeDefined();
    expect(config.beforeQuery).toBeDefined();
    expect(config.afterQuery).toBeDefined();
    expect(Object.keys(config).length).toEqual(fieldsNumber);
    if (hasInternal) {
      const endpointConfig = config as EndpointConfig<T>;
      expect(endpointConfig.builderMethod).toBeDefined();
      expect(endpointConfig.routerMethod).toBeDefined();
    }
    return true;
  };

  it('should return true for enableSoftDelete', async () => {
    expect(await enableSoftDelete(global.mockRequest as Request, null)).toEqual(
      true
    );
  });

  it('should return disabled for disabledEndpoint', async () => {
    expect(disabledEndpoint()).toEqual({ disabled: true });
  });

  it('should transform objects to DTO', async () => {
    const record: SampleModel = Object.assign(new SampleModel(), {
      id: 1,
      name: 'record-1'
    });
    const dto = await toDtoAfterQuery<SampleDto, SampleModel>(
      SampleDto,
      record,
      null
    );
    expect(dto instanceof SampleDto).toEqual(true);
    expect(dto.name).toEqual(record.name);

    const records: SampleModel[] = [record, record];
    const dtos = await toDtoAfterQuery<SampleDto, SampleModel>(
      SampleDto,
      records,
      true
    );
    expect(dtos.length).toEqual(records.length);
    dtos.forEach((d: SampleDto) => {
      expect(d instanceof SampleDto).toEqual(true);
      expect(d.name).toEqual(record.name);
    });

    const page: Page<SampleModel> = {
      page: 1,
      size: 2,
      count: 2,
      data: records,
      totalPages: 2,
      totalElements: 3
    };
    const pageDto = await toDtoAfterQuery<SampleDto, SampleModel>(
      SampleDto,
      page,
      {}
    );
    expect(pageDto.totalElements).toEqual(page.totalElements);
  });

  it('should return safe config for toDtoEndpointConfig', async () => {
    const { afterQuery } = toDtoEndpointConfig<SampleDto, SampleModel>(
      SampleDto
    );
    const record: SampleModel = Object.assign(new SampleModel(), {
      id: 1,
      name: 'record'
    });
    const dto = await afterQuery!(record, null);
    expect(dto instanceof SampleDto).toEqual(true);
    expect(dto.name).toEqual(record.name);
  });

  it('should return options when user is owner for ownerGlobalWhere', async () => {
    let req = global.mockRequest as Request;
    const currentUserOptions: FindOptionsWhere<SampleModel> = {
      id: 1
    };
    let options = await ownerGlobalWhere<SampleModel>(req, currentUserOptions);
    expect(options.id instanceof FindOperator).toEqual(true);

    Object.assign(req, { currentUser: { id: 'a' } });
    options = await ownerGlobalWhere<SampleModel>(req, currentUserOptions);
    expect(options).toEqual(currentUserOptions);
  });
});

class SampleModel extends GenericModel {
  id!: number;
  name!: string;
}

class SampleDto extends GenericDto {
  id!: number;
  name!: string;
}
