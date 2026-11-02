import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Apartments API (/api/v1/apartments)', () => {
  it('should retrieve published apartments with pagination', async () => {
    const res = await request(app).get('/api/v1/apartments');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.apartments)).toBe(true);
    expect(res.body.data.apartments.length).toBeGreaterThan(0);
    expect(res.body.data.pagination).toHaveProperty('total');
  });

  it('should filter apartments by city', async () => {
    const res = await request(app).get('/api/v1/apartments?city=Makurdi');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const apartments = res.body.data.apartments;
    expect(apartments.length).toBeGreaterThan(0);
    for (const apt of apartments) {
      expect(apt.city.toLowerCase()).toBe('makurdi');
    }
  });

  it('should filter apartments by minimum price', async () => {
    const res = await request(app).get('/api/v1/apartments?minPrice=80000');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const apartments = res.body.data.apartments;
    for (const apt of apartments) {
      expect(apt.basePricePerNight).toBeGreaterThanOrEqual(80000);
    }
  });

  it('should retrieve featured apartments', async () => {
    const res = await request(app).get('/api/v1/apartments/featured');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.apartments.length).toBeGreaterThan(0);
    for (const apt of res.body.data.apartments) {
      expect(apt.isFeatured).toBe(true);
    }
  });

  it('should fetch an apartment by slug with relations', async () => {
    const res = await request(app).get(
      '/api/v1/apartments/the-benue-terrace-penthouse'
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.apartment.title).toBe('The Benue Terrace Penthouse');
    expect(Array.isArray(res.body.data.apartment.images)).toBe(true);
    expect(Array.isArray(res.body.data.apartment.amenities)).toBe(true);
    expect(res.body.data).toHaveProperty('similar');
  });

  it('should fetch availability calendar for an apartment', async () => {
    const res = await request(app).get(
      '/api/v1/apartments/the-benue-terrace-penthouse/availability'
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('bookedDates');
    expect(res.body.data).toHaveProperty('allUnavailableDates');
  });

  it('should return 404 for non-existent apartment slug', async () => {
    const res = await request(app).get('/api/v1/apartments/non-existent-apartment-slug');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
