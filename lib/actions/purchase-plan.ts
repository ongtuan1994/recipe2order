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

export async function deletePurchasePlan(id: string) {
  const userId = await getCurrentUserId();
  await prisma.purchasePlan.deleteMany({ where: { id, userId } });
  revalidatePath("/purchase-plans");
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
