import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Health Check API (/api/v1/health)', () => {
  it('should return 200 OK with Yahsab metadata', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.brand).toBe('Yahsab Luxury Apartments & Suites');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
