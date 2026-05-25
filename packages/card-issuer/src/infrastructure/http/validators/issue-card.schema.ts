import { z } from 'zod';

export const IssueCardSchema = z
  .object({
    customer: z.object({
      documentType: z.literal('DNI'),
      documentNumber: z.string().regex(/^\d{8}$/, 'documentNumber must be 8 digits'),
      fullName: z.string().min(2).max(100),
      age: z.number().int().min(18).max(120),
      email: z.email(),
    }),
    product: z.object({
      type: z.literal('VISA'),
      currency: z.enum(['PEN', 'USD']),
    }),
    forceError: z.boolean().default(false),
  })
  .strict();

export type IssueCardRequestBody = z.infer<typeof IssueCardSchema>;
