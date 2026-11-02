import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Auth API (/api/v1/auth)', () => {
  const testUser = {
    fullName: 'David Iorfa',
    email: `david.iorfa.${Date.now()}@example.com`,
    password: 'Password123!',
    phone: '+2348039876543',
  };

  it('should register a new guest user successfully', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.role).toBe('GUEST');
    expect(res.body.data).toHaveProperty('token');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject registration when email is already taken', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });

  it('should reject registration with weak password', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      fullName: 'Weak User',
      email: `weak.${Date.now()}@example.com`,
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should authenticate seeded admin user', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@yahsab.com',
      password: 'YahsabAdmin2026!',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('ADMIN');
    expect(res.body.data).toHaveProperty('token');
  });

  it('should reject invalid login credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@yahsab.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return current user profile on GET /me with valid token', async () => {
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'guest@yahsab.com',
      password: 'YahsabGuest2026!',
    });

    const token = loginRes.body.data.token;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe('guest@yahsab.com');
  });

  it('should reject GET /me without authorization', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
