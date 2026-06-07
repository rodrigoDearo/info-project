import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  databaseConfig,
  jwtConfig,
  mongoConfig,
  rabbitmqConfig,
  redisConfig,
} from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BrandsModule } from './modules/brands/brands.module';
import { VehicleModelsModule } from './modules/vehicle-models/vehicle-models.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { AuditModule } from './modules/audit/audit.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { HttpExceptionFilter } from './shared/filters/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, mongoConfig, redisConfig, jwtConfig, rabbitmqConfig],
    }),

    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'mssql',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        autoLoadEntities: true,
        synchronize: false,
        options: {
          encrypt: false,
          trustServerCertificate: true,
        },
      }),
      inject: [ConfigService],
    }),

    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
      }),
      inject: [ConfigService],
    }),

    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: config.get('redis.host'),
            port: config.get('redis.port'),
          },
        }),
        ttl: config.get<number>('redis.ttlSeconds', 300) * 1000,
      }),
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    BrandsModule,
    VehicleModelsModule,
    VehiclesModule,
    AuditModule,
    MessagingModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
