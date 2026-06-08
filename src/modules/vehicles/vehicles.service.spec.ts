import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessagingService } from '../messaging/messaging.service';
import { Vehicle } from './entities/vehicle.entity';
import { VehiclesService } from './vehicles.service';

const mockVehicle = {
  id: 1,
  license_plate: 'ABC-1234',
  chassis: '9BWZZZ377VT004251',
  renavam: '12345678901',
  year: 2022,
  model_id: 1,
  created_by: 'aivacol',
  created_at: new Date(),
  updated_at: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  remove: jest.fn(),
};

const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

const mockMessagingService = {
  emitVehicleCreated: jest.fn(),
  emitVehicleUpdated: jest.fn(),
  emitVehicleDeleted: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue(300),
};

describe('VehiclesService', () => {
  let service: VehiclesService;
  let repository: Repository<Vehicle>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: getRepositoryToken(Vehicle), useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: MessagingService, useValue: mockMessagingService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    repository = module.get<Repository<Vehicle>>(getRepositoryToken(Vehicle));
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a vehicle', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockVehicle);
      mockRepository.save.mockResolvedValue(mockVehicle);
      mockCacheManager.del.mockResolvedValue(undefined);

      const dto = {
        license_plate: 'ABC-1234',
        chassis: '9BWZZZ377VT004251',
        renavam: '12345678901',
        year: 2022,
        model_id: 1,
      };

      const result = await service.create(dto, 'aivacol');

      expect(result).toEqual(mockVehicle);
      expect(mockMessagingService.emitVehicleCreated).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });

    it('should throw ConflictException when license plate already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockVehicle);

      await expect(
        service.create({
          license_plate: 'ABC-1234',
          chassis: '9BWZZZ377VT004999',
          renavam: '99999999901',
          year: 2022,
          model_id: 1,
        }, 'aivacol'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return vehicle from cache when available', async () => {
      mockCacheManager.get.mockResolvedValue(mockVehicle);

      const result = await service.findOne(1);

      expect(result).toEqual(mockVehicle);
      expect(mockRepository.findOne).not.toHaveBeenCalled();
    });

    it('should fetch from database and cache when not in cache', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(mockVehicle);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findOne(1);

      expect(result).toEqual(mockVehicle);
      expect(mockRepository.findOne).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.set).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when vehicle does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove vehicle and emit delete event', async () => {
      mockCacheManager.get.mockResolvedValue(mockVehicle);
      mockRepository.remove.mockResolvedValue(mockVehicle);
      mockCacheManager.del.mockResolvedValue(undefined);

      await service.remove(1, 'aivacol');

      expect(mockRepository.remove).toHaveBeenCalledTimes(1);
      expect(mockMessagingService.emitVehicleDeleted).toHaveBeenCalledTimes(1);
      expect(mockCacheManager.del).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return cached result when available', async () => {
      const cachedResult = { data: [mockVehicle], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      mockCacheManager.get.mockResolvedValue(cachedResult);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(cachedResult);
      expect(mockRepository.findAndCount).not.toHaveBeenCalled();
    });

    it('should query database and cache when cache is empty', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.findAndCount.mockResolvedValue([[mockVehicle], 1]);
      mockCacheManager.set.mockResolvedValue(undefined);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(mockCacheManager.set).toHaveBeenCalledTimes(1);
    });
  });
});

