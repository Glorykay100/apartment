export type Role = 'GUEST' | 'ADMIN';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role: Role;
  createdAt: string;
}

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface ApartmentImage {
  id: string;
  apartmentId: string;
  url: string;
  caption?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface Review {
  id: string;
  apartmentId: string;
  bookingId: string;
  userId: string;
  rating: number;
  cleanliness: number;
  accuracy: number;
  location: number;
  value: number;
  comment: string;
  createdAt: string;
  user?: {
    fullName: string;
  };
}

export interface Apartment {
  id: string;
  slug: string;
  title: string;
  headline: string;
  description: string;
  address: string;
  city: string;
  state: string;
  basePricePerNight: number;
  cleaningFee: number;
  serviceFeeRate: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  sqft?: number | null;
  isFeatured: boolean;
  isPublished: boolean;
  checkInTime: string;
  checkOutTime: string;
  houseRules: string[];
  images: ApartmentImage[];
  amenities: Amenity[];
  rating?: number | null;
  reviewCount?: number;
  reviews?: Review[];
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  reference: string;
  apartmentId: string;
  apartment?: Apartment;
  userId: string;
  user?: User;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestCount: number;
  nightlyRate: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paystackReference?: string | null;
  paystackPaidAt?: string | null;
  specialRequests?: string | null;
  review?: Review | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
}
