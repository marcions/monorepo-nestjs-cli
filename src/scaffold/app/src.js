function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const getMain = (name) => {
  return `import 'libs/utils/tracing';

import { HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { description, name, version } from 'apps/${name}/package.json';
import bodyParser from 'body-parser';
import { bold } from 'colorette';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { ILoggerAdapter } from 'libs/infra/logger/adapter';
import { ISecretsAdapter } from 'libs/infra/secrets';
import { ApiInternalServerException } from 'libs/utils/exception';
import { AppExceptionFilter } from 'libs/utils/filters/http-exception.filter';
import { ExceptionInterceptor } from 'libs/utils/interceptors/http-exception.interceptor';
import { HttpLoggerInterceptor } from 'libs/utils/interceptors/http-logger.interceptor';
import { MetricsInterceptor } from 'libs/utils/interceptors/metrics.interceptor';
import { TracingInterceptor } from 'libs/utils/interceptors/tracing.interceptor';

import { MainModule } from './modules/module';

async function bootstrap() {
  const app = await NestFactory.create(MainModule, {
    bufferLogs: true,
    cors: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      errorHttpStatusCode: HttpStatus.PRECONDITION_FAILED,
    }),
  );

  const loggerService = app.get(ILoggerAdapter);

  loggerService.setApplication(name);

  app.useLogger(loggerService);

  app.useGlobalFilters(new AppExceptionFilter(loggerService));

  app.useGlobalInterceptors(
    new ExceptionInterceptor(loggerService),
    new HttpLoggerInterceptor(loggerService),
    new TracingInterceptor(loggerService),
    new MetricsInterceptor()
  );

  app.use(helmet());

  const {
    ${name.toUpperCase()}: { PORT, HOST },
    ENV,
    MONGO_URL,
    POSTGRES_URL,
    ZIPKIN_URL,
    PROMETHUES_URL,
    RATE_LIMIT_BY_USER,
    PGADMIN_URL,
    MONGO_EXPRESS_URL,
    RABBITMQ_URL
  } = app.get(ISecretsAdapter);

  const MINUTES = 15 * 60 * 1000;
  const limiter = rateLimit({
    windowMs: MINUTES,
    limit: RATE_LIMIT_BY_USER,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  });

  app.use(limiter);

  app.use(bodyParser.urlencoded({ extended: true }));

  app.enableVersioning({ type: VersioningType.URI });

  app.setGlobalPrefix('${name}');

  process.on('uncaughtException', (error) => {
    loggerService.error(new ApiInternalServerException(error.message));
  });

  process.on('unhandledRejection', (error) => {
    loggerService.error(new ApiInternalServerException(error['message'] ?? (error as string)));
  });

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(description)
    .addBearerAuth()
    .setVersion(version)
    .addServer(HOST)
    .addTag('Swagger Documentation')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(PORT, () => {
    loggerService.log(''Application Successfully Started'');
    loggerService.log(''🟢 ##{name} listening at ##{bold(PORT)} on ##{bold(ENV?.toUpperCase())} 🟢'');
    loggerService.log(''🟢 Swagger listening at {bold('##{HOST}/docs')} 🟢'');
  });

  loggerService.log(''🔵 Postgres listening at ##{bold(POSTGRES_URL)}'');
  loggerService.log(''🔶 PgAdmin listening at ##{bold(PGADMIN_URL)}'');
  loggerService.log(''🔵 Mongo listening at ##{bold(MONGO_URL)}'');
  loggerService.log(''🔶 Mongo express listening at ##{bold(MONGO_EXPRESS_URL)}'');
  loggerService.log(''⚪ Zipkin[##{bold('Tracing')}] listening at ##{bold(ZIPKIN_URL)}'');
  loggerService.log(''⚪ Promethues[##{bold('Metrics')}] listening at ##{bold(PROMETHUES_URL)}'');
  loggerService.log(''🔵 RabbitMQ listening at ##{bold(RABBITMQ_URL)}'');

}
bootstrap();
`
}


const getSourceModule = (name) => {
  return `import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TokenModule } from 'libs/auth';
import { InfraModule } from 'libs/infra/module';
import { RolesGuardInterceptor } from 'libs/utils/interceptors/auth-guard.interceptor';

import { HealthModule } from './health/module';
import { ${name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}Module } from './${name}/module';

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuardInterceptor
    }
  ],
  imports: [${name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()}Module, HealthModule, InfraModule, TokenModule]
})
export class MainModule {}

  `
}

