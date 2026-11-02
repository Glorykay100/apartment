import { Router } from 'express';
import {
  getApartments,
  getFeaturedApartments,
  getApartmentBySlug,
  getApartmentAvailability,
  getAllAmenities,
} from '../controllers/apartment.controller';

const apartmentRouter = Router();

apartmentRouter.get('/', getApartments);
apartmentRouter.get('/featured', getFeaturedApartments);
apartmentRouter.get('/amenities', getAllAmenities);
apartmentRouter.get('/:slug', getApartmentBySlug);
apartmentRouter.get('/:id/availability', getApartmentAvailability);

export default apartmentRouter;
