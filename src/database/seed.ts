import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from './data-source';
import { User } from '../modules/users/entities/user.entity';
import { Brand } from '../modules/brands/entities/brand.entity';
import { VehicleModel } from '../modules/vehicle-models/entities/vehicle-model.entity';
import { Vehicle } from '../modules/vehicles/entities/vehicle.entity';

dotenv.config();

async function seedUsers(dataSource: DataSource): Promise<User> {
  const userRepository = dataSource.getRepository(User);
  const existing = await userRepository.findOne({ where: { nickname: 'aivacol' } });
  if (existing) return existing;

  const user = userRepository.create({
    nickname: 'aivacol',
    name: 'Aivacol Admin',
    email: 'admin@aivacol.com',
    password: await bcrypt.hash('aivacol@2024', 12),
  });

  return userRepository.save(user);
}

async function seedBrands(dataSource: DataSource): Promise<Brand[]> {
  const brandRepository = dataSource.getRepository(Brand);
  const count = await brandRepository.count();
  if (count > 0) return brandRepository.find();

  const brands = brandRepository.create([
    { name: 'Toyota', created_by: 'aivacol' },
    { name: 'Honda', created_by: 'aivacol' },
    { name: 'Volkswagen', created_by: 'aivacol' },
  ]);

  return brandRepository.save(brands);
}

async function seedModels(dataSource: DataSource, brands: Brand[]): Promise<VehicleModel[]> {
  const modelRepository = dataSource.getRepository(VehicleModel);
  const count = await modelRepository.count();
  if (count > 0) return modelRepository.find();

  const toyota = brands.find(b => b.name === 'Toyota')!;
  const honda = brands.find(b => b.name === 'Honda')!;
  const vw = brands.find(b => b.name === 'Volkswagen')!;

  const models = modelRepository.create([
    { name: 'Corolla', brand_id: toyota.id, created_by: 'aivacol' },
    { name: 'Hilux', brand_id: toyota.id, created_by: 'aivacol' },
    { name: 'Civic', brand_id: honda.id, created_by: 'aivacol' },
    { name: 'Gol', brand_id: vw.id, created_by: 'aivacol' },
  ]);

  return modelRepository.save(models);
}

async function seedVehicles(dataSource: DataSource, models: VehicleModel[]): Promise<void> {
  const vehicleRepository = dataSource.getRepository(Vehicle);
  const count = await vehicleRepository.count();
  if (count > 0) return;

  const seedFilePath = path.join(__dirname, '../../seed_vehicles.json');
  const seedData = JSON.parse(fs.readFileSync(seedFilePath, 'utf-8'));

  const vehicles = seedData.map((item: Record<string, unknown>) => {
    const model = models.find(m => m.name === item.model_name) ?? models[0];
    return vehicleRepository.create({
      license_plate: item.license_plate as string,
      chassis: item.chassis as string,
      renavam: item.renavam as string,
      year: item.year as number,
      model_id: model.id,
      created_by: 'aivacol',
    });
  });

  await vehicleRepository.save(vehicles);
}

async function main() {
  await AppDataSource.initialize();
  console.log('Seeding banco de dados...');

  const user = await seedUsers(AppDataSource);
  console.log(`Usuario: ${user.nickname}`);

  const brands = await seedBrands(AppDataSource);
  console.log(`Marcas: ${brands.map(b => b.name).join(', ')}`);

  const models = await seedModels(AppDataSource, brands);
  console.log(`Modelos: ${models.map(m => m.name).join(', ')}`);

  await seedVehicles(AppDataSource, models);
  console.log('Veículos > seed_vehicles.json');

  await AppDataSource.destroy();
  console.log('\nFinalizado:. Login: aivacol / aivacol@2024');
}

main().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

