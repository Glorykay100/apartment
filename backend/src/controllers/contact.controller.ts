import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  subject: z.string().min(2, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const submitContact = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = contactSchema.parse(req.body);

    const message = await prisma.contactMessage.create({
      data: {
        name: validated.name,
        email: validated.email,
        phone: validated.phone || null,
        subject: validated.subject,
        message: validated.message,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry received successfully. Our team will contact you shortly.',
      data: { messageId: message.id },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues,
      });
      return;
    }
    console.error('Contact submit error:', error);
    res.status(500).json({ success: false, message: 'Failed to process inquiry' });
  }
};
