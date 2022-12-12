import {
  BaseModel,
  BaseRepository,
  isEmpty,
  parseFilters,
  parseSorts
} from '@gcorptools/typeorm-helper';
import { TRANSLATION_KEYS } from '../constants';
import { BadRequestError, NotFoundError } from '../errors';
import { BuilderConfig, EndpointConfig, PartialBuilderConfig } from '../types';
import { toBuilderConfig } from '../utils';
import express, { Request, Response, NextFunction } from 'express';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  In
} from 'typeorm';

type RepositoryGetter<T extends BaseModel> = () => BaseRepository<T>;

/**
 * Class for building endpoints
 */
export class RouteBuilder<T extends BaseModel> {
  private _configs: BuilderConfig<T>;
  private _idField: string;

  /**
   * Create an instance of Route Builder
   * @param {string} _rootPath the endpoint route path
   * @param {RepositoryGetter<T>} _getRepository method for getting repository to use when doing database operations
   * @param {PartialBuilderConfig<T>} configs provided configuration
   */
  constructor(
    protected _rootPath: string,
    protected _getRepository: RepositoryGetter<T>,
    configs?: PartialBuilderConfig<T>
  ) {
    this._configs = toBuilderConfig(configs);
    this._idField = this._configs.idField;
  }

  /**
   * Build a new router instance by applying provided configuration
   * @return {express.Router} a new instance of express.Router
   */
  build(): express.Router {
    // eslint-disable-next-line new-cap
    const router = express.Router();
    const defaultMiddleWares = this._configs.globalMiddleWares;

    const endpointConfigs = Object.keys(this._configs).filter(
      (field: string) => !!(this._configs as any)[field].builderMethod
    );

    endpointConfigs.forEach((methodName: string) => {
      const methodConfig = (this._configs as any)[
        methodName
      ] as EndpointConfig<T>;
      if (methodConfig.disabled) {
        // Route not allowed for given path
        return;
      }
      router[methodConfig.routerMethod](
        `${this._rootPath}${methodConfig.path}`,
        defaultMiddleWares.concat(methodConfig.middleWares),
        async (req: Request, res: Response, next: NextFunction) => {
          try {
            await (this as any)[methodName](req, res, next);
          } catch (e) {
            console.error(e);
            next(e);
          }
        }
      );
    });
    return router;
  }

