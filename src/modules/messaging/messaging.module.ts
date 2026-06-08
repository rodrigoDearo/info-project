import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VEHICLE_EVENTS_CLIENT } from './constants/events.constants';
import { MessagingService } from './messaging.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: VEHICLE_EVENTS_CLIENT,
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('rabbitmq.url')!],
            queue: config.get<string>('rabbitmq.vehicleQueue'),
            queueOptions: { durable: true },
            noAck: false,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [MessagingService],
  exports: [MessagingService],
})
export class MessagingModule {}

