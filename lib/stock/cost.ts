import { prisma } from "@/lib/prisma";
import { convert, getBaseUnit } from "@/lib/units/conversion";

/** Convert a quantity to the ingredient's base unit, or pass through if unit is unknown or piece. */
function toBase(qty: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return qty;
  const f = getBaseUnit(fromUnit);
  const t = getBaseUnit(toUnit);
  if (f && t && f === t) return convert(qty, fromUnit, toUnit);
  return qty;
}

export interface IngredientCostMap {
  /** Cost per base unit (THB). `null` = at least one input has no variant. */
  cost: Map<string, number | null>;
  /** baseUnit lookup so callers can convert recipe quantities to the cost base. */
  baseUnitById: Map<string, string>;
}

/**
 * Bulk-load every ingredient + every PREP recipe for a user, then walk the
 * dependency graph to compute cost-per-base-unit for each ingredient.
 * Two queries instead of one per recipe.
 */
export async function getIngredientCostMap(userId: string): Promise<IngredientCostMap> {
  const [ingredients, prepRecipes] = await Promise.all([
    prisma.ingredient.findMany({
      where: { userId, isDeleted: false },
      select: {
        id: true,
        type: true,
        baseUnit: true,
        prepRecipeId: true,
        defaultVariant: { select: { pricePerBaseUnit: true } },
      },
    }),
    prisma.recipe.findMany({
      where: { userId, isDeleted: false, recipeType: "PREP" },
      select: {
        id: true,
        yieldQuantity: true,
        yieldUnit: true,
        prepIngredients: {
          select: { ingredientId: true, quantity: true, unit: true },
        },
      },
    }),
  ]);

  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const prepById = new Map(prepRecipes.map((p) => [p.id, p]));
  const cost = new Map<string, number | null>();

  function compute(id: string, visiting: Set<string>): number | null {
    if (cost.has(id)) return cost.get(id)!;
    if (visiting.has(id)) {
      // cycle — treat as unknown
      cost.set(id, null);
      return null;
    }
    visiting.add(id);

    const ing = byId.get(id);
    if (!ing) {
      cost.set(id, null);
      return null;
    }

    if (ing.type === "RAW") {
      const c = ing.defaultVariant?.pricePerBaseUnit ?? null;
      cost.set(id, c);
      return c;
    }

    // PREP: cost = (sum of child costs) / yield
    const prep = ing.prepRecipeId ? prepById.get(ing.prepRecipeId) : null;
    if (!prep?.yieldQuantity) {
      cost.set(id, null);
      return null;
    }

    let total = 0;
    for (const child of prep.prepIngredients) {
      const childIng = byId.get(child.ingredientId);
      if (!childIng) {
        cost.set(id, null);
        return null;
      }
      const childCost = compute(child.ingredientId, visiting);
      if (childCost === null) {
        cost.set(id, null);
        return null;
      }
      const qty = toBase(child.quantity, child.unit, childIng.baseUnit);
      total += childCost * qty;
    }
    const perUnit = total / prep.yieldQuantity;
    cost.set(id, perUnit);
    return perUnit;
  }

  for (const ing of ingredients) compute(ing.id, new Set());

  return {
    cost,
    baseUnitById: new Map(ingredients.map((i) => [i.id, i.baseUnit])),
  };
}

export interface SizeCost {
  totalCost: number;
  complete: boolean;
}

/** Sum cost across a size's ingredients using a pre-built cost map. */
export function computeSizeCost(
  sizeIngredients: { ingredientId: string; quantity: number; unit: string }[],
  costs: IngredientCostMap,
): SizeCost {
  let totalCost = 0;
  let complete = true;
  for (const ri of sizeIngredients) {
    const perUnit = costs.cost.get(ri.ingredientId);
    const baseUnit = costs.baseUnitById.get(ri.ingredientId);
    if (perUnit === null || perUnit === undefined || !baseUnit) {
      complete = false;
      continue;
    }
    const qty = toBase(ri.quantity, ri.unit, baseUnit);
    totalCost += perUnit * qty;
  }
  return { totalCost, complete };
}
