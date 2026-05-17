import { z } from "zod";

export const planItemSchema = z.object({
  recipeSizeId: z.string().min(1),
  targetQty: z.coerce.number().int().positive(),
});

export const purchasePlanSchema = z.object({
  name: z.string().min(1).max(120),
  targetDate: z.string().optional(),
  items: z.array(planItemSchema).min(1, "At least one target is required"),
});

export type PurchasePlanInput = z.infer<typeof purchasePlanSchema>;
export type PlanItemInput = z.infer<typeof planItemSchema>;
