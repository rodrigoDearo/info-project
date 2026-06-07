import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { CreateVehicleModelDto } from './dto/create-vehicle-model.dto';
import { UpdateVehicleModelDto } from './dto/update-vehicle-model.dto';

@Injectable()
export class VehicleModelsService {
  constructor(
    @InjectRepository(VehicleModel)
    private readonly vehicleModelRepository: Repository<VehicleModel>,
  ) {}

  async create(dto: CreateVehicleModelDto, createdBy: string): Promise<VehicleModel> {
    const model = this.vehicleModelRepository.create({ ...dto, created_by: createdBy });
    return this.vehicleModelRepository.save(model);
  }

  async findAll(): Promise<VehicleModel[]> {
    return this.vehicleModelRepository.find({ relations: ['brand'] });
  }

  async findOne(id: number): Promise<VehicleModel> {
    const model = await this.vehicleModelRepository.findOne({ where: { id }, relations: ['brand'] });
    if (!model) throw new NotFoundException(`Model #${id} not found`);
    return model;
  }

  async update(id: number, dto: UpdateVehicleModelDto, updatedBy: string): Promise<VehicleModel> {
    const model = await this.findOne(id);
    Object.assign(model, dto, { created_by: updatedBy });
    return this.vehicleModelRepository.save(model);
  }

  async remove(id: number): Promise<void> {
    const model = await this.findOne(id);
    await this.vehicleModelRepository.remove(model);
  }
}
