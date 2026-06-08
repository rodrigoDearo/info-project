import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
  ) {}

  async create(dto: CreateBrandDto, createdBy: string): Promise<Brand> {
    const existing = await this.brandRepository.findOne({ where: { name: dto.name } });
    if (existing) throw new ConflictException(`Brand "${dto.name}" already exists`);

    const brand = this.brandRepository.create({ ...dto, created_by: createdBy });
    return this.brandRepository.save(brand);
  }

  async findAll(): Promise<Brand[]> {
    return this.brandRepository.find({ relations: ['models'] });
  }

  async findOne(id: number): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ where: { id }, relations: ['models'] });
    if (!brand) throw new NotFoundException(`Brand #${id} not found`);
    return brand;
  }

  async update(id: number, dto: UpdateBrandDto, updatedBy: string): Promise<Brand> {
    const brand = await this.findOne(id);
    if (dto.name && dto.name !== brand.name) {
      const existing = await this.brandRepository.findOne({ where: { name: dto.name } });
      if (existing) throw new ConflictException(`Brand "${dto.name}" already exists`);
    }
    Object.assign(brand, dto, { created_by: updatedBy });
    return this.brandRepository.save(brand);
  }

  async remove(id: number): Promise<void> {
    const brand = await this.findOne(id);
    await this.brandRepository.remove(brand);
  }
}

