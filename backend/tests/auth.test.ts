import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Legacy local-password endpoints', () => {
  it('does not authenticate new users with the old database password hash', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({ email: 'guest@example.com', password: 'anything' });
    expect(response.status).toBe(410);
    expect(response.body.message).toContain('Supabase Auth');
  });

  it('does not create accounts outside Supabase Auth', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({ email: 'new@example.com', password: 'Password123!' });
    expect(response.status).toBe(410);
  });

  it('requires a verified Supabase session for the profile endpoint', async () => {
    expect((await request(app).get('/api/v1/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/auth/me')).status).toBe(401);
  });
});
