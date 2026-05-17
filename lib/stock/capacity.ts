import { prisma } from "@/lib/prisma";
import { convert, getBaseUnit } from "@/lib/units/conversion";

export interface CapacityLineDetail {
  ingredientId: string;
  ingredientName: string;
  perUnitInBase: number;
  availableInBase: number;
  maxFromThis: number;
}

export interface CapacityResult {
  maxUnits: number;
  bottleneck: {
    ingredientId: string;
    ingredientName: string;
  } | null;
  lines: CapacityLineDetail[];
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
 * Sum of ACTIVE stock for an ingredient (in baseUnit).
 */
async function currentStock(ingredientId: string, userId: string): Promise<number> {
  const agg = await prisma.stockBatch.aggregate({
    where: {
      ingredientId,
      ingredient: { userId },
      status: "ACTIVE",
    },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}

/**
 * Effective producible qty for an ingredient (in its baseUnit):
 *  - RAW: current ACTIVE stock
 *  - PREP: current stock + (additional from raw via prep recipe, recursively)
 *
 * `visiting` guards against cycles between prep recipes.
 */
async function producibleQty(
  ingredientId: string,
  userId: string,
  memo: Map<string, number>,
  visiting: Set<string>,
): Promise<number> {
  if (memo.has(ingredientId)) return memo.get(ingredientId)!;
  if (visiting.has(ingredientId)) {
    // Cycle: only count current stock to break recursion.
    return currentStock(ingredientId, userId);
  }
  visiting.add(ingredientId);

  const ingredient = await prisma.ingredient.findFirst({
    where: { id: ingredientId, userId, isDeleted: false },
    include: {
      prepRecipe: {
        include: {
          prepIngredients: {
            include: { ingredient: { select: { id: true, baseUnit: true } } },
          },
        },
      },
    },
  });

  if (!ingredient) {
    visiting.delete(ingredientId);
    return 0;
  }

  const stock = await currentStock(ingredientId, userId);

  if (ingredient.type === "RAW" || !ingredient.prepRecipe || !ingredient.prepRecipe.yieldQuantity) {
    visiting.delete(ingredientId);
    memo.set(ingredientId, stock);
    return stock;
  }

  const prep = ingredient.prepRecipe;
  // For each prep ingredient, compute producible-rounds of this prep recipe
  let minRounds = Infinity;
  for (const ri of prep.prepIngredients) {
    if (ri.isOptional) continue;
    const subProducible = await producibleQty(ri.ingredientId, userId, memo, visiting);
    const perRoundInBase = toBase(ri.quantity, ri.unit, ri.ingredient.baseUnit);
    if (perRoundInBase <= 0) continue;
    const rounds = subProducible / perRoundInBase;
    if (rounds < minRounds) minRounds = rounds;
  }
  const additional = minRounds === Infinity ? 0 : minRounds * (prep.yieldQuantity ?? 0);
  const total = stock + Math.max(0, additional);

  visiting.delete(ingredientId);
  memo.set(ingredientId, total);
  return total;
}

/**
 * Compute the maximum number of units of a given RecipeSize that can be produced
 * given current stock + ability to prep more from raw.
 */
export async function calculateCapacity(
  recipeSizeId: string,
  userId: string,
): Promise<CapacityResult> {
  const size = await prisma.recipeSize.findFirst({
    where: { id: recipeSizeId, recipe: { userId, isDeleted: false } },
    include: {
      ingredients: {
        where: { isOptional: false },
        include: { ingredient: { select: { id: true, name: true, baseUnit: true } } },
      },
    },
  });
  if (!size) {
    return { maxUnits: 0, bottleneck: null, lines: [] };
  }

  const memo = new Map<string, number>();
  const lines: CapacityLineDetail[] = [];

  for (const ri of size.ingredients) {
    const perUnitInBase = toBase(ri.quantity, ri.unit, ri.ingredient.baseUnit);
    const available = await producibleQty(ri.ingredientId, userId, memo, new Set());
    const maxFromThis = perUnitInBase > 0 ? available / perUnitInBase : Infinity;
    lines.push({
      ingredientId: ri.ingredient.id,
      ingredientName: ri.ingredient.name,
      perUnitInBase,
      availableInBase: available,
      maxFromThis,
    });
  }

  if (lines.length === 0) return { maxUnits: 0, bottleneck: null, lines: [] };

  const bottleneckLine = lines.reduce((min, l) => (l.maxFromThis < min.maxFromThis ? l : min));
  return {
    maxUnits: Math.max(0, Math.floor(bottleneckLine.maxFromThis)),
    bottleneck: {
      ingredientId: bottleneckLine.ingredientId,
      ingredientName: bottleneckLine.ingredientName,
    },
    lines,
  };
}

/**
 * Convenience: compute capacity for every SALE recipe size of the current user.
 */
export async function capacityForAllSaleSizes(userId: string) {
  const recipes = await prisma.recipe.findMany({
    where: { userId, isDeleted: false, recipeType: "SALE" },
    include: { sizes: { orderBy: { order: "asc" } } },
    orderBy: { name: "asc" },
  });

  const results = await Promise.all(
    recipes.flatMap((r) =>
      r.sizes.map(async (s) => ({
        recipeId: r.id,
        recipeName: r.name,
        sizeId: s.id,
        sizeName: s.sizeName,
        capacity: await calculateCapacity(s.id, userId),
      })),
    ),
  );
  return results;
}
