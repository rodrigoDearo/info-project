import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { MessagingService } from '../messaging/messaging.service';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';

const VEHICLES_CACHE_KEY = 'vehicles:all';
const vehicleByIdCacheKey = (id: number) => `vehicles:${id}`;

@Injectable()
export class VehiclesService {
  private readonly cacheTtl: number;

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly messagingService: MessagingService,
    private readonly configService: ConfigService,
  ) {
    this.cacheTtl = this.configService.get<number>('redis.ttlSeconds', 300) * 1000;
  }

  async create(dto: CreateVehicleDto, createdBy: string): Promise<Vehicle> {
    await this.assertNoDuplicates(dto);

    const vehicle = this.vehicleRepository.create({ ...dto, created_by: createdBy });
    const savedVehicle = await this.vehicleRepository.save(vehicle);

    await this.invalidateVehicleCache(savedVehicle.id);

    this.messagingService.emitVehicleCreated({
      entityId: savedVehicle.id,
      data: savedVehicle as unknown as Record<string, unknown>,
      performedBy: createdBy,
    });

    return savedVehicle;
  }

  async findAll(query: QueryVehicleDto): Promise<{ data: Vehicle[]; meta: object }> {
    const cacheKey = `${VEHICLES_CACHE_KEY}:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get<{ data: Vehicle[]; meta: object }>(cacheKey);
    if (cached) return cached;

    const where: Record<string, unknown> = {};
    if (query.license_plate) where['license_plate'] = ILike(`%${query.license_plate}%`);
    if (query.model_id) where['model_id'] = query.model_id;
    if (query.year) where['year'] = query.year;

    const [data, total] = await this.vehicleRepository.findAndCount({
      where,
      relations: ['model', 'model.brand'],
      skip: ((query.page ?? 1) - 1) * (query.limit ?? 10),
      take: query.limit ?? 10,
      order: { created_at: 'DESC' },
    });

    const result = {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        totalPages: Math.ceil(total / (query.limit ?? 10)),
      },
    };

    await this.cacheManager.set(cacheKey, result, this.cacheTtl);
    return result;
  }

  async findOne(id: number): Promise<Vehicle> {
    const cacheKey = vehicleByIdCacheKey(id);
    const cached = await this.cacheManager.get<Vehicle>(cacheKey);
    if (cached) return cached;

    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['model', 'model.brand'],
    });
    if (!vehicle) throw new NotFoundException(`Vehicle #${id} not found`);

    await this.cacheManager.set(cacheKey, vehicle, this.cacheTtl);
    return vehicle;
  }

  async update(id: number, dto: UpdateVehicleDto, updatedBy: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);

    if (dto.license_plate && dto.license_plate !== vehicle.license_plate) {
      const duplicate = await this.vehicleRepository.findOne({ where: { license_plate: dto.license_plate } });
      if (duplicate) throw new ConflictException(`License plate "${dto.license_plate}" already registered`);
    }

    Object.assign(vehicle, dto, { created_by: updatedBy });
    const updated = await this.vehicleRepository.save(vehicle);

    await this.invalidateVehicleCache(id);

    this.messagingService.emitVehicleUpdated({
      entityId: id,
      data: updated as unknown as Record<string, unknown>,
      performedBy: updatedBy,
    });

    return updated;
  }

  async remove(id: number, removedBy: string): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepository.remove(vehicle);

    await this.invalidateVehicleCache(id);

    this.messagingService.emitVehicleDeleted({
      entityId: id,
      data: vehicle as unknown as Record<string, unknown>,
      performedBy: removedBy,
    });
  }

  private async assertNoDuplicates(dto: CreateVehicleDto): Promise<void> {
    const [byPlate, byChassis, byRenavam] = await Promise.all([
      this.vehicleRepository.findOne({ where: { license_plate: dto.license_plate } }),
      this.vehicleRepository.findOne({ where: { chassis: dto.chassis } }),
      this.vehicleRepository.findOne({ where: { renavam: dto.renavam } }),
    ]);

    if (byPlate) throw new ConflictException(`License plate "${dto.license_plate}" already registered`);
    if (byChassis) throw new ConflictException(`Chassis "${dto.chassis}" already registered`);
    if (byRenavam) throw new ConflictException(`Renavam "${dto.renavam}" already registered`);
  }

  private async invalidateVehicleCache(vehicleId: number): Promise<void> {
    await Promise.all([
      this.cacheManager.del(vehicleByIdCacheKey(vehicleId)),
      this.cacheManager.del(VEHICLES_CACHE_KEY),
    ]);
  }
}
