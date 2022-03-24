import { HttpStatus, RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { description, name, version } from 'apps/auth-api/package.json';
import { ILoggerService, ISecretsService } from 'libs/modules/global';
import {
  ApiException,
  AppExceptionFilter,
  DEFAULT_TAG,
  ExceptionInterceptor,
  HttpLoggerInterceptor,
  SWAGGER_API_ROOT,
} from 'libs/utils';

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

  const loggerService = app.get(ILoggerService);

  loggerService.setContext(name);
  app.useGlobalFilters(new AppExceptionFilter(loggerService));
  app.useGlobalInterceptors(new ExceptionInterceptor(), new HttpLoggerInterceptor(loggerService));

  const {
    yourAPI: { PORT },
    ENV,
  } = app.get(ISecretsService);

  app.useLogger(loggerService);

  app.setGlobalPrefix('api', {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  const config = new DocumentBuilder()
    .setTitle(name)
    .setDescription(description)
    .setVersion(version)
    .addTag(DEFAULT_TAG)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_API_ROOT, app, document);

  loggerService.log(`🟢 ${name} listening at ${PORT} on ${ENV?.toUpperCase()} 🟢\n`);

  await app.listen(PORT);

  loggerService.log(`🔵 Swagger listening at ${await app.getUrl()}/${SWAGGER_API_ROOT}  🔵 \n`);

  process.on('unhandledRejection', (error: ApiException) => {
    error.statusCode = 500;
    error.context = 'unhandledRejection';
    loggerService.error(error);
  });
}
bootstrap();
