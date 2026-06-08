import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { VEHICLE_EVENTS_CLIENT, VehicleEvents } from './constants/events.constants';

export interface VehicleEventPayload {
  entityId: number;
  data: Record<string, unknown>;
  performedBy: string;
}

@Injectable()
export class MessagingService {
  constructor(
    @Inject(VEHICLE_EVENTS_CLIENT) private readonly client: ClientProxy,
  ) {}

  emitVehicleCreated(payload: VehicleEventPayload) {
    this.client.emit(VehicleEvents.CREATED, payload);
  }

  emitVehicleUpdated(payload: VehicleEventPayload) {
    this.client.emit(VehicleEvents.UPDATED, payload);
  }

  emitVehicleDeleted(payload: VehicleEventPayload) {
    this.client.emit(VehicleEvents.DELETED, payload);
  }
}

