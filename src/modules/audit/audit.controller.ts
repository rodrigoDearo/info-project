import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { VehicleEvents } from '../messaging/constants/events.constants';
import { AuditService } from './audit.service';
import { VehicleEventPayload } from '../messaging/messaging.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @EventPattern(VehicleEvents.CREATED)
  async handleVehicleCreated(@Payload() payload: VehicleEventPayload) {
    await this.auditService.log({
      action: 'created',
      entity: 'vehicle',
      entityId: payload.entityId,
      payload: payload.data,
      performedBy: payload.performedBy,
    });
  }

  @EventPattern(VehicleEvents.UPDATED)
  async handleVehicleUpdated(@Payload() payload: VehicleEventPayload) {
    await this.auditService.log({
      action: 'updated',
      entity: 'vehicle',
      entityId: payload.entityId,
      payload: payload.data,
      performedBy: payload.performedBy,
    });
  }

  @EventPattern(VehicleEvents.DELETED)
  async handleVehicleDeleted(@Payload() payload: VehicleEventPayload) {
    await this.auditService.log({
      action: 'deleted',
      entity: 'vehicle',
      entityId: payload.entityId,
      payload: payload.data,
      performedBy: payload.performedBy,
    });
  }
}
