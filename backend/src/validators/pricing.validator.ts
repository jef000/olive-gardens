import { z } from 'zod';

/**
 * Bulk price update payload sent by the admin pricing page.
 * Prices are short display labels, never numeric values.
 */
export const updateServicePricesSchema = z.object({
  prices: z
    .array(
      z.object({
        service_id: z
          .string()
          .trim()
          .min(1, 'Service id is required')
          .max(100)
          .regex(/^[a-z0-9-]+$/, 'Service id may only contain lowercase letters, numbers and dashes'),
        price: z.string().trim().max(120, 'Price label is too long'),
      })
    )
    .min(1, 'At least one price is required')
    .max(50, 'Too many prices in one request'),
});

export type UpdateServicePricesInput = z.infer<typeof updateServicePricesSchema>;
