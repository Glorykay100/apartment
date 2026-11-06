import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { BUSINESS_CONFIG, getDocumentVersion } from '../config/business';
import { z } from 'zod';

const acceptSchema = z.object({
  documentType: z.enum(['terms', 'privacy', 'refund', 'cookie']),
  marketingOptIn: z.boolean().optional().default(false),
});

/**
 * Record acceptance of a legal document.
 * Called from signup, checkout, or the re-acceptance modal.
 */
export const recordConsent = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const validated = acceptSchema.parse(req.body);
    const version = getDocumentVersion(validated.documentType);

    const consent = await prisma.consentRecord.create({
      data: {
        userId: req.user.id,
        documentType: validated.documentType,
        version,
        ipAddress: req.ip || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // If accepting terms, update the user's termsAcceptedAt + version
    if (validated.documentType === 'terms') {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          termsAcceptedAt: new Date(),
          termsVersion: BUSINESS_CONFIG.termsVersion,
        },
      });
    }

    // If marketing opt-in provided, update email preferences
    if (validated.marketingOptIn !== undefined) {
      await prisma.emailPreferences.upsert({
        where: { userId: req.user.id },
        create: {
          userId: req.user.id,
          marketingOptIn: validated.marketingOptIn,
          optInAt: validated.marketingOptIn ? new Date() : null,
          source: 'consent_endpoint',
        },
        update: {
          marketingOptIn: validated.marketingOptIn,
          optInAt: validated.marketingOptIn ? new Date() : null,
          optOutAt: validated.marketingOptIn ? null : new Date(),
        },
      });
    }

    res.status(201).json({
      success: true,
      message: 'Consent recorded successfully.',
      data: { consent },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      return;
    }
    console.error('Record consent error:', error);
    res.status(500).json({ success: false, message: 'Failed to record consent.' });
  }
};

/**
 * Check if the current user needs to re-accept terms.
 * Returns needsReaccept: true if termsVersion doesn't match the current version.
 */
export const checkTermsStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { termsVersion: true, termsAcceptedAt: true },
    });

    const needsReaccept = !user?.termsAcceptedAt || user.termsVersion !== BUSINESS_CONFIG.termsVersion;

    res.status(200).json({
      success: true,
      data: {
        needsReaccept,
        currentVersion: BUSINESS_CONFIG.termsVersion,
        acceptedVersion: user?.termsVersion || null,
        acceptedAt: user?.termsAcceptedAt || null,
      },
    });
  } catch (error) {
    console.error('Check terms status error:', error);
    res.status(500).json({ success: false, message: 'Failed to check terms status.' });
  }
};
