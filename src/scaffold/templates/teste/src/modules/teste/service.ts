import { Injectable } from '@nestjs/common';
import { TesteSchema } from 'libs/infra/database/postgres/schemas/teste';
import { SequelizeRepository } from 'libs/infra/repository/postgres/repository';
import { DatabaseOptionsSchema, DatabaseOptionsType } from 'libs/utils/database/sequelize';
import { ConvertPaginateInputToSequelizeFilter } from 'libs/utils/decorators/database/postgres/convert-paginate-input-to-sequelize-filter.decorator';
import { ValidateDatabaseSortAllowed } from 'libs/utils/decorators/database/validate-database-sort-allowed.decorator';
import { SearchTypeEnum } from 'libs/utils/decorators/types';
import { Transaction } from 'sequelize';
import { ModelCtor } from 'sequelize-typescript';

import { TesteEntity } from '../../core/entity/teste';
import { ITesteRepository } from '../../core/repository/teste';
import { TesteListInput, TesteListOutput } from '../../core/use-cases/teste-list';

type Model = ModelCtor<TesteSchema> & TesteEntity;

@Injectable()
export class TesteRepository extends SequelizeRepository<Model> implements ITesteRepository {
  constructor(readonly repository: Model) {
    super(repository);
  }

  async startSession<TTransaction = Transaction>(): Promise<TTransaction> {
    const transaction = await this.repository.sequelize.transaction();

    return transaction as TTransaction;
  }

  @ValidateDatabaseSortAllowed<TesteEntity>('createdAt', 'breed')
  @ConvertPaginateInputToSequelizeFilter<TesteEntity>([
    { name: 'name', type: SearchTypeEnum.like },
    { name: 'breed', type: SearchTypeEnum.like },
    { name: 'age', type: SearchTypeEnum.equal }
  ])
  async paginate(input: TesteListInput, options: DatabaseOptionsType): Promise<TesteListOutput> {
    const { schema } = DatabaseOptionsSchema.parse(options);

    const list = await this.repository.schema(schema).findAndCountAll(input);

    return { docs: list.rows.map((r) => new TesteEntity(r)), limit: input.limit, page: input.page, total: list.count };
  }
}

