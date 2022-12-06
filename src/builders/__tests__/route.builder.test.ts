import request from 'supertest';
import {
  BaseModel,
  BaseRepository,
  SortDirection
} from '@gcorptools/typeorm-helper';
import {
  Column,
  DataSource,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm';
import { RouteBuilder } from '..';
import { IBackup, IMemoryDb, newDb } from 'pg-mem';
import express, { Request, Response, NextFunction, Application } from 'express';
import { json } from 'body-parser';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  GenericError
} from '../../errors';
import { errorHandler } from '../../middleware';
import { PartialBuilderConfig } from '../../types';

const RESTRICTION_MESSAGE = 'Method Restricted In Test';

describe('Route builder', () => {
  let db: IMemoryDb;
  let backup: IBackup;
  let connection: DataSource;

  let fakeRepository: BaseRepository<FakeModel>;
  let standardBuilder: RouteBuilder<FakeModel>;
  let restrictiveBuilder: RouteBuilder<FakeModel>;
  let singleRouteBuilder: RouteBuilder<FakeModel>;

  let req: Request;
  let res: Response;
  let next: NextFunction;

  it('should create new instance', async () => {
    const builderFields = 10;
    const baseBuilderFields = 7;
    const internalEndpointFields = 2;
    const externalEndpointFields = 5;

    for (const builder of [
      standardBuilder,
      restrictiveBuilder,
      singleRouteBuilder
    ]) {
      expect(builder).toBeDefined();
      const config = builder['_configs'];
      // Should have all properties
      expect(config).toBeDefined();

      const fields = Object.keys(config);
      expect(fields.length).toEqual(builderFields + baseBuilderFields);
      const methodFields = fields.filter(
        (field: string) => !!(config as any)[field].builderMethod
      );
      expect(methodFields.length).toEqual(builderFields);
      methodFields.every(
        (method: string) =>
          Object.keys((config as any)[method]).length ===
          internalEndpointFields + externalEndpointFields
      );
    }
  });

  it('should read by ID', async () => {
    // 1- No ID provided in request
    await standardBuilder.readById(req, res, next);
    let error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 2- ID does not exist in database
    Object.assign(req, { params: { id: '1' } });
    await standardBuilder.readById(req, res, next);
    error = getMockCalls(global.nextFunction)[1][0];
    expect(error instanceof NotFoundError).toEqual(true);

    // 3- With existing ID
    await createRecords(1);
    await standardBuilder.readById(req, res, next);
    const response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.id).toEqual(1);
  });

  it('should read one', async () => {
    // 1- No data in database
    await standardBuilder.readOne(req, res, next);
    const error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof NotFoundError).toEqual(true);

    // 2- With records in database
    const records = await createRecords(20);
    expect(records.length).toEqual(20);

    await standardBuilder.readOne(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.id).toEqual(1);

    // 3- With descending order
    Object.assign(req, { query: { sorts: ['id,desc', 'name', 'version,'] } });
    await standardBuilder.readOne(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.id).toEqual(20); // Last ID first

    // 4- With filter
    Object.assign(req, {
      query: {
        filters: [['name[like]"%3%"'], ['version[lt]2']],
        sorts: ['id,desc']
      }
    });
    // Name like 3 => ID=3 or ID=13
    // Version < 2 => ID=1
    // In a OR operation sorted in descending order of IDs, it should be 13
    await standardBuilder.readOne(req, res, next);
    response = getMockCalls(global.mockResponse.send)[2][0];
    expect(response.id).toEqual(13); // Second item or first item, applying sorting make it second
  });

  it('should read page', async () => {
    // 1- No data in database
    await standardBuilder.readPage(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.totalElements).toEqual(0);

    // 2- With records in database
    const records = await createRecords(20);
    expect(records.length).toEqual(20);

    // 3- Read second page
    Object.assign(req, { query: { page: 1, size: 3 } });
    await standardBuilder.readPage(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.totalElements).toEqual(20);
    expect(response.data[0].id).toEqual(4);
    expect(response.data.length).toEqual(3);
    expect(response.totalPages).toEqual(7);
  });

  it('should read all', async () => {
    // 1- No data in database
    await standardBuilder.readAll(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.length).toEqual(0);

    // 2- With records in database
    const records = await createRecords(20);
    expect(records.length).toEqual(20);

    // 3- Read all (page parameters should be ignored=
    Object.assign(req, { query: { page: 1, size: 3 } });
    await standardBuilder.readAll(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.length).toEqual(20);
    expect(response[0].id).toEqual(1);
  });

  it('should create record', async () => {
    // 1- No data sent
    try {
      await standardBuilder.create(req, res, next);
      fail('Not supposed to come here');
    } catch (e) {
      expect(e).toBeDefined();
    }

    // 2- Real data
    const name = 'A name';
    const version = 4;
    Object.assign(req, { body: { name, version } });
    await standardBuilder.create(req, res, next);
    const status = getMockCalls(global.mockResponse.status)[0][0];
    expect(status).toEqual(201);

    const response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.id).toBeDefined();
    expect(response.name).toEqual(name);
    expect(response.version).toEqual(version);
  });

  it('should update record', async () => {
    // 1- No ID sent
    await standardBuilder.update(req, res, next);
    let error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 2- No existing record
    const name = 'A name';
    const version = 4;
    Object.assign(req, { body: { name, version }, params: { id: '1' } });
    await standardBuilder.update(req, res, next);
    error = getMockCalls(global.nextFunction)[1][0];
    expect(error instanceof NotFoundError).toEqual(true);

    // 3- No data sent
    const record = (await createRecords(1))[0];
    expect(record.name).not.toEqual(name);
    expect(record.version).not.toEqual(version);

    Object.assign(req, { body: undefined });
    await standardBuilder.update(req, res, next);
    error = getMockCalls(global.nextFunction)[2][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 4- Existing record
    Object.assign(req, { body: { name, version }, params: { id: '1' } });
    await standardBuilder.update(req, res, next);
    const response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.id).toEqual(record.id);
    expect(response.name).toEqual(name);
    expect(response.version).toEqual(version);
  });

  it('should patch record', async () => {
    // 1- No ID sent
    await standardBuilder.patch(req, res, next);
    let error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 2- No existing record
    const name = 'A patch';
    const version = 5;
    Object.assign(req, { body: { name, version }, params: { id: '1' } });
    await standardBuilder.patch(req, res, next);
    error = getMockCalls(global.nextFunction)[1][0];
    expect(error instanceof NotFoundError).toEqual(true);

    // 3- No data sent
    const record = (await createRecords(1))[0];
    expect(record.name).not.toEqual(name);
    expect(record.version).not.toEqual(version);

    Object.assign(req, { body: undefined });
    await standardBuilder.patch(req, res, next);
    error = getMockCalls(global.nextFunction)[2][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 4- Existing record
    Object.assign(req, { body: { name, version }, params: { id: '1' } });
    await standardBuilder.patch(req, res, next);
    const response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.id).toEqual(record.id);
    expect(response.name).toEqual(name);
    expect(response.version).toEqual(version);
  });

  it('delete record by ID', async () => {
    // 1- No ID sent
    await standardBuilder.deleteById(req, res, next);
    const error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 2- No existing record
    Object.assign(req, { params: { id: '1' } });
    await standardBuilder.deleteById(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.affected).toEqual(0);

    // 3- Existing records
    const records = await createRecords(5);
    expect(records.length).toEqual(5);
    Object.assign(req, { params: { id: '3' } });
    await standardBuilder.deleteById(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.affected).toEqual(1);
    expect(await fakeRepository.findOneBy({ id: 3 })).toBeNull();
  });

  it('delete records with IDs', async () => {
    // 1- No IDs sent
    await standardBuilder.deleteByIds(req, res, next);
    const error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof BadRequestError).toEqual(true);

    // 2- No data record
    Object.assign(req, { query: { ids: ['1', '2', '3'] } });
    await standardBuilder.deleteByIds(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.affected).toEqual(0);

    // 3- Existing records
    const records = await createRecords(5);
    expect(records.length).toEqual(5);
    await standardBuilder.deleteByIds(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.affected).toEqual(3);
    const firstRecord = await fakeRepository.findOne({
      where: {},
      order: { id: SortDirection.ASC }
    });
    expect(firstRecord!.id).toEqual(4);
  });

  it('delete all records', async () => {
    // 1- No data record
    await standardBuilder.deleteAll(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.affected).toEqual(0);

    // 2- Existing records
    const records = await createRecords(8);
    expect(records.length).toEqual(8);
    await standardBuilder.deleteAll(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.affected).toEqual(8);
    const firstRecord = await fakeRepository.findOne({
      where: {},
      order: { id: SortDirection.ASC }
    });
    expect(firstRecord).toBeNull();
  });

  it('apply restriction rules when needed', async () => {
    // 0- Create builder and records
    expect(restrictiveBuilder).toBeDefined();
    const records = await createRecords(20);
    expect(records.length).toEqual(20);

    const methodsParams: Record<
      string,
      {
        method: (
          req: Request,
          res: Response,
          next: NextFunction
        ) => Promise<void>;
        data: any;
      }
    > = {
      readById: {
        method: restrictiveBuilder.readById,
        data: {
          params: { id: '1' }
        }
      },
      readOne: {
        method: restrictiveBuilder.readOne,
        data: { params: {} }
      },
      readPage: {
        method: restrictiveBuilder.readPage,
        data: {
          query: { page: '0', size: '2' }
        }
      },
      readAll: {
        method: restrictiveBuilder.readAll,
        data: { params: {} }
      },
      create: {
        method: restrictiveBuilder.create,
        data: {
          body: { name: 'A', version: 2 },
          query: {}
        }
      },
      update: {
        method: restrictiveBuilder.update,
        data: {
          params: { id: '3' }
        }
      },
      patch: {
        method: restrictiveBuilder.patch,
        data: {}
      },
      deleteById: {
        method: restrictiveBuilder.deleteById,
        data: {
          params: { id: '5' },
          body: {}
        }
      },
      delete: {
        method: restrictiveBuilder.deleteByIds,
        data: {
          query: { ids: ['1', '2', '9'] },
          params: {}
        }
      },
      deleteAll: {
        method: restrictiveBuilder.deleteAll,
        data: { query: {} }
      }
    };

    // Errors
    const methods = Object.keys(methodsParams);
    for (let index = 0; index < methods.length; index++) {
      const method = methods[index];
      const methodParam = methodsParams[method];
      const hasError = await _checkRestriction(
        restrictiveBuilder,
        methodParam.method,
        index,
        methodParam.data
      );
      expect(hasError).toEqual(true);
    }

    // Successes
    for (let index = 0; index < methods.length; index++) {
      const method = methods[index];
      const methodParam = methodsParams[method];
      const isOk = await _allowRestricted(
        restrictiveBuilder,
        methodParam.method,
        index,
        methodParam.data
      );
      expect(isOk).toEqual(true);
    }
  });

  it('should deals with soft deleted records', async () => {
    // 0- Create builder and records
    const hasSoftQuery = async (req: Request) => !!req.query?.soft;
    const softDeleteBuilder = new RouteBuilder<FakeModel>(
      '/soft',
      () => fakeRepository,
      {
        readById: {
          withDeleted: hasSoftQuery
        },
        deleteById: {
          softDelete: hasSoftQuery
        }
      }
    );
    expect(softDeleteBuilder).toBeDefined();
    const records = await createRecords(5);
    expect(records.length).toEqual(5);
    expect(records.every((record: FakeModel) => !record.deletedAt)).toEqual(
      true
    );

    // 1- Calling with soft deletion
    Object.assign(req, { query: { soft: 'true' }, params: { id: '1' } });
    await softDeleteBuilder.deleteById(req, res, next);
    let response = getMockCalls(global.mockResponse.send)[0][0];
    expect(response.affected).toEqual(1);
    expect(await fakeRepository.count()).toEqual(4);

    // 2- Read with soft delete
    Object.assign(req, { query: { soft: 'true' }, params: { id: '1' } });
    await softDeleteBuilder.readById(req, res, next);
    response = getMockCalls(global.mockResponse.send)[1][0];
    expect(response.deletedAt).toBeDefined();
    expect(response.id).toEqual(1);

    // 3- Read without soft delete
    Object.assign(req, { query: {}, params: { id: '1' } });
    await softDeleteBuilder.readById(req, res, next);
    let error = getMockCalls(global.nextFunction)[0][0];
    expect(error instanceof NotFoundError).toEqual(true);

    // 4- Calling with hard deletion
    Object.assign(req, { params: { id: '2' } });
    await softDeleteBuilder.deleteById(req, res, next);
    response = getMockCalls(global.mockResponse.send)[2][0];
    expect(response.affected).toEqual(1);

    // 5- Reading again with deleted
    Object.assign(req, { query: { soft: 'true' } });
    await softDeleteBuilder.readById(req, res, next);
    error = getMockCalls(global.nextFunction)[1][0];
    expect(error instanceof NotFoundError).toEqual(true);
    expect(await fakeRepository.count()).toEqual(3);
  });

  it('should build into express Router', async () => {
    // Standard router
    expect(await checkRouter(standardBuilder, '/fake', false)).toEqual(true);

    // Restrictive router
    expect(await checkRouter(restrictiveBuilder, '/hard', false)).toEqual(true);

    // Single route router
    expect(await checkRouter(singleRouteBuilder, '/single', true)).toEqual(
      true
    );
  });

  beforeAll(async () => {
    // 1- Building database
    db = newDb({
      autoCreateForeignKeyIndices: true
    });
    db.public.registerFunction({
      implementation: () => 'test',
      name: 'current_database'
    });
    db.public.registerFunction({
      implementation: () => 'version',
      name: 'version'
    });
    connection = await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [FakeModel],
      synchronize: true
    });
    await connection.initialize();

    fakeRepository = new BaseRepository<FakeModel>(
      FakeModel,
      connection.manager
    );

    // 2- Build the route for every unit test
    standardBuilder = new RouteBuilder<FakeModel>(
      '/fake',
      () => fakeRepository
    );
    restrictiveBuilder = new RouteBuilder<FakeModel>(
      '/hard',
      () => fakeRepository,
      _restrictiveBuilderConfig()
    );
    const disabledEndpoint = { disabled: true };
    singleRouteBuilder = new RouteBuilder<FakeModel>(
      '/single',
      () => fakeRepository,
      {
        readOne: disabledEndpoint,
        readById: disabledEndpoint,
        update: disabledEndpoint,
        patch: disabledEndpoint,
        deleteById: disabledEndpoint,
        deleteByIds: disabledEndpoint,
        deleteAll: disabledEndpoint
      }
    );

    // 3- Backup database
    backup = db.backup();
  });

  beforeEach(async () => {
    req = global.mockRequest as Request;
    res = global.mockResponse as Response;
    next = global.nextFunction as NextFunction;

    backup.restore();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await connection?.destroy();
  });

  const _checkRestriction = async (
    builder: RouteBuilder<FakeModel>,
    method: (req: Request, res: Response, next: NextFunction) => Promise<void>,
    index: number,
    reqData: any = {}
  ): Promise<boolean> => {
    Object.assign(req, reqData);
    await method.call(builder, req, res, next);
    const error = getMockCalls(global.nextFunction)[index][0];
    expect(error instanceof ForbiddenError).toEqual(true);
    expect(error.message).toEqual(RESTRICTION_MESSAGE);
    return true;
  };

  const _allowRestricted = async (
    builder: RouteBuilder<FakeModel>,
    method: (req: Request, res: Response, next: NextFunction) => Promise<void>,
    index: number,
    reqData: any = {}
  ): Promise<boolean> => {
    Object.assign(req, {
      ...reqData,
      query: { ...reqData.query, allow: true }
    });
    await method.call(builder, req, res, next);
    const response = getMockCalls(global.mockResponse.send)[index][0];
    expect(response).toBeDefined();
    return true;
  };

  const _restrictiveBuilderConfig = (): PartialBuilderConfig<FakeModel> => {
    const restriction = async (
      req: Request,
      next: NextFunction,
      data?: any,
      records?: any
    ) => {
      if (!req.query?.allow) {
        next(new ForbiddenError(RESTRICTION_MESSAGE));
        return {
          nextCalled: true,
          resultData: data,
          savedData: records
        };
      }
      return {
        nextCalled: false,
        resultData: data,
        savedData: records
      };
    };
    const onlyId = async (records?: any, savedData?: any) => {
      if (!records) {
        return;
      }
      if (Array.isArray(records)) {
        return records.map((item: any) => {
          // eslint-disable-next-line no-unused-vars
          const { version, ...newRecord } = item;
          return newRecord;
        });
      }
      // eslint-disable-next-line no-unused-vars
      const { version, ...newRecord } = records;
      return newRecord;
    };
    const endpointConfig = {
      beforeQuery: restriction,
      afterQuery: onlyId
    };

    return {
      globalWhere: async (req: Request) => ({ id: 1 }),
      readById: endpointConfig,
      readAll: endpointConfig,
      readOne: endpointConfig,
      readPage: endpointConfig,
      create: endpointConfig,
      update: endpointConfig,
      patch: endpointConfig,
      deleteAll: {
        beforeQuery: restriction
      },
      deleteById: {
        beforeQuery: restriction
      },
      deleteByIds: {
        beforeQuery: restriction
      }
    };
  };

  const getMockCalls = (mockedMethod: any, index: number = 0): any => {
    return (mockedMethod as jest.Mock).mock.calls;
  };

  const createRecords = async (size: number): Promise<FakeModel[]> => {
    const recordsData = Array.from(Array(size).keys()).map((index: number) => ({
      name: `Record ${index + 1}`,
      version: index + 1
    }));
    return await fakeRepository.save(fakeRepository.create(recordsData));
  };

  const checkRouter = async <T extends BaseModel>(
    builder: RouteBuilder<T>,
    root: string,
    hasDisabled: boolean
  ): Promise<boolean> => {
    expect(builder).toBeDefined();
    const router = builder.build();
    expect(router).toBeDefined();

    const app: Application = express();
    app.set('trust proxy', true);
    app.use(json());
    app.use(router);
    app.use(errorHandler);

    // Create some records
    backup.restore(); // Because we want IDs to start at 1
    await createRecords(10);

    // Get page is not disabled
    let response = await request(app).get(root);
    expect(response.status).not.toEqual(404);

    const deleteAll = `${root}/all?allow=true`; // URL will also work with restricted
    if (hasDisabled) {
      // Delete all is disabled
      response = await request(app).delete(deleteAll);
      expect(response.status).toEqual(404);
    } else {
      expect(await fakeRepository.count()).toEqual(10);
      response = await request(app).delete(deleteAll);
      expect(response.status).toEqual(200);
      const remaining = await fakeRepository.count();
      // When on restrictive, we can only delete where defaultWhere is applied (id=1)
      expect(remaining === 0 || remaining === 9).toEqual(true);
    }

    // We will make code of post bugged
    const throwError = () => {
      console.debug('Error will be thrown on purpose');
      throw new GenericError('Error on purpose', 500);
    };
    builder.create = async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      throwError();
    };
    response = await request(app).post(root).send({ name: 'a', version: 2 });
    expect(response.status).toEqual(500);
    return true;
  };
});

// eslint-disable-next-line new-cap
@Entity({
  orderBy: {
    id: SortDirection.ASC
  }
})
/**
 * Test model
 */
export class FakeModel extends BaseModel {
  // eslint-disable-next-line new-cap
  @PrimaryGeneratedColumn()
  id!: number;
  // eslint-disable-next-line new-cap
  @Column()
  name!: string;
  // eslint-disable-next-line new-cap
  @Column()
  version!: number;
  // eslint-disable-next-line new-cap
  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
