import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VehicleModel } from './entities/vehicle-model.entity';
import { VehicleModelsService } from './vehicle-models.service';

const mockModel = { id: 1, name: 'Corolla', brand_id: 1, created_by: 'aivacol', brand: null };

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

describe('VehicleModelsService', () => {
  let service: VehicleModelsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleModelsService,
        { provide: getRepositoryToken(VehicleModel), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<VehicleModelsService>(VehicleModelsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a vehicle model', async () => {
      mockRepository.create.mockReturnValue(mockModel);
      mockRepository.save.mockResolvedValue(mockModel);

      const result = await service.create({ name: 'Corolla', brand_id: 1 }, 'aivacol');
      expect(result).toEqual(mockModel);
      expect(mockRepository.create).toHaveBeenCalledWith({ name: 'Corolla', brand_id: 1, created_by: 'aivacol' });
    });
  });

  describe('findOne', () => {
    it('should return model by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockModel);
      const result = await service.findOne(1);
      expect(result).toEqual(mockModel);
    });

    it('should throw NotFoundException when model not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove and return void', async () => {
      mockRepository.findOne.mockResolvedValue(mockModel);
      mockRepository.remove.mockResolvedValue(mockModel);
      await expect(service.remove(1)).resolves.toBeUndefined();
    });
  });
});
