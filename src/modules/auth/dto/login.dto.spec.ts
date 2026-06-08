import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

async function validateDto(data: object) {
  const dto = plainToInstance(LoginDto, data);
  return validate(dto);
}

describe('LoginDto', () => {
  it('should pass with valid credentials', async () => {
    const errors = await validateDto({ nickname: 'aivacol', password: 'aivacol@2024' });
    expect(errors).toHaveLength(0);
  });

  it('should reject missing nickname', async () => {
    const errors = await validateDto({ password: 'aivacol@2024' });
    expect(errors.some(e => e.property === 'nickname')).toBe(true);
  });

  it('should reject missing password', async () => {
    const errors = await validateDto({ nickname: 'aivacol' });
    expect(errors.some(e => e.property === 'password')).toBe(true);
  });

  it('should reject password shorter than 6 characters', async () => {
    const errors = await validateDto({ nickname: 'aivacol', password: '123' });
    expect(errors.some(e => e.property === 'password')).toBe(true);
  });

  it('should reject numeric nickname', async () => {
    const errors = await validateDto({ nickname: 12345, password: 'aivacol@2024' });
    expect(errors.some(e => e.property === 'nickname')).toBe(true);
  });
});
