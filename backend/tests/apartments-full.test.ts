import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/db';
import { ensureConsent, getGuestId, getAdminId, getApartmentId } from './helpers';

const auth = vi.hoisted(() => ({ guestId: '', adminId: '' }));

vi.mock('../src/config/supabaseAuth', () => ({
  verifySupabaseToken: vi.fn(async (token: string) => {
    if (token === 'test-guest-token')
      return { id: auth.guestId, email: 'guest@yahsab.com', role: 'GUEST' as const, fullName: 'Terna Agbo' };
    if (token === 'test-admin-token')
      return { id: auth.adminId, email: 'admin@yahsab.com', role: 'ADMIN' as const, fullName: 'Glory Itodo' };
    return null;
  }),
}));

describe('Apartments API — comprehensive tests', () => {
  let apartmentId: string;

  beforeAll(async () => {
    auth.guestId = await getGuestId();
    auth.adminId = await getAdminId();
    await ensureConsent(auth.guestId);
    await ensureConsent(auth.adminId);
    const apt = await prisma.apartment.findFirst({ where: { isPublished: true } });
    if (!apt) throw new Error('No apartment found');
    apartmentId = apt.id;
  });

  describe('GET /api/v1/apartments', () => {
    it('lists published apartments with pagination metadata', async () => {
      const res = await request(app).get('/api/v1/apartments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.apartments)).toBe(true);
      expect(res.body.data.apartments.length).toBeGreaterThan(0);
      expect(res.body.data.pagination).toHaveProperty('total');
      expect(res.body.data.pagination).toHaveProperty('totalPages');
    });

    it('only returns published apartments', async () => {
      const res = await request(app).get('/api/v1/apartments');
      for (const apt of res.body.data.apartments) {
        expect(apt.isPublished).toBe(true);
      }
    });

    it('filters by city=Makurdi', async () => {
      const res = await request(app).get('/api/v1/apartments?city=Makurdi');
      expect(res.status).toBe(200);
      expect(res.body.data.apartments.length).toBeGreaterThan(0);
      for (const apt of res.body.data.apartments) {
        expect(apt.city.toLowerCase()).toBe('makurdi');
      }
    });

    it('filters by city=Abuja', async () => {
      const res = await request(app).get('/api/v1/apartments?city=Abuja');
      expect(res.status).toBe(200);
      for (const apt of res.body.data.apartments) {
        expect(apt.city).toBe('Abuja');
      }
    });

    it('filters by minPrice', async () => {
      const res = await request(app).get('/api/v1/apartments?minPrice=80000');
      expect(res.status).toBe(200);
      for (const apt of res.body.data.apartments) {
        expect(apt.basePricePerNight).toBeGreaterThanOrEqual(80000);
      }
    });

    it('filters by maxPrice', async () => {
      const res = await request(app).get('/api/v1/apartments?maxPrice=50000');
      expect(res.status).toBe(200);
      for (const apt of res.body.data.apartments) {
        expect(apt.basePricePerNight).toBeLessThanOrEqual(50000);
      }
    });

    it('filters by minPrice and maxPrice together', async () => {
      const res = await request(app).get('/api/v1/apartments?minPrice=40000&maxPrice=60000');
      expect(res.status).toBe(200);
      for (const apt of res.body.data.apartments) {
        expect(apt.basePricePerNight).toBeGreaterThanOrEqual(40000);
        expect(apt.basePricePerNight).toBeLessThanOrEqual(60000);
      }
    });

    it('filters by bedrooms', async () => {
      const res = await request(app).get('/api/v1/apartments?bedrooms=2');
      expect(res.status).toBe(200);
      for (const apt of res.body.data.apartments) {
        expect(apt.bedrooms).toBeGreaterThanOrEqual(2);
      }
    });

    it('filters by guests', async () => {
      const res = await request(app).get('/api/v1/apartments?guests=4');
      expect(res.status).toBe(200);
      for (const apt of res.body.data.apartments) {
        expect(apt.maxGuests).toBeGreaterThanOrEqual(4);
      }
    });

    it('sorts by price ascending', async () => {
      const res = await request(app).get('/api/v1/apartments?sort=price_asc');
      expect(res.status).toBe(200);
      const prices = res.body.data.apartments.map((a: any) => a.basePricePerNight);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    it('sorts by price descending', async () => {
      const res = await request(app).get('/api/v1/apartments?sort=price_desc');
      expect(res.status).toBe(200);
      const prices = res.body.data.apartments.map((a: any) => a.basePricePerNight);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeLessThanOrEqual(prices[i - 1]);
      }
    });

    it('paginates with page and limit', async () => {
      const res = await request(app).get('/api/v1/apartments?page=1&limit=3');
      expect(res.status).toBe(200);
      expect(res.body.data.apartments.length).toBeLessThanOrEqual(3);
      expect(res.body.data.pagination.limit).toBe(3);
    });
  });

  describe('GET /api/v1/apartments/featured', () => {
    it('returns only featured apartments', async () => {
      const res = await request(app).get('/api/v1/apartments/featured');
      expect(res.status).toBe(200);
      expect(res.body.data.apartments.length).toBeGreaterThan(0);
      for (const apt of res.body.data.apartments) {
        expect(apt.isFeatured).toBe(true);
      }
    });
  });

  describe('GET /api/v1/apartments/amenities', () => {
    it('returns all amenities ordered by category', async () => {
      const res = await request(app).get('/api/v1/apartments/amenities');
      expect(res.status).toBe(200);
      expect(res.body.data.amenities.length).toBeGreaterThan(0);
      expect(res.body.data.amenities[0]).toHaveProperty('name');
      expect(res.body.data.amenities[0]).toHaveProperty('category');
    });
  });

  describe('GET /api/v1/apartments/:slug', () => {
    it('fetches apartment by slug with images, amenities, reviews', async () => {
      const res = await request(app).get('/api/v1/apartments/the-benue-terrace-penthouse');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.apartment.title).toBe('The Benue Terrace Penthouse');
      expect(Array.isArray(res.body.data.apartment.images)).toBe(true);
      expect(Array.isArray(res.body.data.apartment.amenities)).toBe(true);
      expect(res.body.data).toHaveProperty('similar');
    });

    it('returns 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/v1/apartments/non-existent-slug-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/apartments/:id/availability', () => {
    it('returns bookedDates, blockedDates, allUnavailableDates', async () => {
      const res = await request(app).get(`/api/v1/apartments/${apartmentId}/availability`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('bookedDates');
      expect(res.body.data).toHaveProperty('blockedDates');
      expect(res.body.data).toHaveProperty('allUnavailableDates');
    });

    it('returns 404 for non-existent apartment', async () => {
      const res = await request(app).get('/api/v1/apartments/non-existent-id/availability');
      expect(res.status).toBe(404);
    });
  });

  describe('Admin CRUD — requires ADMIN role', () => {
    let createdApartmentId: string;

    it('rejects unauthenticated POST /admin/apartments (401)', async () => {
      const res = await request(app).post('/api/v1/admin/apartments').send({
        title: 'Test Apartment', headline: 'Test', description: 'Test description',
        address: '123 Test St', city: 'Makurdi', state: 'Benue',
        basePricePerNight: 30000, bedrooms: 1, bathrooms: 1, maxGuests: 2,
      });
      expect(res.status).toBe(401);
    });

    it('rejects guest POST /admin/apartments (403)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/apartments')
        .set('Authorization', 'Bearer test-guest-token')
        .send({
          title: 'Test Apartment', headline: 'Test', description: 'Test description',
          address: '123 Test St', city: 'Makurdi', state: 'Benue',
          basePricePerNight: 30000, bedrooms: 1, bathrooms: 1, maxGuests: 2,
        });
      expect(res.status).toBe(403);
    });

    it('allows admin to create an apartment (201)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/apartments')
        .set('Authorization', 'Bearer test-admin-token')
        .send({
          title: 'QA Test Apartment', headline: 'A test apartment for QA',
          description: 'Created by automated test suite for validation.',
          address: '456 QA Road', city: 'Makurdi', state: 'Benue',
          basePricePerNight: 30000, cleaningFee: 4000,
          bedrooms: 1, bathrooms: 1, maxGuests: 2, sqft: 500, houseRules: ['No smoking'],
          images: [{ url: 'https://example.com/test.jpg', caption: 'Test image', isPrimary: true, order: 0 }],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.apartment.title).toBe('QA Test Apartment');
      expect(res.body.data.apartment.slug).toContain('qa-test-apartment');
      expect(res.body.data.apartment.images.length).toBe(1);
      createdApartmentId = res.body.data.apartment.id;
    });

    it('allows admin to update an apartment (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/apartments/${createdApartmentId}`)
        .set('Authorization', 'Bearer test-admin-token')
        .send({ title: 'Updated QA Test Apartment', basePricePerNight: 35000 });
      expect(res.status).toBe(200);
      expect(res.body.data.apartment.title).toBe('Updated QA Test Apartment');
      expect(res.body.data.apartment.basePricePerNight).toBe(35000);
    });

    it('allows admin to delete an apartment (200)', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/apartments/${createdApartmentId}`)
        .set('Authorization', 'Bearer test-admin-token');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const check = await prisma.apartment.findUnique({ where: { id: createdApartmentId } });
      expect(check).toBeNull();
    });
  });
});
