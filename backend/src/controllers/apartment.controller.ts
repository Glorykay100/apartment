import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { Prisma, BookingStatus } from '@prisma/client';

export const getApartments = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      city,
      minPrice,
      maxPrice,
      bedrooms,
      guests,
      amenities,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const where: Prisma.ApartmentWhereInput = {
      isPublished: true,
    };

    if (city && typeof city === 'string' && city !== 'all') {
      where.city = { equals: city, mode: 'insensitive' };
    }

    if (bedrooms) {
      where.bedrooms = { gte: Number(bedrooms) };
    }

    if (guests) {
      where.maxGuests = { gte: Number(guests) };
    }

    if (minPrice || maxPrice) {
      where.basePricePerNight = {};
      if (minPrice) where.basePricePerNight.gte = Number(minPrice);
      if (maxPrice) where.basePricePerNight.lte = Number(maxPrice);
    }

    if (amenities && typeof amenities === 'string') {
      const amenityList = amenities.split(',').map((a) => a.trim());
      where.amenities = {
        some: {
          name: { in: amenityList },
        },
      };
    }

    // Determine sort ordering
    let orderBy: Prisma.ApartmentOrderByWithRelationInput = { createdAt: 'desc' };
    if (sort === 'price_asc') {
      orderBy = { basePricePerNight: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { basePricePerNight: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [total, apartments] = await Promise.all([
      prisma.apartment.count({ where }),
      prisma.apartment.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          amenities: true,
          reviews: {
            select: { rating: true },
          },
        },
      }),
    ]);

    // Enhance apartments with rating calculations
    const formatted = apartments.map((apt) => {
      const reviewCount = apt.reviews.length;
      const avgRating =
        reviewCount > 0
          ? Number(
              (
                apt.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
              ).toFixed(1)
            )
          : null;

      const { reviews, ...rest } = apt;
      return {
        ...rest,
        reviewCount,
        rating: avgRating,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        apartments: formatted,
        pagination: {
          total,
          page: pageNum,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching apartments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch apartments' });
  }
};

export const getFeaturedApartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const featured = await prisma.apartment.findMany({
      where: {
        isFeatured: true,
        isPublished: true,
      },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        amenities: true,
        reviews: {
          select: { rating: true },
        },
      },
    });

    const formatted = featured.map((apt) => {
      const reviewCount = apt.reviews.length;
      const avgRating =
        reviewCount > 0
          ? Number(
              (
                apt.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
              ).toFixed(1)
            )
          : null;

      const { reviews, ...rest } = apt;
      return {
        ...rest,
        reviewCount,
        rating: avgRating,
      };
    });

    res.status(200).json({
      success: true,
      data: { apartments: formatted },
    });
  } catch (error) {
    console.error('Error fetching featured apartments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch featured apartments' });
  }
};

export const getApartmentBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const apartment = await prisma.apartment.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublished: true,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        amenities: true,
        reviews: {
          include: {
            user: {
              select: { fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!apartment) {
      res.status(404).json({ success: false, message: 'Apartment not found' });
      return;
    }

    const reviewCount = apartment.reviews.length;
    const avgRating =
      reviewCount > 0
        ? Number(
            (
              apartment.reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviewCount
            ).toFixed(1)
          )
        : null;

    // Fetch similar apartments in the same city or category
    const similar = await prisma.apartment.findMany({
      where: {
        id: { not: apartment.id },
        city: apartment.city,
        isPublished: true,
      },
      take: 3,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        apartment: {
          ...apartment,
          reviewCount,
          rating: avgRating,
        },
        similar,
      },
    });
  } catch (error) {
    console.error('Error fetching apartment detail:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch apartment details' });
  }
};

export const getApartmentAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { month, startDate, endDate } = req.query;

    const apartment = await prisma.apartment.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!apartment) {
      res.status(404).json({ success: false, message: 'Apartment not found' });
      return;
    }

    let rangeStart: Date;
    let rangeEnd: Date;

    if (month && typeof month === 'string') {
      const [year, m] = month.split('-').map(Number);
      rangeStart = new Date(Date.UTC(year, m - 1, 1));
      rangeEnd = new Date(Date.UTC(year, m, 0, 23, 59, 59));
    } else if (startDate && endDate) {
      rangeStart = new Date(startDate as string);
      rangeEnd = new Date(endDate as string);
    } else {
      // Default: current date to 6 months forward
      rangeStart = new Date();
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd = new Date();
      rangeEnd.setMonth(rangeEnd.getMonth() + 6);
    }

    // 1. Fetch active bookings (CONFIRMED or active PENDING)
    const activeBookings = await prisma.booking.findMany({
      where: {
        apartmentId: apartment.id,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
        checkIn: { lte: rangeEnd },
        checkOut: { gte: rangeStart },
      },
      select: { checkIn: true, checkOut: true, status: true },
    });

    // 2. Fetch admin blocked dates
    const blockedRecords = await prisma.blockedDate.findMany({
      where: {
        apartmentId: apartment.id,
        date: { gte: rangeStart, lte: rangeEnd },
      },
      select: { date: true, reason: true },
    });

    // Expand ranges into an array of ISO date strings (YYYY-MM-DD)
    const bookedDates = new Set<string>();

    for (const booking of activeBookings) {
      const curr = new Date(booking.checkIn);
      const end = new Date(booking.checkOut);
      // Nightly booking: guest sleeps until checkout day morning
      while (curr < end) {
        bookedDates.add(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }
    }

    const blockedDates = new Set<string>();
    for (const b of blockedRecords) {
      blockedDates.add(new Date(b.date).toISOString().split('T')[0]);
    }

    res.status(200).json({
      success: true,
      data: {
        apartmentId: apartment.id,
        bookedDates: Array.from(bookedDates).sort(),
        blockedDates: Array.from(blockedDates).sort(),
        allUnavailableDates: Array.from(new Set([...bookedDates, ...blockedDates])).sort(),
      },
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
};

export const getAllAmenities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.status(200).json({
      success: true,
      data: { amenities },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch amenities' });
  }
};
