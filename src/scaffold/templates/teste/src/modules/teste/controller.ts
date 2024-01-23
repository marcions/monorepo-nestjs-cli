import { Controller, Delete, Get, Post, Put, Req, Version } from '@nestjs/common';
  import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
  import { UserRole } from 'libs/core/user/entity/user';
  import { Roles } from 'libs/utils/decorators/role.decorator';
  import { ApiRequest } from 'libs/utils/request';
  import { SearchHttpSchema } from 'libs/utils/search';
  import { SortHttpSchema } from 'libs/utils/sort';
  
  import { TesteCreateInput, TesteCreateOutput } from '../../core/use-cases/testecreate';
  import { TesteDeleteInput, TesteDeleteOutput } from '../../core/use-cases/testedelete';
  import { TesteGetByIDInput, TesteGetByIDOutput } from '../../core/use-cases/testegetByID';
  import { TesteListInput, TesteListOutput } from '../../core/use-cases/testelist';
  import { TesteUpdateInput, TesteUpdateOutput } from '../../core/use-cases/testeupdate';
  import {
    ITesteCreateAdapter,
    ITesteDeleteAdapter,
    ITesteGetByIDAdapter,
    ITesteListAdapter,
    ITesteUpdateAdapter
  } from './adapter';
  import { SwagggerRequest, SwagggerResponse } from './swagger';
  
  @Controller()
  @ApiTags('teste')
  @ApiBearerAuth()
  @Roles(UserRole.USER)
  export class TesteController {
    constructor(
      private readonly testeCreate: TesteCreateAdapter,
      private readonly testeUpdate: TesteUpdateAdapter,
      private readonly testeGetByID: TesteGetByIDAdapter,
      private readonly testeList: TesteListAdapter,
      private readonly testeDelete: TesteDeleteAdapter
    ) {}
  
    @Post()
    @ApiResponse(SwagggerResponse.create[200])
    @ApiBody(SwagggerRequest.createBody)
    @Version('1')
    async create(@Req() { body, user, tracing }: ApiRequest): Promise<TesteCreateOutput> {
      return await this.testeCreate.execute(body as TesteCreateInput, { user, tracing });
    }
  
    @Put()
    @ApiResponse(SwagggerResponse.update[200])
    @ApiResponse(SwagggerResponse.update[404])
    @ApiBody(SwagggerRequest.updateBody)
    @Version('1')
    async update(@Req() { body, user, tracing }: ApiRequest): Promise<TesteUpdateOutput> {
      return await this.testeUpdate.execute(body as TesteUpdateInput, { user, tracing });
    }
  
    @Get('/:id')
    @ApiParam({ name: 'id', required: true })
    @ApiResponse(SwagggerResponse.getByID[200])
    @ApiResponse(SwagggerResponse.getByID[404])
    @Version('1')
    async getById(@Req() { params }: ApiRequest): Promise<TesteGetByIDOutput> {
      return await this.testeGetByID.execute(params as TesteGetByIDInput);
    }
  
    @Get()
    @ApiQuery(SwagggerRequest.listQuery.pagination.limit)
    @ApiQuery(SwagggerRequest.listQuery.pagination.page)
    @ApiQuery(SwagggerRequest.listQuery.sort)
    @ApiQuery(SwagggerRequest.listQuery.search)
    @ApiResponse(SwagggerResponse.list[200])
    @Version('1')
    async list(@Req() { query }: ApiRequest): Promise<TesteListOutput> {
      const input: TesteListInput = {
        sort: SortHttpSchema.parse(query.sort),
        search: SearchHttpSchema.parse(query.search),
        limit: Number(query.limit),
        page: Number(query.page)
      };
  
      return await this.testeList.execute(input);
    }
  
    @Delete('/:id')
    @ApiParam({ name: 'id', required: true })
    @ApiResponse(SwagggerResponse.delete[200])
    @ApiResponse(SwagggerResponse.delete[404])
    @Version('1')
    async delete(@Req() { params, user, tracing }: ApiRequest): Promise<TesteDeleteOutput> {
      return await this.testeDelete.execute(params as TesteDeleteInput, { user, tracing });
    }
  }
    
