import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBrandDto } from './create-brand.dto';

async function validateDto(data: object) {
  const dto = plainToInstance(CreateBrandDto, data);
  return validate(dto);
}

describe('CreateBrandDto', () => {
  it('should pass with valid name', async () => {
    const errors = await validateDto({ name: 'Toyota' });
    expect(errors).toHaveLength(0);
  });

  it('should reject name shorter than 2 characters', async () => {
    const errors = await validateDto({ name: 'A' });
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

  it('should reject numeric name', async () => {
    const errors = await validateDto({ name: 12345 });
    expect(errors.some(e => e.property === 'name')).toBe(true);
  });

  it('should accept name with exactly 2 characters', async () => {
    const errors = await validateDto({ name: 'VW' });
    expect(errors).toHaveLength(0);
  });

  it('should accept name with exactly 100 characters', async () => {
    const errors = await validateDto({ name: 'A'.repeat(100) });
    expect(errors).toHaveLength(0);
  });
});
