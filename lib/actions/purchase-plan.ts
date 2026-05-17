"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-helpers";
import {
  purchasePlanSchema,
  type PurchasePlanInput,
} from "@/lib/validations/purchase-plan";
import { explodeToRaw, type ExplodeResult } from "@/lib/stock/explode";
import { convert, getBaseUnit } from "@/lib/units/conversion";

function toBase(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const fromBase = getBaseUnit(fromUnit);
  const toBase = getBaseUnit(toUnit);
  if (fromBase && toBase && fromBase === toBase) {
    return convert(quantity, fromUnit, toUnit);
  }
  return quantity;
}

export async function listPurchasePlans() {
  const userId = await getCurrentUserId();
  return prisma.purchasePlan.findMany({
    where: { userId },
    include: { items: { include: { recipeSize: { include: { recipe: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPurchasePlan(id: string) {
  const userId = await getCurrentUserId();
  return prisma.purchasePlan.findFirst({
    where: { id, userId },
    include: {
      items: {
        include: {
          recipeSize: {
            include: {
              recipe: { select: { id: true, name: true } },
              ingredients: {
                include: { ingredient: { select: { id: true, baseUnit: true } } },
              },
            },
          },
        },
      },
    },
  });
}

export type PlanResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPurchasePlan(
  input: PurchasePlanInput,
): Promise<PlanResult> {
  const userId = await getCurrentUserId();
  const parsed = purchasePlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const plan = await prisma.purchasePlan.create({
    data: {
      name: data.name,
      targetDate: data.targetDate ? new Date(data.targetDate) : null,
      userId,
      items: {
        create: data.items.map((i) => ({
          recipeSizeId: i.recipeSizeId,
          targetQty: i.targetQty,
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/purchase-plans");
  return { ok: true, id: plan.id };
}

export async function updatePurchasePlan(
  id: string,
  input: PurchasePlanInput,
): Promise<PlanResult> {
  const userId = await getCurrentUserId();
  const parsed = purchasePlanSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const data = parsed.data;

  const existing = await prisma.purchasePlan.findFirst({
    where: { id, userId },
    select: { id: true, status: true },
  });
  if (!existing) return { ok: false, error: "Plan not found" };
  if (existing.status !== "DRAFT") {
    return { ok: false, error: "Only DRAFT plans can be edited" };
  }

  await prisma.$transaction([
    prisma.purchasePlanItem.deleteMany({ where: { planId: id } }),
    prisma.purchasePlan.update({
      where: { id },
      data: {
        name: data.name,
        targetDate: data.targetDate ? new Date(data.targetDate) : null,
        items: {
          create: data.items.map((i) => ({
            recipeSizeId: i.recipeSizeId,
            targetQty: i.targetQty,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/purchase-plans");
  revalidatePath(`/purchase-plans/${id}`);
  return { ok: true, id };
}

export async function deletePurchasePlan(id: string) {
  const userId = await getCurrentUserId();
  await prisma.purchasePlan.deleteMany({ where: { id, userId } });
  revalidatePath("/purchase-plans");
}

export type ImportItemInput = {
  ingredientId: string;
  quantity: number; // in baseUnit
  totalCost: number;
};

export type ImportResult =
  | { ok: true; batchesCreated: number; totalCost: number }
  | { ok: false; error: string };

/**
 * Import a purchase plan: create stock batches for each purchased ingredient,
 * record stock movements, and mark the plan as PURCHASED.
 */
export async function importPurchasePlan(
  planId: string,
  items: ImportItemInput[],
): Promise<ImportResult> {
  const userId = await getCurrentUserId();

  const plan = await prisma.purchasePlan.findFirst({
    where: { id: planId, userId },
    select: { id: true, status: true },
  });
  if (!plan) return { ok: false, error: "Plan not found" };
  if (plan.status !== "DRAFT") {
    return { ok: false, error: "Plan has already been imported" };
  }

  const validItems = items.filter((i) => i.quantity > 0);
  if (validItems.length === 0) {
    return { ok: false, error: "No items to import" };
  }

  const ingredientIds = validItems.map((i) => i.ingredientId);
  const ingredients = await prisma.ingredient.findMany({
    where: { id: { in: ingredientIds }, userId },
    select: { id: true, shelfLifeDays: true, baseUnit: true },
  });
  const ingMap = new Map(ingredients.map((i) => [i.id, i]));

  const totalCost = validItems.reduce((sum, i) => sum + (i.totalCost || 0), 0);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const item of validItems) {
      const ing = ingMap.get(item.ingredientId);
      if (!ing) continue;

      const expiresAt = ing.shelfLifeDays
        ? new Date(now.getTime() + ing.shelfLifeDays * 86400_000)
        : null;

      const batch = await tx.stockBatch.create({
        data: {
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          initialQuantity: item.quantity,
          source: "PURCHASED",
          preparedAt: now,
          expiresAt,
          totalCost: item.totalCost || null,
          notes: `Imported from plan ${planId}`,
        },
      });

      await tx.stockMovement.create({
        data: {
          ingredientId: item.ingredientId,
          batchId: batch.id,
          type: "IN",
          quantity: item.quantity,
          unit: ing.baseUnit,
          reason: `Purchase plan import (${planId})`,
          userId,
        },
      });
    }

    await tx.purchasePlan.update({
      where: { id: planId },
      data: { status: "PURCHASED", totalCost },
    });
  });

  revalidatePath("/purchase-plans");
  revalidatePath(`/purchase-plans/${planId}`);
  revalidatePath("/stock");

  return { ok: true, batchesCreated: validItems.length, totalCost };
}

/** Compute raw shopping list + estimated total for a plan. */
export async function calculatePlanShoppingList(planId: string): Promise<{
  results: ExplodeResult[];
  estimatedTotal: number | null;
} | null> {
  const userId = await getCurrentUserId();
  const plan = await getPurchasePlan(planId);
  if (!plan) return null;

  const aggregated = new Map<string, number>(); // ingredientId -> baseUnit qty
  for (const item of plan.items) {
    for (const ri of item.recipeSize.ingredients) {
      if (ri.isOptional) continue;
      const needed = toBase(ri.quantity * item.targetQty, ri.unit, ri.ingredient.baseUnit);
      aggregated.set(ri.ingredientId, (aggregated.get(ri.ingredientId) ?? 0) + needed);
    }
  }

  const results = await explodeToRaw(
    Array.from(aggregated).map(([ingredientId, quantity]) => ({ ingredientId, quantity })),
    userId,
  );

  const estimatedTotal = results.every((r) => r.estimatedCost !== null)
    ? results.reduce((sum, r) => sum + (r.estimatedCost ?? 0), 0)
    : null;

  return { results, estimatedTotal };
}
