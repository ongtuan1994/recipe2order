import { prisma } from "@/lib/prisma";
import { convert, getBaseUnit } from "@/lib/units/conversion";

export interface ExplodeInput {
  ingredientId: string;
  quantity: number; // already in baseUnit
}

export interface ExplodeResult {
  ingredientId: string;
  ingredientName: string;
  baseUnit: string;
  needed: number;
  inStock: number;
  toBuy: number;
  pricePerBaseUnit: number | null;
  estimatedCost: number | null;
}

function toBase(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;
  const fromBase = getBaseUnit(fromUnit);
  const toBase = getBaseUnit(toUnit);
  if (fromBase && toBase && fromBase === toBase) {
    return convert(quantity, fromUnit, toUnit);
  }
  return quantity;
}

/**
 * Walk PREP ingredients down to RAW, summing needed quantities. Then subtract
 * current ACTIVE stock to compute `toBuy` per RAW ingredient.
 */
export async function explodeToRaw(
  items: ExplodeInput[],
  userId: string,
): Promise<ExplodeResult[]> {
  const rawNeeded = new Map<string, number>(); // ingredientId -> qty in baseUnit
  const visiting = new Set<string>();

  async function explode(ingredientId: string, quantityInBase: number) {
    if (quantityInBase <= 0) return;
    if (visiting.has(ingredientId)) return; // cycle guard
    visiting.add(ingredientId);

    const ing = await prisma.ingredient.findFirst({
      where: { id: ingredientId, userId, isDeleted: false },
      include: {
        prepRecipe: {
          include: {
            prepIngredients: {
              include: { ingredient: { select: { baseUnit: true } } },
            },
          },
        },
      },
    });

    if (!ing) {
      visiting.delete(ingredientId);
      return;
    }

    if (ing.type === "RAW" || !ing.prepRecipe || !ing.prepRecipe.yieldQuantity) {
      rawNeeded.set(ingredientId, (rawNeeded.get(ingredientId) ?? 0) + quantityInBase);
      visiting.delete(ingredientId);
      return;
    }

    const yieldQty = ing.prepRecipe.yieldQuantity;
    const rounds = quantityInBase / yieldQty;
    for (const ri of ing.prepRecipe.prepIngredients) {
      if (ri.isOptional) continue;
      const perRoundInBase = toBase(ri.quantity, ri.unit, ri.ingredient.baseUnit);
      await explode(ri.ingredientId, perRoundInBase * rounds);
    }
    visiting.delete(ingredientId);
  }

  for (const item of items) {
    await explode(item.ingredientId, item.quantity);
  }

  // Gather per-ingredient details + stock + cost
  const results: ExplodeResult[] = [];
  for (const [ingredientId, needed] of rawNeeded) {
    const ing = await prisma.ingredient.findFirst({
      where: { id: ingredientId, userId, isDeleted: false },
      include: { defaultVariant: true },
    });
    if (!ing) continue;
    const agg = await prisma.stockBatch.aggregate({
      where: { ingredientId, ingredient: { userId }, status: "ACTIVE" },
      _sum: { quantity: true },
    });
    const inStock = agg._sum.quantity ?? 0;
    const toBuy = Math.max(0, needed - inStock);
    const pricePerBase = ing.defaultVariant?.pricePerBaseUnit ?? null;
    results.push({
      ingredientId,
      ingredientName: ing.name,
      baseUnit: ing.baseUnit,
      needed,
      inStock,
      toBuy,
      pricePerBaseUnit: pricePerBase,
      estimatedCost: pricePerBase !== null ? pricePerBase * toBuy : null,
    });
  }

  return results.sort((a, b) => b.toBuy - a.toBuy);
}
