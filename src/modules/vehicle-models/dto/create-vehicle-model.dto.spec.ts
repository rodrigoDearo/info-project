import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateVehicleModelDto } from './create-vehicle-model.dto';

async function validateDto(data: object) {
  const dto = plainToInstance(CreateVehicleModelDto, data);
  return validate(dto);
}

describe('CreateVehicleModelDto', () => {
  it('should pass with name only (brand_id optional)', async () => {
    const errors = await validateDto({ name: 'Corolla' });
    expect(errors).toHaveLength(0);
  });

  it('should pass with name and valid brand_id', async () => {
    const errors = await validateDto({ name: 'Corolla', brand_id: 1 });
    expect(errors).toHaveLength(0);
  });

  it('should reject name shorter than 2 characters', async () => {
    const errors = await validateDto({ name: 'X' });
    expect(errors.some(e => e.property === 'name')).toBe(true);
  });

  it('should reject name longer than 100 characters', async () => {
    const errors = await validateDto({ name: 'A'.repeat(101) });
    expect(errors.some(e => e.property === 'name')).toBe(true);
  });

  it('should reject missing name', async () => {
    const errors = await validateDto({});
    expect(errors.some(e => e.property === 'name')).toBe(true);
  });

  it('should reject negative brand_id', async () => {
    const errors = await validateDto({ name: 'Corolla', brand_id: -1 });
    expect(errors.some(e => e.property === 'brand_id')).toBe(true);
  });

  it('should reject zero as brand_id', async () => {
    const errors = await validateDto({ name: 'Corolla', brand_id: 0 });
    expect(errors.some(e => e.property === 'brand_id')).toBe(true);
  });

  it('should reject float as brand_id', async () => {
    const errors = await validateDto({ name: 'Corolla', brand_id: 1.5 });
    expect(errors.some(e => e.property === 'brand_id')).toBe(true);
  });
});
