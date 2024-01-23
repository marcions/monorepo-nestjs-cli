import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TokenModule } from 'libs/auth';
import { RedisCacheModule } from 'libs/infra/cache/redis';
import { IDataBaseAdapter } from 'libs/infra/database';
import { PostgresDatabaseModule } from 'libs/infra/database/postgres/module';
import { TesteSchema } from 'libs/infra/database/postgres/schemas/teste';
import { ILoggerAdapter, LoggerModule } from 'libs/infra/logger';
import { IsLoggedMiddleware } from 'libs/utils/middlewares/is-logged.middleware';
import { ModelCtor, Sequelize } from 'sequelize-typescript';

import { TesteEntity } from '../../core/entity/teste';
import { ITesteRepository } from '../../core/repository/teste';
import { TesteCreateUsecase } from '../../core/use-cases/teste-create';
import { TesteDeleteUsecase } from '../../core/use-cases/teste-delete';
import { TesteGetByIdUsecase } from '../../core/use-cases/teste-getByID';
import { TesteListUsecase } from '../../core/use-cases/teste-list';
import { TesteUpdateUsecase } from '../../core/use-cases/teste-update';
import {
  ITesteCreateAdapter,
  ITesteDeleteAdapter,
  ITesteGetByIDAdapter,
  ITesteListAdapter,
  ITesteUpdateAdapter
} from './adapter';
import { TesteController } from './controller';
import { TesteRepository } from './repository';

@Module({
  imports: [TokenModule, LoggerModule, RedisCacheModule, PostgresDatabaseModule],
  controllers: [TesteController],
  providers: [
    {
      provide: ITesteRepository,
      useFactory: (database: IDataBaseAdapter) => {
        const repossitory = database.getDatabase<Sequelize>().model(TesteSchema);
        return new TesteRepository(repossitory as ModelCtor<TesteSchema> & TesteEntity);
      },
      inject: [IDataBaseAdapter]
    },
    {
      provide: ITesteCreateAdapter,
      useFactory: (repository: ITesteRepository) => new TesteCreateUsecase(repository),
      inject: [ITesteRepository]
    },
    {
      provide: ITesteUpdateAdapter,
      useFactory: (logger: ILoggerAdapter, repository: ITesteRepository) => new TesteUpdateUsecase(repository, logger),
      inject: [ILoggerAdapter, ITesteRepository]
    },
    {
      provide: ITesteGetByIDAdapter,
      useFactory: (repository: ITesteRepository) => new TesteGetByIdUsecase(repository),
      inject: [ITesteRepository]
    },
    {
      provide: ITesteListAdapter,
      useFactory: (repository: ITesteRepository) => new TesteListUsecase(repository),
      inject: [ITesteRepository]
    },
    {
      provide: ITesteDeleteAdapter,
      useFactory: (repository: ITesteRepository) => new TesteDeleteUsecase(repository),
      inject: [ITesteRepository]
    }
  ],
  exports: []
})
export class TesteModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IsLoggedMiddleware).forRoutes(TesteController);
  }
}

