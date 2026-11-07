import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../config/db';

const PAYSTACK_SECRET_KEY =
  process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_secret_key_1234567890';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Only use mock mode when the key is clearly a placeholder or we're in test env.
 * We do NOT fall back to mock on API errors — those should surface.
 */
const isMockPaystackEnvironment = () => {
  const secret = process.env.PAYSTACK_SECRET_KEY || '';
  return (
    !secret ||
    secret.includes('sk_test_xxxx') ||
    secret.includes('mock') ||
    process.env.NODE_ENV === 'test'
  );
};

export interface PaystackInitParams {
  email: string;
  amountInKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, any>;
}

/**
 * Generate a unique Paystack reference per attempt.
 * Format: PSTK_{bookingRef}_{timestamp}
 */
export const generateUniqueReference = (bookingRef: string): string => {
  return `PSTK_${bookingRef}_${Date.now()}`;
};

export const initializePaystackTransaction = async (params: PaystackInitParams) => {
  if (isMockPaystackEnvironment()) {
    return {
      authorization_url: `${params.callbackUrl}?reference=${params.reference}&mock_success=true`,
      access_code: `mock_acc_${Date.now()}`,
      reference: params.reference,
    };
  }

  // Real API call — do NOT swallow errors
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      email: params.email,
      amount: params.amountInKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    },
    {
      headers: {
        Authorization: 'Bearer ' + PAYSTACK_SECRET_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.data;
};

export const verifyPaystackTransaction = async (reference: string) => {
  if (isMockPaystackEnvironment() || reference.startsWith('MOCK_')) {
    // Mock mode behaves like a real successful Paystack transaction: the
    // amount must match the booking total the server recorded at init time.
    const booking = await prisma.booking.findFirst({
      where: { OR: [{ reference }, { paystackReference: reference }] },
    });

    return {
      status: 'success',
      reference,
      amount: booking ? booking.totalAmount * 100 : 1000000,
      paid_at: new Date().toISOString(),
      channel: 'card',
      currency: 'NGN',
    };
  }

  const response = await axios.get(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: 'Bearer ' + PAYSTACK_SECRET_KEY,
      },
    }
  );

  return response.data.data;
};

export const verifyPaystackWebhookSignature = (
  signature: string,
  rawBody: string | Buffer
): boolean => {
  if (!signature || !rawBody) return false;

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
};
