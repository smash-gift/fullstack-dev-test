import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, X-Guest-ID, Accept-Language',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Gift Card Message Suggester API')
    .setDescription(
      'RESTful API for generating personalized gift card message suggestions powered by Google Gemini',
    )
    .setVersion('1.0.0')
    .addTag('Suggestions', 'Gift card message suggestion generation endpoints')
    .addApiKey(
      { type: 'apiKey', name: 'X-Guest-ID', in: 'header' },
      'X-Guest-ID',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  await app.listen(port);
  logger.log(
    `Server successfully listening on http://localhost:${port}/api/v1`,
  );
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}

bootstrap();
