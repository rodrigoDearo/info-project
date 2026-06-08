import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { Vehicle } from '../src/modules/vehicles/entities/vehicle.entity';
import { Brand } from '../src/modules/brands/entities/brand.entity';
import { VehicleModel } from '../src/modules/vehicle-models/entities/vehicle-model.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { AuditLog } from '../src/modules/audit/schemas/audit-log.schema';
import { MessagingService } from '../src/modules/messaging/messaging.service';

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
  model: { id: 1, name: 'Corolla', brand: { id: 1, name: 'Toyota' } },
};

const mockUser = {
  id: 1,
  nickname: 'aivacol',
  name: 'Aivacol Admin',
  email: 'admin@aivacol.com',
  password: '$2b$12$hashedpassword',
};

const mockBrand = {
  id: 1,
  name: 'Toyota',
  created_by: 'aivacol',
  models: [],
};

const mockModel = {
  id: 1,
  name: 'Corolla',
  brand_id: 1,
  created_by: 'aivacol',
  brand: mockBrand,
};

const vehicleRepositoryMock = {
  create: jest.fn().mockReturnValue(mockVehicle),
  save: jest.fn().mockResolvedValue(mockVehicle),
  findOne: jest.fn().mockResolvedValue(null),
  findAndCount: jest.fn().mockResolvedValue([[mockVehicle], 1]),
  remove: jest.fn().mockResolvedValue(mockVehicle),
};

const brandRepositoryMock = {
  create: jest.fn().mockReturnValue(mockBrand),
  save: jest.fn().mockResolvedValue(mockBrand),
  findOne: jest.fn().mockResolvedValue(null),
  find: jest.fn().mockResolvedValue([mockBrand]),
  remove: jest.fn().mockResolvedValue(mockBrand),
};

const modelRepositoryMock = {
  create: jest.fn().mockReturnValue(mockModel),
  save: jest.fn().mockResolvedValue(mockModel),
  findOne: jest.fn().mockResolvedValue(mockModel),
  find: jest.fn().mockResolvedValue([mockModel]),
  remove: jest.fn().mockResolvedValue(mockModel),
};

const userRepositoryMock = {
  findOne: jest.fn().mockResolvedValue(mockUser),
};

const cacheManagerMock = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

const auditLogModelMock = {
  create: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockReturnValue({ sort: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }) }),
};

const messagingServiceMock = {
  emitVehicleCreated: jest.fn(),
  emitVehicleUpdated: jest.fn(),
  emitVehicleDeleted: jest.fn(),
};