const health = (name) => {
  return {
    adapter: `export abstract class IHealthService {
  abstract getText(): Promise<string>;
}
`,
    controller: `import { Controller, Get } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { IHealthService } from './adapter';
import { SwagggerResponse } from './swagger';

@Controller()
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: IHealthService) {}

  @Get('/health')
  @ApiResponse(SwagggerResponse.getHealth[200])
  @ApiResponse(SwagggerResponse.getHealth[500])
  async getHealth(): Promise<string> {
    return this.healthService.getText();
  }
}
`,
module: `import { Module } from '@nestjs/common';
import { LoggerModule } from 'libs/infra/logger/module';

import { IHealthService } from './adapter';
import { HealthController } from './controller';
import { HealthService } from './service';

@Module({
  imports: [LoggerModule],
  controllers: [HealthController],
  providers: [
    {
      provide: IHealthService,
      useClass: HealthService,
    },
  ],
})
export class HealthModule {}
`,
service: `import { Injectable } from '@nestjs/common';
import { name, version } from 'apps/${name}/package.json';
import { ILoggerAdapter } from 'libs/infra/logger/adapter';

import { IHealthService } from './adapter';

@Injectable()
export class HealthService implements IHealthService {
  constructor(private readonly loggerService: ILoggerAdapter) {}

  async getText(): Promise<string> {
    const appName = ''##{name}-##{version} UP!!'';
    this.loggerService.info({ message: appName, context: ''HealthService/getText'' });

    return appName;
  }
}
`,
swagger: `import { name } from 'apps/${name}/package.json';
import { Swagger } from 'libs/utils/documentation/swagger';

export const SwagggerResponse = {
  getHealth: {
    200: Swagger.defaultResponseText({ status: 200, text: ''##{name} UP!!'' }),
    500: Swagger.defaultResponseError({
      status: 500,
      route: '/health',
    }),
  },
};

export const SwagggerRequest = {
  /** If requesters has a body.  */
};
`
  }
}

const healthTests = (name) => { 
  return {
    controller: `import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ILoggerAdapter } from 'libs/infra/logger/adapter';
import { ApiInternalServerException } from 'libs/utils/exception';
import request from 'supertest';

import { name, version } from 'apps/${name}/package.json';
import { IHealthService } from '../adapter';
import { HealthController } from '../controller';
import { HealthService } from '../service';

describe('HealthController (e2e)', () => {
  let app: INestApplication;
  let service: IHealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: IHealthService,
          useFactory: () => new HealthService({ info: jest.fn() } as unknown as ILoggerAdapter),
        },
      ],
      imports: [],
    }).compile();

    app = module.createNestApplication();
    service = module.get(IHealthService);
    await app.init();
  });

  describe('/health (GET)', () => {
    const text = ''##{name}-##{version} UP!!'';

    it(''should return ##{text}'', async () => {
      return request(app.getHttpServer()).get('/health').expect(text);
    });

    it(''should getHealth with throw statusCode 500'', async () => {
      service.getText = jest.fn().mockRejectedValue(new ApiException('Error'));
      return request(app.getHttpServer()).get('/health').expect({ statusCode: 500, message: 'Error' });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
`,
    module: `import { Test, TestingModule } from '@nestjs/testing';

import { HealthModule } from '../module';

describe('HealthModule', () => {
  let healthModule: HealthModule;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [HealthModule]
    }).compile();

    healthModule = app.get<HealthModule>(HealthModule);
  });

  it('should be defined', () => {
    expect(healthModule).toBeInstanceOf(HealthModule);
  });
});
`,
    service: `import { Test } from '@nestjs/testing';
import { ILoggerAdapter } from 'libs/infra/logger/adapter';

import { name, version } from 'apps/${name}/package.json';
import { IHealthService } from '../adapter';
import { HealthService } from '../service';

describe('HealthService', () => {
  let healthService: IHealthService;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      imports: [],
      providers: [
        {
          provide: IHealthService,
          useFactory: () => new HealthService({ info: jest.fn() } as unknown as ILoggerAdapter),
        },
      ],
    }).compile();

    healthService = app.get(IHealthService);
  });

  describe('getText', () => {
    test('should getText successfully', async () => {
      await expect(healthService.getText()).resolves.toEqual(''##{name}-##{version} UP!!'');
    });
  });
});
`,
  }
}

