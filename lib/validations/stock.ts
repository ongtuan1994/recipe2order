import { z } from "zod";

export const purchaseBatchSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  variantId: z.string().optional().or(z.literal("")),
  totalCost: z.coerce.number().positive().optional().or(z.nan()),
  preparedAt: z.string().optional(), // ISO date string
  notes: z.string().max(200).optional().or(z.literal("")),
});

export const discardBatchSchema = z.object({
  reason: z.string().min(1).max(200),
});

export type PurchaseBatchInput = z.infer<typeof purchaseBatchSchema>;
export type DiscardBatchInput = z.infer<typeof discardBatchSchema>;