  /**
   * Read by ID
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async readById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1- Read configuration and data from request
    const config: EndpointConfig<T> = this._configs.readById;
    const options = await this._findByIdOptions(req, config);
    if (options instanceof BadRequestError) {
      return next(options);
    }

    // 2- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      options
    );
    if (nextCalled) {
      // Should abort request
      return;
    }

    // 3- Retrieve data from database
    const record = await this._getRepository().findOne(resultData);
    if (!record) {
      return next(new NotFoundError());
    }

    // 4- Execute some late method or transform record before sending
    const result = await config.afterQuery(record, savedData);
    res.status(200).send(result);
  }

  /**
   * Read one
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async readOne(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1- Read configuration and data from request
    const config: EndpointConfig<T> = this._configs.readOne;
    const options = await this._singleWhereOptions(req, config);

    // 2- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      options
    );
    if (nextCalled) {
      // Next must have been called in beforeQuery for aborting request
      return;
    }

    // 3- Retrieve data from database
    const record = await this._getRepository().findOne(resultData);
    if (!record) {
      return next(new NotFoundError());
    }

    // 4- Execute some late method or transform record before sending
    const result = await config.afterQuery(record, savedData);
    res.status(200).send(result);
  }

  /**
   * Read page
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async readPage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1- Read configuration and data from request
    const config: EndpointConfig<T> = this._configs.readPage;
    const options = await this._manyWhereOptions(req, config);

    // 2- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      options
    );
    if (nextCalled) {
      // Next must have been called in beforeQuery for aborting request
      return;
    }

    // 3- Retrieve data from
    const pageOfRecords = await this._getRepository().findPage(resultData);

    // 4- Execute some late method or transform record before sending
    const result = await config.afterQuery(pageOfRecords, savedData);
    res.status(200).send(result);
  }

  /**
   * Read all
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async readAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1- Read configuration and data from request
    const config: EndpointConfig<T> = this._configs.readAll;
    const options = await this._manyWhereOptions(req, config);
    const { take, skip, ...newOptions } = options;

    // 2- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      newOptions
    );
    if (nextCalled) {
      // Next must have been called in beforeQuery for aborting request
      return;
    }

    // 3- Retrieve data from
    const records = await this._getRepository().find(resultData);

    // 4- Execute some late method or transform record before sending
    const result = await config.afterQuery(records, savedData);
    res.status(200).send(result);
  }

  /**
   * Create new record
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    // 1- Read configuration and data from request
    const config: EndpointConfig<T> = this._configs.create;
    const data = req.body;

    // 2- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      data
    );
    if (nextCalled) {
      // Next must have been called in beforeQuery for aborting request
      return;
    }

    // 3- Retrieve data from database
    const records = await this._getRepository().save(
      this._getRepository().create(resultData)
    );

    // 4- Execute some late method or transform record before sending
    const result = await config.afterQuery(records, savedData);
    res.status(201).send(result);
  }

  /**
   * Update an existing record
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    const config: EndpointConfig<T> = this._configs.update;
    await this._updateOrPatch(config, req, res, next);
  }

  /**
   * Patch an existing record
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
    const config: EndpointConfig<T> = this._configs.patch;
    await this._updateOrPatch(config, req, res, next);
  }

  /**
   * Delete a record by a given ID
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async deleteById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const config: EndpointConfig<T> = this._configs.deleteById;
    const options = await this._findByIdOptions(req, config, false);
    if (options instanceof BadRequestError) {
      return next(options);
    }
    await this._delete(config, options, req, res, next);
  }

  /**
   * Delete some records with a list of IDs
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async deleteByIds(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const config: EndpointConfig<T> = this._configs.deleteByIds;
    const safeIds = (req.query?.ids || []) as string[];

    const ids: number[] = (Array.isArray(safeIds) ? safeIds : [safeIds])
      .filter((value: any) => !isEmpty(value))
      .map((value: string) => +value);
    if (isEmpty(ids)) {
      return next(
        new BadRequestError(
          'IDs is required in query parameters',
          TRANSLATION_KEYS.error.idsRequired
        )
      );
    }
    const options = {
      // eslint-disable-next-line new-cap
      [this._idField]: In(ids),
      ...(await this._configs.globalWhere(req))
    };
    await this._delete(config, options, req, res, next);
  }

  /**
   * Delete all existing records from database
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  async deleteAll(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const config: EndpointConfig<T> = this._configs.deleteAll;
    const options = await this._configs.globalWhere(req);
    await this._delete(config, options, req, res, next);
  }

  /**
   * Get where options for finding a record
   * @param {Request} req received request
   * @param {EndpointConfig} config the active config
   * @param {boolean} noWhere decide if should send find options or find one options
   * @return {FindOneOptions<T>} if no error, rather undefined return
   */
  private async _findByIdOptions(
    req: Request,
    config: EndpointConfig<T>,
    noWhere: boolean = true
  ): Promise<FindOptionsWhere<T> | FindOneOptions<T> | BadRequestError> {
    const id = +req.params?.id;
    if (!id) {
      return new BadRequestError(
        'ID is a mandatory parameter',
        TRANSLATION_KEYS.error.idRequired
      );
    }
    const { defaultSelect, defaultRelations } = this._configs;
    const where: FindOptionsWhere<T> = {
      [this._idField]: id,
      ...(await this._configs.globalWhere(req))
    };
    if (!noWhere) {
      return where;
    }
    const withDeleted = await config.withDeleted(req);
    let options: any = {
      where,
      withDeleted
    };
    if (defaultRelations) {
      options = {
        ...options,
        relations: defaultRelations
      };
    }
    if (defaultSelect) {
      options = {
        ...options,
        select: defaultSelect
      };
    }
    return options;
  }