const app = (name) => {
  Fname = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  return {
    adapter: `import { ApiTrancingInput } from 'libs/utils/request';

  import { ${Fname}CreateInput, ${Fname}CreateOutput } from '../../core/use-cases/${name}-create';
  import { ${Fname}DeleteInput, ${Fname}DeleteOutput } from '../../core/use-cases/${name}-delete';
  import { ${Fname}GetByIDInput, ${Fname}GetByIDOutput } from '../../core/use-cases/${name}-getByID';
  import { ${Fname}ListInput, ${Fname}ListOutput } from '../../core/use-cases/${name}-list';
  import { ${Fname}UpdateInput, ${Fname}UpdateOutput } from '../../core/use-cases/${name}-update';
  
  export abstract class I${Fname}CreateAdapter {
    abstract execute(input: ${Fname}CreateInput, trace: ApiTrancingInput): Promise<${Fname}CreateOutput>;
  }
  
  export abstract class I${Fname}UpdateAdapter {
    abstract execute(input: ${Fname}UpdateInput, trace: ApiTrancingInput): Promise<${Fname}UpdateOutput>;
  }
  
  export abstract class I${Fname}GetByIDAdapter {
    abstract execute(input: ${Fname}GetByIDInput): Promise<${Fname}GetByIDOutput>;
  }
  
  export abstract class I${Fname}ListAdapter {
    abstract execute(input: ${Fname}ListInput): Promise<${Fname}ListOutput>;
  }
  
  export abstract class I${Fname}DeleteAdapter {
    abstract execute(input: ${Fname}DeleteInput, trace: ApiTrancingInput): Promise<${Fname}DeleteOutput>;
  }
    
`,
    controller: `import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
  import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { UserRole } from 'libs/core/user/entity/user';
  import { Roles } from 'libs/utils/decorators/role.decorator';
  import { ApiRequest } from 'libs/utils/request';
  import { SearchHttpSchema } from 'libs/utils/search';
  import { SortHttpSchema } from 'libs/utils/sort';
  
  import { ${Fname}CreateInput, ${Fname}CreateOutput } from '../../core/use-cases/${name}create';
  import { ${Fname}DeleteInput, ${Fname}DeleteOutput } from '../../core/use-cases/${name}delete';
  import { ${Fname}GetByIDInput, ${Fname}GetByIDOutput } from '../../core/use-cases/${name}getByID';
  import { ${Fname}ListInput, ${Fname}ListOutput } from '../../core/use-cases/${name}list';
  import { ${Fname}UpdateInput, ${Fname}UpdateOutput } from '../../core/use-cases/${name}update';
  import {
    I${Fname}CreateAdapter,
    I${Fname}DeleteAdapter,
    I${Fname}GetByIDAdapter,
    I${Fname}ListAdapter,
    I${Fname}UpdateAdapter
  } from './adapter';
  import { SwagggerRequest, SwagggerResponse } from './swagger';
  
  @Controller()
  @ApiTags('${name}')
  @ApiBearerAuth()
  @Roles(UserRole.USER)
  export class ${Fname}Controller {
    constructor(
      private readonly ${name}Create: ${Fname}CreateAdapter,
      private readonly ${name}Update: ${Fname}UpdateAdapter,
      private readonly ${name}GetByID: ${Fname}GetByIDAdapter,
      private readonly ${name}List: ${Fname}ListAdapter,
      private readonly ${name}Delete: ${Fname}DeleteAdapter
    ) {}
  
    @Post()
    @ApiResponse(SwagggerResponse.create[200])
    @ApiBody(SwagggerRequest.createBody)
    @Version('1')
    async create(@Req() { body, user, tracing }: ApiRequest): Promise<${Fname}CreateOutput> {
      return await this.${name}Create.execute(body as ${Fname}CreateInput, { user, tracing });
    }
  
    @Put()
    @ApiResponse(SwagggerResponse.update[200])
    @ApiResponse(SwagggerResponse.update[404])
    @ApiBody(SwagggerRequest.updateBody)
    @Version('1')
    async update(@Req() { body, user, tracing }: ApiRequest): Promise<${Fname}UpdateOutput> {
      return await this.${name}Update.execute(body as ${Fname}UpdateInput, { user, tracing });
    }
  
    @Get('/:id')
    @ApiParam({ name: 'id', required: true })
    @ApiResponse(SwagggerResponse.getByID[200])
    @ApiResponse(SwagggerResponse.getByID[404])
    @Version('1')
    async getById(@Req() { params }: ApiRequest): Promise<${Fname}GetByIDOutput> {
      return await this.${name}GetByID.execute(params as ${Fname}GetByIDInput);
    }
  
    @Get()
    @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
    @ApiQuery(SwagggerRequest.listQuery.pagination.page)
    @ApiQuery(SwagggerRequest.listQuery.sort)
    @ApiQuery(SwagggerRequest.listQuery.search)
    @ApiResponse(SwagggerResponse.list[200])
    @Version('1')
    async list(@Req() { query }: ApiRequest): Promise<${Fname}ListOutput> {
      const input: ${Fname}ListInput = {
        sort: SortHttpSchema.parse(query.sort),
        search: SearchHttpSchema.parse(query.search),
        limit: Number(query.limit),
        page: Number(query.page)
      };
  
      return await this.${name}List.execute(input);
    }
  
    @Delete('/:id')
    @ApiParam({ name: 'id', required: true })
    @ApiResponse(SwagggerResponse.delete[200])
    @ApiResponse(SwagggerResponse.delete[404])
    @Version('1')
    async delete(@Req() { params, user, tracing }: ApiRequest): Promise<${Fname}DeleteOutput> {
      return await this.${name}Delete.execute(params as ${Fname}DeleteInput, { user, tracing });
    }
  }
    
`,
module: `import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TokenModule } from 'libs/auth';
import { RedisCacheModule } from 'libs/infra/cache/redis';
import { IDataBaseAdapter } from 'libs/infra/database';
import { PostgresDatabaseModule } from 'libs/infra/database/postgres/module';
import { ${Fname}Schema } from 'libs/infra/database/postgres/schemas/${name}';
import { ILoggerAdapter, LoggerModule } from 'libs/infra/logger';
import { IsLoggedMiddleware } from 'libs/utils/middlewares/is-logged.middleware';
import { ModelCtor, Sequelize } from 'sequelize-typescript';

import { ${Fname}Entity } from '../../core/entity/${name}';
import { I${Fname}Repository } from '../../core/repository/${name}';
import { ${Fname}CreateUsecase } from '../../core/use-cases/${name}-create';
import { ${Fname}DeleteUsecase } from '../../core/use-cases/${name}-delete';
import { ${Fname}GetByIdUsecase } from '../../core/use-cases/${name}-getByID';
import { ${Fname}ListUsecase } from '../../core/use-cases/${name}-list';
import { ${Fname}UpdateUsecase } from '../../core/use-cases/${name}-update';
import {
  I${Fname}CreateAdapter,
  I${Fname}DeleteAdapter,
  I${Fname}GetByIDAdapter,
  I${Fname}ListAdapter,
  I${Fname}UpdateAdapter
} from './adapter';
import { ${Fname}Controller } from './controller';
import { ${Fname}Repository } from './repository';

@Module({
  imports: [TokenModule, LoggerModule, RedisCacheModule, PostgresDatabaseModule],
  controllers: [${Fname}Controller],
  providers: [
    {
      provide: I${Fname}Repository,
      useFactory: (database: IDataBaseAdapter) => {
        const repossitory = database.getDatabase<Sequelize>().model(${Fname}Schema);
        return new ${Fname}Repository(repossitory as ModelCtor<${Fname}Schema> & ${Fname}Entity);
      },
      inject: [IDataBaseAdapter]
    },
    {
      provide: I${Fname}CreateAdapter,
      useFactory: (repository: I${Fname}Repository) => new ${Fname}CreateUsecase(repository),
      inject: [I${Fname}Repository]
    },
    {
      provide: I${Fname}UpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: I${Fname}Repository) => new ${Fname}UpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, I${Fname}Repository]
    },
    {
      provide: I${Fname}GetByIDAdapter,
      useFactory: (repository: I${Fname}Repository) => new ${Fname}GetByIdUsecase(repository),
      inject: [I${Fname}Repository]
    },
    {
      provide: I${Fname}ListAdapter,
      useFactory: (repository: I${Fname}Repository) => new ${Fname}ListUsecase(repository),
      inject: [I${Fname}Repository]
    },
    {
      provide: I${Fname}DeleteAdapter,
      useFactory: (repository: I${Fname}Repository) => new ${Fname}DeleteUsecase(repository),
      inject: [I${Fname}Repository]
    }
  ],
  exports: []
})
export class ${Fname}Module implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(${Fname}Controller);
  }
}

`,
repository: `import { Injectable } from '@nestjs/common';
import { ${Fname}Schema } from 'libs/infra/database/postgres/schemas/${name}';
import { SequelizeRepository } from 'libs/infra/repository/postgres/repository';
import { DatabaseOptionsSchema, DatabaseOptionsType } from 'libs/utils/database/sequelize';
import { ConvertPaginateInputToSequelizeFilter } from 'libs/utils/decorators/database/postgres/convert-paginate-input-to-sequelize-filter.decorator';
import { ValidateDatabaseSortAllowed } from 'libs/utils/decorators/database/validate-database-sort-allowed.decorator';
import { SearchTypeEnum } from 'libs/utils/decorators/types';
import { Transaction } from 'sequelize';
import { ModelCtor } from 'sequelize-typescript';

import { ${Fname}Entity } from '../../core/entity/${name}';
import { I${Fname}Repository } from '../../core/repository/${name}';
import { ${Fname}ListInput, ${Fname}ListOutput } from '../../core/use-cases/${name}-list';

type Model = ModelCtor<${Fname}Schema> & ${Fname}Entity;

@Injectable()
export class ${Fname}Repository extends SequelizeRepository<Model> implements I${Fname}Repository {
  constructor(readonly repository: Model) {
    super(repository);
  }

  async startSession<TTransaction = Transaction>(): Promise<TTransaction> {
    const transaction = await this.repository.sequelize.transaction();

    return transaction as TTransaction;
  }

  @ValidateDatabaseSortAllowed<${Fname}Entity>('createdAt', 'breed')
  @ConvertPaginateInputToSequelizeFilter<${Fname}Entity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate(input: ${Fname}ListInput, options: DatabaseOptionsType): Promise<${Fname}ListOutput> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const list = await this.repository.schema(schema).findAndCountAll(input);

    return { docs: list.rows.map((r) => new ${Fname}Entity(r)), limit: input.limit, page: input.page, total: list.count };
  }
}

`,
swagger: `import { name } from 'apps/${name}/package.json';
import { ${Fname}Request } from 'libs/utils/docs/data/${name}/request';
import { ${Fname}Response } from 'libs/utils/docs/data/${name}/response';
import { Swagger } from 'libs/utils/docs/swagger';

export const SwagggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: ${Fname}Response.create,
      description: '${name} created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: ${Fname}Response.update,
      description: '${name} updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/${name}',
      message: '${name} Not Found',
      description: '${name} not found.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: ${Fname}Response.getByID,
      description: '${name} found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/${name}/:id',
      message: '${name} Not Found',
      description: '${name} not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: ${Fname}Response.delete,
      description: '${name} found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/${name}/:id',
      message: '${name} Not Found',
      description: '${name} not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: ${Fname}Response.list,
      description: '${name} created.'
    })
  }
};

export const SwagggerRequest = {
  createBody: Swagger.defaultRequestJSON(${Fname}Request.create),
  updateBody: Swagger.defaultRequestJSON(${Fname}Request.update),
  listQuery: {
    pagination: {
      limit: Swagger.defaultApiQueryOptions({ example: 10, name: 'limit', required: false }),
      page: Swagger.defaultApiQueryOptions({ example: 1, name: 'page', required: false })
    },
    sort: Swagger.defaultApiQueryOptions({
      name: 'sort',
      required: false,
      description: '<b>createdAt:desc,name:asc'
    }),
    search: Swagger.defaultApiQueryOptions({
      name: 'search',
      required: false,
      description: '<b>name:miau,breed:siamese'
    })
  }
};

`
  }
}

module.exports = { getMain, getSourceModule, health, healthTests, app }