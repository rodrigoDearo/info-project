import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [config.get<string>('rabbitmq.url')!],
      queue: config.get<string>('rabbitmq.vehicleQueue'),
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, errorHttpStatusCode: 400 }),
  );

  if (config.get('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Fleet Management API')
      .setDescription('Aivacol Fleet Management — Backend')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  await app.startAllMicroservices();

  const port = config.get('PORT', 3000);
  await app.listen(port);
  console.log(` Endpoint http://localhost:${port}  &  Documentacao: http://localhost:${port}/docs`);
}

bootstrap();
