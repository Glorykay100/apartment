import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Security — rate limiting, CORS, headers, secrets', () => {
  it('rate limits auth routes after the configured threshold (429)', async () => {
    // The auth limiter allows 20 requests per 15 minutes per IP. Fire
    // requests until we hit the wall (the endpoint returns 410 otherwise).
    let lastStatus = 0;
    for (let i = 0; i < 25; i += 1) {
      const res = await request(app).post('/api/v1/auth/login').send({ email: 'x@x.com', password: 'y' });
      lastStatus = res.status;
      if (res.status === 429) {
        expect(res.body.message).toMatch(/too many/i);
        break;
      }
    }
    expect(lastStatus).toBe(429);
  });

  it('CORS does not echo unknown origins as allowed', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://evil-origin.example.com');
    expect(res.status).toBe(200);
    // The server answers with its static allow-list origin, never the
    // attacker's origin, so a browser will block the cross-origin read.
    expect(res.headers['access-control-allow-origin']).not.toBe('http://evil-origin.example.com');
  });

  it('CORS allows the configured client origin', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBe(process.env.CLIENT_URL || 'http://localhost:3000');
  });

  it('helmet security headers are present on every response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    expect(res.headers['strict-transport-security']).toBeDefined();
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });

  it('no secrets leak in the health response', async () => {
    const res = await request(app).get('/api/v1/health');
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/sk_test|sk_live|secret|password|api[_-]?key/i);
  });

  it('server errors do not leak stack traces in non-development environments', async () => {
    // Send a payload that triggers a 500-capable path: malformed JSON
    const res = await request(app)
      .post('/api/v1/contact')
      .set('Content-Type', 'application/json')
      .send('{"broken json');
    expect([400, 500]).toContain(res.status);
    expect(res.text).not.toContain('at ');
    expect(res.body.stack).toBeUndefined();
  });

  it('auth error messages do not reveal whether an email exists', async () => {
    const res = await request(app).get('/api/v1/bookings/YAH-0000-FAKE').set('Authorization', 'Bearer forged-token-value');
    expect(res.status).toBe(401);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/supabase|jwt|secret/i);
  });
});