  /**
   * Get where options compatible with typeorm queries
   * @param {Request} req received request
   * @param {EndpointConfig} config the active configuration
   * @return {FindOneOptions} the options to apply on database query
   */
  private async _singleWhereOptions(
    req: Request,
    config: EndpointConfig<T>
  ): Promise<FindOneOptions<T>> {
    const { filters, sorts } = req.query || { filters: [], sorts: [] };
    // TODO: Add select
    const { filters: parsedFilters, relations: filtersRelations } =
      parseFilters(filters as string | string[] | string[][]);
    const defaultWhere = await this._configs.globalWhere(req);
    // We need defaultWhere to be applied on each level
    // in order to be interpreted as an restrictive operation (AND)
    const where = parsedFilters.map((filter: Record<string, any>) => ({
      ...filter,
      ...defaultWhere
    }));
    const { defaultRelations, defaultSelect } = this._configs;
    const { sorts: parsedSorts, relations: sortsRelations } = parseSorts(
      sorts as string | string[]
    );
    const order: any = { ...parsedSorts };
    const withDeleted = await config.withDeleted(req);
    const relations = Array.from(
      new Set([
        ...(defaultRelations || []),
        ...filtersRelations,
        ...sortsRelations
      ])
    );
    let options: any = {
      withDeleted,
      relations,
      where: isEmpty(where) ? defaultWhere : where,
      order
    };
    if (defaultSelect) {
      options = {
        ...options,
        select: defaultSelect
      };
    }
    return options;
  }

  /**
   * Get where options compatible with typeorm queries
   * @param {Request} req received request
   * @param {EndpointConfig} config the active configuration
   * @return {FindManyOptions} the options to apply on database query
   */
  private async _manyWhereOptions(
    req: Request,
    config: EndpointConfig<T>
  ): Promise<FindManyOptions<T>> {
    const { page, size } = req.query || {};
    const take = +(size || '20');
    const skip = +(page || '0') * take;
    const options = await this._singleWhereOptions(req, config);
    return { ...options, take, skip };
  }

  /**
   * Update or Patch an existing record
   * @param {EndpointConfig} config current endpoint configuration
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  private async _updateOrPatch(
    config: EndpointConfig<T>,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1- Read configuration and data from request
    const options = (await this._findByIdOptions(
      req,
      config
    )) as FindOneOptions<T>;
    if (options instanceof BadRequestError) {
      return next(options);
    }

    let record = await this._getRepository().findOne(options);
    if (!record) {
      return next(new NotFoundError());
    }
    const data = req.body;
    if (undefined === data || Array.isArray(data)) {
      return next(
        new BadRequestError(
          'Body is mandatory and must be a single item',
          TRANSLATION_KEYS.error.invalidBody
        )
      );
    }

    // 2- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      data,
      record
    );
    if (nextCalled) {
      // Next must have been called in beforeQuery for aborting request
      return;
    }

    // 3- Update data in database
    const safeData = this._getRepository().create(
      Object.assign(record, resultData)!
    );

    const newRecord = await this._getRepository().save(safeData);

    // 4- Execute some late method or transform record before sending
    const result = await config.afterQuery(newRecord, savedData);
    res.status(200).send(result);
  }

  /**
   * Delete some existing record
   * @param {EndpointConfig} config current endpoint configuration
   * @param {any} options retrieved options
   * @param {Request} req received request
   * @param {Response} res response to send
   * @param {NextFunction} next next handler
   */
  private async _delete(
    config: EndpointConfig<T>,
    options: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // 1- Run custom validation for endpoint
    const { resultData, savedData, nextCalled } = await config.beforeQuery(
      req,
      next,
      options
    );
    if (nextCalled) {
      // Next must have been called in beforeQuery for aborting request
      return;
    }

    const { found, records } = await this._checkLoadBeforeDelete(
      config,
      resultData,
      next
    );
    if (!found) {
      // Error already thrown
      return;
    }
    const finalData = !!records ? { ...savedData, records } : savedData;
    // 2- Remove data from database
    const softDelete = await config.softDelete(req, resultData);
    let deleteResult: DeleteResult;
    if (softDelete) {
      deleteResult = await this._getRepository().softDelete(resultData);
    } else {
      deleteResult = await this._getRepository().delete(resultData);
    }

    // 3- Execute some late method or transform record before sending
    const result = await config.afterQuery(deleteResult, finalData);
    res.status(200).send(result);
  }

  private async _checkLoadBeforeDelete(
    config: EndpointConfig<T>,
    options: any,
    next: NextFunction
  ) {
    // 1 check load before deleted
    if (!config.loadBeforeDelete) {
      return { found: true, records: null };
    }
    const records = await this._getRepository().findBy(options);
    if (!records || records.length === 0) {
      next(new NotFoundError());
      return { found: false, records: null };
    }
    return { found: true, records };
  }
}
