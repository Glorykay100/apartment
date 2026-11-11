import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { z } from 'zod';

// ─── Dashboard stats ────────────────────────────────────────────

export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalApartments,
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalUsers,
      totalRevenue,
      unpaidBookings,
      expiredHolds,
      contactMessages,
      reviews,
    ] = await Promise.all([
      prisma.apartment.count({ where: { isPublished: true } }),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
      prisma.booking.count({ where: { status: BookingStatus.PENDING, paymentStatus: PaymentStatus.UNPAID } }),
      prisma.user.count({ where: { role: 'GUEST' } }),
      prisma.booking.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { status: BookingStatus.PENDING, paymentStatus: PaymentStatus.UNPAID },
        include: { apartment: { include: { images: { take: 1 } } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING,
          holdExpiresAt: { lt: new Date() },
        },
        include: { apartment: { select: { title: true, city: true } } },
      }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.review.count(),
    ]);

    const avgRatingResult = await prisma.review.aggregate({
      _avg: { rating: true },
    });

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalApartments,
          totalBookings,
          confirmedBookings,
          pendingBookings,
          totalUsers,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
          avgRating: avgRatingResult._avg.rating ? Number(avgRatingResult._avg.rating.toFixed(2)) : null,
          totalReviews: reviews,
          unreadMessages: contactMessages,
        },
        unpaidBookings,
        expiredHolds,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats.' });
  }
};

// ─── Booking management ──────────────────────────────────────────

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

    const where: Prisma.BookingWhereInput = {};
    if (status && typeof status === 'string') {
      where.status = status as BookingStatus;
    }
    if (paymentStatus && typeof paymentStatus === 'string') {
      where.paymentStatus = paymentStatus as PaymentStatus;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { guestFullName: { contains: search, mode: 'insensitive' } },
        { guestEmail: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          apartment: { include: { images: { take: 1 } } },
          user: { select: { fullName: true, email: true } },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings.' });
  }
};

// ─── Manual date blocking ───────────────────────────────────────

const blockDateSchema = z.object({
  apartmentId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  reason: z.string().max(200).optional(),
});

export const blockDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = blockDateSchema.parse(req.body);

    const apartment = await prisma.apartment.findFirst({
      where: { OR: [{ id: validated.apartmentId }, { slug: validated.apartmentId }] },
    });

    if (!apartment) {
      res.status(404).json({ success: false, message: 'Apartment not found.' });
      return;
    }

    const blocked = await prisma.blockedDate.upsert({
      where: {
        apartmentId_date: {
          apartmentId: apartment.id,
          date: new Date(validated.date),
        },
      },
      update: { reason: validated.reason || null },
      create: {
        apartmentId: apartment.id,
        date: new Date(validated.date),
        reason: validated.reason || null,
      },
    });

    res.status(201).json({ success: true, message: 'Date blocked successfully.', data: { blocked } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.issues });
      return;
    }
    console.error('Block date error:', error);
    res.status(500).json({ success: false, message: 'Failed to block date.' });
  }
};

export const unblockDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.blockedDate.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Date unblocked successfully.' });
  } catch (error) {
    console.error('Unblock date error:', error);
    res.status(500).json({ success: false, message: 'Failed to unblock date.' });
  }
};

export const getBlockedDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { apartmentId } = req.params;
    const blocked = await prisma.blockedDate.findMany({
      where: { apartmentId },
      orderBy: { date: 'asc' },
    });
    res.status(200).json({ success: true, data: { blockedDates: blocked } });
  } catch (error) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blocked dates.' });
  }
};

// ─── Contact messages ───────────────────────────────────────────

export const getContactMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    const where: Prisma.ContactMessageWhereInput = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const pageSize = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * pageSize;

    const [total, messages] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact messages.' });
  }
};

export const markMessageRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
    res.status(200).json({ success: true, message: 'Message marked as read.' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark message.' });
  }
};

// ─── Apartment CRUD ─────────────────────────────────────────────

export const createApartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, headline, description, address, city, state, basePricePerNight, cleaningFee, bedrooms, bathrooms, maxGuests, sqft, houseRules, images, amenityIds } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const apartment = await prisma.apartment.create({
      data: {
        slug,
        title,
        headline,
        description,
        address,
        city,
        state,
        basePricePerNight: Number(basePricePerNight),
        cleaningFee: Number(cleaningFee || 5000),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        maxGuests: Number(maxGuests),
        sqft: sqft ? Number(sqft) : null,
        houseRules: houseRules || [],
        images: images
          ? { create: images.map((img: any, i: number) => ({ url: img.url, caption: img.caption, isPrimary: i === 0, order: i })) }
          : undefined,
        amenities: amenityIds ? { connect: amenityIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { images: true, amenities: true },
    });

    res.status(201).json({ success: true, message: 'Apartment created.', data: { apartment } });
  } catch (error) {
    console.error('Create apartment error:', error);
    res.status(500).json({ success: false, message: 'Failed to create apartment.' });
  }
};

export const updateApartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    // Convert numeric fields
    if (updateData.basePricePerNight) updateData.basePricePerNight = Number(updateData.basePricePerNight);
    if (updateData.cleaningFee) updateData.cleaningFee = Number(updateData.cleaningFee);
    if (updateData.bedrooms) updateData.bedrooms = Number(updateData.bedrooms);
    if (updateData.bathrooms) updateData.bathrooms = Number(updateData.bathrooms);
    if (updateData.maxGuests) updateData.maxGuests = Number(updateData.maxGuests);

    const apartment = await prisma.apartment.update({
      where: { id },
      data: updateData,
      include: { images: true, amenities: true },
    });

    res.status(200).json({ success: true, message: 'Apartment updated.', data: { apartment } });
  } catch (error) {
    console.error('Update apartment error:', error);
    res.status(500).json({ success: false, message: 'Failed to update apartment.' });
  }
};

export const deleteApartment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.apartment.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Apartment deleted.' });
  } catch (error) {
    console.error('Delete apartment error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete apartment.' });
  }
};
