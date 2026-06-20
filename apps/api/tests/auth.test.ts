import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';

const BASE_URL = '/api/auth';

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('POST /api/auth/register', () => {
  it('should register a new user successfully', async () => {
    const res = await request(app).post(`${BASE_URL}/register`).send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test@1234',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('test@example.com');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post(`${BASE_URL}/register`).send({
      name: 'Test User 2',
      email: 'test@example.com',
      password: 'Test@1234',
    });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should reject weak passwords', async () => {
    const res = await request(app).post(`${BASE_URL}/register`).send({
      name: 'Weak Pass',
      email: 'weak@example.com',
      password: '123456',
    });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app).post(`${BASE_URL}/login`).send({
      email: 'test@example.com',
      password: 'Test@1234',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tokens.accessToken).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post(`${BASE_URL}/login`).send({
      email: 'test@example.com',
      password: 'WrongPass@1',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/auth/me', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app).post(`${BASE_URL}/login`).send({
      email: 'test@example.com',
      password: 'Test@1234',
    });
    accessToken = res.body.data.tokens.accessToken;
  });

  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get(`${BASE_URL}/me`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('test@example.com');
  });

  it('should return 401 without token', async () => {
    const res = await request(app).get(`${BASE_URL}/me`);
    expect(res.status).toBe(401);
  });
});