describe('Fleet API (E2E)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getRepositoryToken(Vehicle)).useValue(vehicleRepositoryMock)
      .overrideProvider(getRepositoryToken(Brand)).useValue(brandRepositoryMock)
      .overrideProvider(getRepositoryToken(VehicleModel)).useValue(modelRepositoryMock)
      .overrideProvider(getRepositoryToken(User)).useValue(userRepositoryMock)
      .overrideProvider(getModelToken(AuditLog.name)).useValue(auditLogModelMock)
      .overrideProvider(CACHE_MANAGER).useValue(cacheManagerMock)
      .overrideProvider(MessagingService).useValue(messagingServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, errorHttpStatusCode: 400 }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManagerMock.get.mockResolvedValue(null);
    vehicleRepositoryMock.findOne.mockResolvedValue(null);
    brandRepositoryMock.findOne.mockResolvedValue(null);
  });

  describe('POST /auth/login', () => {
    it('200 — returns JWT for valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      authToken = res.body.accessToken;
    });

    it('400 — rejects missing password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('details');
    });

    it('400 — rejects password shorter than 6 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: '123' });

      expect(res.status).toBe(400);
    });

    it('401 — rejects wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('GET /auth/me', () => {
    it('200 — returns authenticated user data', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('nickname');
    });

    it('401 — rejects request without token', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('401 — rejects malformed token', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer token.invalido.aqui');

      expect(res.status).toBe(401);
    });
  });

  describe('Authenticated routes — no token', () => {
    const routes = [
      { method: 'get', path: '/vehicles' },
      { method: 'post', path: '/vehicles' },
      { method: 'get', path: '/brands' },
      { method: 'post', path: '/brands' },
      { method: 'get', path: '/models' },
      { method: 'post', path: '/models' },
    ];

    routes.forEach(({ method, path }) => {
      it(`401 — ${method.toUpperCase()} ${path} rejects unauthenticated request`, async () => {
        const res = await (request(app.getHttpServer()) as any)[method](path);
        expect(res.status).toBe(401);
      });
    });
  });

  describe('POST /brands', () => {
    beforeEach(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });
      authToken = loginRes.body.accessToken;
    });

    it('201 — creates brand and returns it', async () => {
      brandRepositoryMock.create.mockReturnValue(mockBrand);
      brandRepositoryMock.save.mockResolvedValue(mockBrand);

      const res = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Toyota' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('name', 'Toyota');
    });

    it('400 — rejects brand with name too short', async () => {
      const res = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'X' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('details');
    });

    it('400 — rejects missing name', async () => {
      const res = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('409 — rejects duplicate brand name', async () => {
      brandRepositoryMock.findOne.mockResolvedValue(mockBrand);

      const res = await request(app.getHttpServer())
        .post('/brands')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Toyota' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /vehicles', () => {
    beforeEach(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });
      authToken = loginRes.body.accessToken;
    });

    const validVehicle = {
      license_plate: 'ABC-1234',
      chassis: '9BWZZZ377VT004251',
      renavam: '12345678901',
      year: 2022,
      model_id: 1,
    };

    it('201 — creates vehicle with all fields', async () => {
      vehicleRepositoryMock.create.mockReturnValue(mockVehicle);
      vehicleRepositoryMock.save.mockResolvedValue(mockVehicle);

      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validVehicle);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('license_plate', 'ABC-1234');
      expect(messagingServiceMock.emitVehicleCreated).toHaveBeenCalledTimes(1);
    });

    it('400 — rejects invalid license plate format', async () => {
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validVehicle, license_plate: 'abc-1234' });

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual(
        expect.arrayContaining([expect.stringContaining('license_plate')]),
      );
    });

    it('400 — rejects renavam with wrong length', async () => {
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validVehicle, renavam: '123' });

      expect(res.status).toBe(400);
    });

    it('400 — rejects year before 1900', async () => {
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validVehicle, year: 1800 });

      expect(res.status).toBe(400);
    });

    it('400 — rejects extra unknown fields (whitelist)', async () => {
      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ ...validVehicle, unknownField: 'should be stripped' });

      expect(res.status).toBe(201);
      expect(res.body).not.toHaveProperty('unknownField');
    });

    it('409 — rejects duplicate license plate', async () => {
      vehicleRepositoryMock.findOne.mockResolvedValue(mockVehicle);

      const res = await request(app.getHttpServer())
        .post('/vehicles')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validVehicle);

      expect(res.status).toBe(409);
    });
  });

  describe('GET /vehicles', () => {
    beforeEach(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });
      authToken = loginRes.body.accessToken;
    });

    it('200 — returns paginated list', async () => {
      vehicleRepositoryMock.findAndCount.mockResolvedValue([[mockVehicle], 1]);

      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta).toMatchObject({ total: 1, page: 1, limit: 10 });
    });

    it('200 — returns cached result without hitting database', async () => {
      const cachedResult = { data: [mockVehicle], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } };
      cacheManagerMock.get.mockResolvedValue(cachedResult);

      const res = await request(app.getHttpServer())
        .get('/vehicles')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(vehicleRepositoryMock.findAndCount).not.toHaveBeenCalled();
    });

    it('200 — accepts pagination query params', async () => {
      vehicleRepositoryMock.findAndCount.mockResolvedValue([[mockVehicle], 1]);

      const res = await request(app.getHttpServer())
        .get('/vehicles?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /vehicles/:id', () => {
    beforeEach(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });
      authToken = loginRes.body.accessToken;
    });

    it('200 — returns vehicle by ID', async () => {
      vehicleRepositoryMock.findOne.mockResolvedValue(mockVehicle);

      const res = await request(app.getHttpServer())
        .get('/vehicles/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 1);
    });

    it('404 — returns not found for nonexistent vehicle', async () => {
      vehicleRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/vehicles/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('999');
    });

    it('400 — rejects non-numeric ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/vehicles/abc')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /vehicles/:id', () => {
    beforeEach(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ nickname: 'aivacol', password: 'aivacol@2024' });
      authToken = loginRes.body.accessToken;
    });

    it('204 — removes vehicle and emits event', async () => {
      cacheManagerMock.get.mockResolvedValue(mockVehicle);
      vehicleRepositoryMock.remove.mockResolvedValue(mockVehicle);

      const res = await request(app.getHttpServer())
        .delete('/vehicles/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);
      expect(messagingServiceMock.emitVehicleDeleted).toHaveBeenCalledTimes(1);
      expect(cacheManagerMock.del).toHaveBeenCalled();
    });

    it('404 — returns not found for nonexistent vehicle', async () => {
      cacheManagerMock.get.mockResolvedValue(null);
      vehicleRepositoryMock.findOne.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .delete('/vehicles/999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});
