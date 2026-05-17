import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export async function exportRecipesXLSX(userId: string): Promise<Buffer> {
  const recipes = await prisma.recipe.findMany({
    where: { userId, isDeleted: false },
    include: {
      category: true,
      sizes: {
        orderBy: { order: "asc" },
        include: {
          ingredients: {
            include: { ingredient: { select: { name: true } } },
            orderBy: { order: "asc" },
          },
          steps: { orderBy: { stepNo: "asc" } },
        },
      },
      prepIngredients: {
        include: { ingredient: { select: { name: true } } },
        orderBy: { order: "asc" },
      },
      prepSteps: { orderBy: { stepNo: "asc" } },
      outputIngredient: true,
    },
    orderBy: { name: "asc" },
  });

  const recipeRows = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    nameEn: r.nameEn ?? "",
    type: r.recipeType,
    category: r.category?.name ?? "",
    sellPrice: r.sellPrice ?? "",
    yieldQuantity: r.yieldQuantity ?? "",
    yieldUnit: r.yieldUnit ?? "",
    outputIngredient: r.outputIngredient?.name ?? "",
  }));

  // Flatten size+ingredient lines (one row per ingredient)
  const lineRows: Array<Record<string, string | number>> = [];
  for (const r of recipes) {
    if (r.recipeType === "SALE") {
      for (const size of r.sizes) {
        for (const ing of size.ingredients) {
          lineRows.push({
            recipeName: r.name,
            sizeName: size.sizeName,
            ingredient: ing.ingredient.name,
            quantity: ing.quantity,
            unit: ing.unit,
            optional: ing.isOptional ? "yes" : "",
          });
        }
      }
    } else {
      for (const ing of r.prepIngredients) {
        lineRows.push({
          recipeName: r.name,
          sizeName: "(prep)",
          ingredient: ing.ingredient.name,
          quantity: ing.quantity,
          unit: ing.unit,
          optional: ing.isOptional ? "yes" : "",
        });
      }
    }
  }

  // Steps: flatten as well
  const stepRows: Array<Record<string, string | number>> = [];
  for (const r of recipes) {
    if (r.recipeType === "SALE") {
      for (const size of r.sizes) {
        for (const step of size.steps) {
          stepRows.push({
            recipeName: r.name,
            sizeName: size.sizeName,
            stepNo: step.stepNo,
            title: step.title ?? "",
            detail: step.detail ?? "",
          });
        }
      }
    } else {
      for (const step of r.prepSteps) {
        stepRows.push({
          recipeName: r.name,
          sizeName: "(prep)",
          stepNo: step.stepNo,
          title: step.title ?? "",
          detail: step.detail ?? "",
        });
      }
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recipeRows), "Recipes");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lineRows), "Ingredients");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stepRows), "Steps");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
