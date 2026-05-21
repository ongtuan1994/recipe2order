"use server";

import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { IngredientType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { convert, getBaseUnit } from "@/lib/units/conversion";
import {
  ingredientSchema,
  variantSchema,
  type IngredientInput,
  type VariantInput,
} from "@/lib/validations/ingredient";

function pickerTag(userId: string) {
  return `ingredients-picker:${userId}`;
}

export async function listIngredientsForPicker() {
  const userId = await getCurrentUserId();
  const tag = pickerTag(userId);
  return unstable_cache(
    () =>
      prisma.ingredient.findMany({
        where: { userId, isDeleted: false },
        select: { id: true, name: true, baseUnit: true, type: true },
        orderBy: [{ type: "asc" }, { name: "asc" }],
      }),
    [tag],
    { tags: [tag], revalidate: 300 },
  )();
}

export async function listIngredients() {
  const userId = await getCurrentUserId();
  return prisma.ingredient.findMany({
    where: { userId, isDeleted: false },
    select: {
      id: true,
      name: true,
      nameEn: true,
      type: true,
      baseUnit: true,
      defaultVariant: { select: { pricePerBaseUnit: true } },
      _count: { select: { batches: true } },
    },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

/** Returns prev/next ingredient ids in the same order the list page uses. */
export async function getIngredientNeighbors(currentId: string) {
  const userId = await getCurrentUserId();
  const rows = await prisma.ingredient.findMany({
    where: { userId, isDeleted: false },
    select: { id: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  const idx = rows.findIndex((r) => r.id === currentId);
  return {
    prevId: idx > 0 ? rows[idx - 1].id : null,
    nextId: idx >= 0 && idx < rows.length - 1 ? rows[idx + 1].id : null,
    position: idx >= 0 ? idx + 1 : 0,
    total: rows.length,
  };
}

export async function getIngredient(id: string) {
  const userId = await getCurrentUserId();
  return prisma.ingredient.findFirst({
    where: { id, userId, isDeleted: false },
    include: {
      variants: { orderBy: { pricePerBaseUnit: "asc" } },
      defaultVariant: true,
    },
  });
}

function nullableNumber(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export type IngredientMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createIngredient(input: IngredientInput): Promise<IngredientMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = ingredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const ingredient = await prisma.ingredient.create({
    data: {
      name: data.name,
      nameEn: data.nameEn || null,
      type: data.type as IngredientType,
      baseUnit: data.baseUnit,
      shelfLifeDays: nullableNumber(data.shelfLifeDays),
      minStockAlert: nullableNumber(data.minStockAlert),
      userId,
    },
    select: { id: true },
  });

  updateTag(pickerTag(userId));
  revalidatePath("/ingredients");
  return { ok: true, id: ingredient.id };
}

export async function updateIngredient(
  id: string,
  input: IngredientInput,
): Promise<IngredientMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = ingredientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const existing = await prisma.ingredient.findFirst({
    where: { id, userId, isDeleted: false },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "Not found" };

  await prisma.ingredient.update({
    where: { id },
    data: {
      name: data.name,
      nameEn: data.nameEn || null,
      type: data.type as IngredientType,
      baseUnit: data.baseUnit,
      shelfLifeDays: nullableNumber(data.shelfLifeDays),
      minStockAlert: nullableNumber(data.minStockAlert),
    },
  });

  updateTag(pickerTag(userId));
  revalidatePath("/ingredients");
  revalidatePath(`/ingredients/${id}`);
  return { ok: true, id };
}

export async function deleteIngredient(id: string) {
  const userId = await getCurrentUserId();
  await prisma.ingredient.updateMany({
    where: { id, userId, isDeleted: false },
    data: { isDeleted: true },
  });
  updateTag(pickerTag(userId));
  revalidatePath("/ingredients");
}

function computePricePerBaseUnit(
  packageSize: number,
  packageUnit: string,
  price: number,
  baseUnit: string,
): number {
  // If units are in compatible groups, convert package size to base units
  if (getBaseUnit(packageUnit) && getBaseUnit(baseUnit)) {
    const baseQty = convert(packageSize, packageUnit, baseUnit);
    return price / baseQty;
  }
  // Otherwise fall back to package size as-is
  return price / packageSize;
}

export async function addVariant(
  ingredientId: string,
  input: VariantInput,
): Promise<IngredientMutationResult> {
  const userId = await getCurrentUserId();
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, userId, isDeleted: false },
    select: { id: true, baseUnit: true, defaultVariantId: true },
  });
  if (!ingredient) return { ok: false, error: "Ingredient not found" };

  const pricePerBaseUnit = computePricePerBaseUnit(
    data.packageSize,
    data.packageUnit,
    data.price,
    ingredient.baseUnit,
  );

  const variant = await prisma.ingredientVariant.create({
    data: {
      ingredientId,
      brand: data.brand,
      packageSize: data.packageSize,
      packageUnit: data.packageUnit,
      price: data.price,
      pricePerBaseUnit,
      supplier: data.supplier || null,
      note: data.note || null,
    },
    select: { id: true },
  });

  // Auto-set as default if no default exists
  if (!ingredient.defaultVariantId) {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { defaultVariantId: variant.id },
    });
  }

  revalidatePath(`/ingredients/${ingredientId}`);
  return { ok: true, id: variant.id };
}

export async function setDefaultVariant(ingredientId: string, variantId: string) {
  const userId = await getCurrentUserId();
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, userId, isDeleted: false },
    select: { id: true },
  });
  if (!ingredient) throw new Error("Not found");
  await prisma.ingredient.update({
    where: { id: ingredientId },
    data: { defaultVariantId: variantId },
  });
  revalidatePath(`/ingredients/${ingredientId}`);
}

export async function deleteVariant(variantId: string, ingredientId: string) {
  const userId = await getCurrentUserId();
  // Check ownership through ingredient
  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, userId, isDeleted: false },
    select: { id: true, defaultVariantId: true },
  });
  if (!ingredient) throw new Error("Not found");

  if (ingredient.defaultVariantId === variantId) {
    await prisma.ingredient.update({
      where: { id: ingredientId },
      data: { defaultVariantId: null },
    });
  }
  await prisma.ingredientVariant.delete({ where: { id: variantId } });
  revalidatePath(`/ingredients/${ingredientId}`);
}
