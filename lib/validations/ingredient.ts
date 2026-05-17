import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(1).max(120),
  nameEn: z.string().max(120).optional().or(z.literal("")),
  type: z.enum(["RAW", "PREP"]).default("RAW"),
  baseUnit: z.string().min(1).max(20),
  shelfLifeDays: z.coerce.number().int().positive().optional().or(z.nan()),
  minStockAlert: z.coerce.number().positive().optional().or(z.nan()),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;

export const variantSchema = z.object({
  brand: z.string().min(1).max(60),
  packageSize: z.coerce.number().positive(),
  packageUnit: z.string().min(1).max(20),
  price: z.coerce.number().positive(),
  supplier: z.string().max(120).optional().or(z.literal("")),
  note: z.string().max(200).optional().or(z.literal("")),
});

export type VariantInput = z.infer<typeof variantSchema>;
