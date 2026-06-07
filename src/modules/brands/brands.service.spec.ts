import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { BrandsService } from './brands.service';

const mockBrand = { id: 1, name: 'Toyota', created_by: 'aivacol', models: [] };

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

describe('BrandsService', () => {
  let service: BrandsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BrandsService,
        { provide: getRepositoryToken(Brand), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<BrandsService>(BrandsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create and return a brand', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(mockBrand);
      mockRepository.save.mockResolvedValue(mockBrand);

      const result = await service.create({ name: 'Toyota' }, 'aivacol');
      expect(result).toEqual(mockBrand);
    });

    it('should throw ConflictException for duplicate brand name', async () => {
      mockRepository.findOne.mockResolvedValue(mockBrand);
      await expect(service.create({ name: 'Toyota' }, 'aivacol')).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a brand by ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockBrand);
      const result = await service.findOne(1);
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException for missing brand', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
