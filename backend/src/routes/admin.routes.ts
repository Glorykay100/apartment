import { Router } from 'express';
import {
  getAdminStats,
  getAllBookings,
  blockDate,
  unblockDate,
  getBlockedDates,
  getContactMessages,
  markMessageRead,
  createApartment,
  updateApartment,
  deleteApartment,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const adminRouter = Router();

// All admin routes require authentication + admin role
adminRouter.use(authenticate, requireAdmin);

// Dashboard stats
adminRouter.get('/stats', getAdminStats);

// Booking management
adminRouter.get('/bookings', getAllBookings);

// Manual date blocking
adminRouter.post('/block-date', blockDate);
adminRouter.delete('/block-date/:id', unblockDate);
adminRouter.get('/blocked-dates/:apartmentId', getBlockedDates);

// Contact messages
adminRouter.get('/contact-messages', getContactMessages);
adminRouter.patch('/contact-messages/:id/read', markMessageRead);

// Apartment CRUD
adminRouter.post('/apartments', createApartment);
adminRouter.put('/apartments/:id', updateApartment);
adminRouter.delete('/apartments/:id', deleteApartment);

export default adminRouter;
