import { z } from "zod";

export const saleItemSchema = z.object({
  recipeSizeId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
});

export const saleSchema = z.object({
  items: z.array(saleItemSchema).min(1, "At least one item is required"),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type SaleInput = z.infer<typeof saleSchema>;
export type SaleItemInput = z.infer<typeof saleItemSchema>;
