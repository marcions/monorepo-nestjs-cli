import { name } from 'apps/teste/package.json';
import { TesteRequest } from 'libs/utils/docs/data/teste/request';
import { TesteResponse } from 'libs/utils/docs/data/teste/response';
import { Swagger } from 'libs/utils/docs/swagger';

export const SwagggerResponse = {
  create: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: TesteResponse.create,
      description: 'teste created.'
    })
  },
  update: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: TesteResponse.update,
      description: 'teste updated.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/teste',
      message: 'teste Not Found',
      description: 'teste not found.'
    })
  },
  getByID: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: TesteResponse.getByID,
      description: 'teste found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/teste/:id',
      message: 'teste Not Found',
      description: 'teste not found.'
    })
  },
  delete: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: TesteResponse.delete,
      description: 'teste found.'
    }),
    404: Swagger.defaultResponseError({
      status: 404,
      route: 'api/teste/:id',
      message: 'teste Not Found',
      description: 'teste not found.'
    })
  },
  list: {
    200: Swagger.defaultResponseJSON({
      status: 200,
      json: TesteResponse.list,
      description: 'teste created.'
    })
  }
};

export const SwagggerRequest = {
  createBody: Swagger.defaultRequestJSON(TesteRequest.create),
  updateBody: Swagger.defaultRequestJSON(TesteRequest.update),
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

