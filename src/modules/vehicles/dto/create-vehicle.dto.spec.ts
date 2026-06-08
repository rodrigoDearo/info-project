import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateVehicleDto } from './create-vehicle.dto';

const validDto = {
  license_plate: 'ABC-1234',
  chassis: '9BWZZZ377VT004251',
  renavam: '12345678901',
  year: 2022,
  model_id: 1,
};

async function validateDto(data: object) {
  const dto = plainToInstance(CreateVehicleDto, data);
  return validate(dto);
}

describe('CreateVehicleDto', () => {
  it('should pass with valid data', async () => {
    const errors = await validateDto(validDto);
    expect(errors).toHaveLength(0);
  });

  describe('license_plate', () => {
    it('should accept old format ABC-1234', async () => {
      const errors = await validateDto({ ...validDto, license_plate: 'ABC-1234' });
      expect(errors).toHaveLength(0);
    });

    it('should accept Mercosul format ABC1D23', async () => {
      const errors = await validateDto({ ...validDto, license_plate: 'ABC1D23' });
      expect(errors).toHaveLength(0);
    });

    it('should reject lowercase plate', async () => {
      const errors = await validateDto({ ...validDto, license_plate: 'abc-1234' });
      expect(errors.some(e => e.property === 'license_plate')).toBe(true);
    });

    it('should reject empty plate', async () => {
      const errors = await validateDto({ ...validDto, license_plate: '' });
      expect(errors.some(e => e.property === 'license_plate')).toBe(true);
    });

    it('should reject invalid format', async () => {
      const errors = await validateDto({ ...validDto, license_plate: '1234-ABC' });
      expect(errors.some(e => e.property === 'license_plate')).toBe(true);
    });
  });

  describe('renavam', () => {
    it('should accept exactly 11 digits', async () => {
      const errors = await validateDto({ ...validDto, renavam: '12345678901' });
      expect(errors).toHaveLength(0);
    });

    it('should reject fewer than 11 digits', async () => {
      const errors = await validateDto({ ...validDto, renavam: '1234567890' });
      expect(errors.some(e => e.property === 'renavam')).toBe(true);
    });

    it('should reject more than 11 digits', async () => {
      const errors = await validateDto({ ...validDto, renavam: '123456789012' });
      expect(errors.some(e => e.property === 'renavam')).toBe(true);
    });

    it('should reject letters', async () => {
      const errors = await validateDto({ ...validDto, renavam: '1234567890A' });
      expect(errors.some(e => e.property === 'renavam')).toBe(true);
    });
  });

  describe('year', () => {
    it('should accept current year', async () => {
      const errors = await validateDto({ ...validDto, year: new Date().getFullYear() });
      expect(errors).toHaveLength(0);
    });

    it('should reject year before 1900', async () => {
      const errors = await validateDto({ ...validDto, year: 1899 });
      expect(errors.some(e => e.property === 'year')).toBe(true);
    });

    it('should reject year too far in the future', async () => {
      const errors = await validateDto({ ...validDto, year: new Date().getFullYear() + 2 });
      expect(errors.some(e => e.property === 'year')).toBe(true);
    });

    it('should reject string year', async () => {
      const errors = await validateDto({ ...validDto, year: 'dois mil' });
      expect(errors.some(e => e.property === 'year')).toBe(true);
    });
  });

  describe('model_id', () => {
    it('should reject zero', async () => {
      const errors = await validateDto({ ...validDto, model_id: 0 });
      expect(errors.some(e => e.property === 'model_id')).toBe(true);
    });

    it('should reject negative', async () => {
      const errors = await validateDto({ ...validDto, model_id: -1 });
      expect(errors.some(e => e.property === 'model_id')).toBe(true);
    });

    it('should reject float', async () => {
      const errors = await validateDto({ ...validDto, model_id: 1.5 });
      expect(errors.some(e => e.property === 'model_id')).toBe(true);
    });
  });

  describe('required fields', () => {
    it('should reject missing license_plate', async () => {
      const { license_plate, ...rest } = validDto;
      const errors = await validateDto(rest);
      expect(errors.some(e => e.property === 'license_plate')).toBe(true);
    });

    it('should reject missing chassis', async () => {
      const { chassis, ...rest } = validDto;
      const errors = await validateDto(rest);
      expect(errors.some(e => e.property === 'chassis')).toBe(true);
    });

    it('should reject missing renavam', async () => {
      const { renavam, ...rest } = validDto;
      const errors = await validateDto(rest);
      expect(errors.some(e => e.property === 'renavam')).toBe(true);
    });

    it('should reject missing year', async () => {
      const { year, ...rest } = validDto;
      const errors = await validateDto(rest);
      expect(errors.some(e => e.property === 'year')).toBe(true);
    });

    it('should reject missing model_id', async () => {
      const { model_id, ...rest } = validDto;
      const errors = await validateDto(rest);
      expect(errors.some(e => e.property === 'model_id')).toBe(true);
    });
  });
});
