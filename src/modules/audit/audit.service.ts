import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface CreateAuditLogDto {
  action: string;
  entity: string;
  entityId: number;
  payload: Record<string, unknown>;
  performedBy: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    await this.auditLogModel.create(dto);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditLogModel.find().sort({ createdAt: -1 }).exec();
  }

  async findByEntity(entity: string, entityId: number): Promise<AuditLog[]> {
    return this.auditLogModel.find({ entity, entityId }).sort({ createdAt: -1 }).exec();
  }
}

