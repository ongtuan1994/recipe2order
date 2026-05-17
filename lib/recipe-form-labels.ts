import { getTranslations } from "next-intl/server";
import type { RecipeFormLabels } from "@/components/recipe/RecipeForm";

export async function buildRecipeFormLabels(): Promise<RecipeFormLabels> {
  const t = await getTranslations("recipe");
  const tCommon = await getTranslations("common");
  const tCategory = await getTranslations("category");
  return {
    name: t("name"),
    nameEn: t("nameEn"),
    category: t("category"),
    uncategorized: t("uncategorized"),
    newCategory: t("newCategory"),
    sellPrice: t("sellPrice"),
    description: t("description"),
    notes: t("notes"),
    sizes: t("sizes"),
    addSize: t("addSize"),
    sizeName: t("sizeName"),
    ingredients: t("ingredients"),
    addIngredient: t("addIngredient"),
    pickIngredient: t("pickIngredient"),
    quantity: t("quantity"),
    unit: t("unit"),
    steps: t("steps"),
    addStep: t("addStep"),
    stepTitle: t("stepTitle"),
    stepDetail: t("stepDetail"),
    moveUp: t("moveUp"),
    moveDown: t("moveDown"),
    remove: t("remove"),
    save: tCommon("save"),
    cancel: tCommon("cancel"),
    saved: t("saved"),
    newCategoryDialogTitle: t("newCategory"),
    categoryNameLabel: tCategory("name"),
    categoryCreated: tCategory("created"),
  };
}
