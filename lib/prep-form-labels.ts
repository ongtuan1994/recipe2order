import { getTranslations } from "next-intl/server";

export async function buildPrepFormLabels() {
  const t = await getTranslations("prep");
  const tRecipe = await getTranslations("recipe");
  const tCommon = await getTranslations("common");
  return {
    name: tRecipe("name"),
    nameEn: tRecipe("nameEn"),
    outputIngredient: t("outputIngredient"),
    noPrepIngredient: t("noPrepIngredient"),
    yield: t("yield"),
    yieldUnit: t("yieldUnit"),
    description: tRecipe("description"),
    notes: tRecipe("notes"),
    ingredients: tRecipe("ingredients"),
    addIngredient: tRecipe("addIngredient"),
    pickIngredient: tRecipe("pickIngredient"),
    quantity: tRecipe("quantity"),
    unit: tRecipe("unit"),
    steps: tRecipe("steps"),
    addStep: tRecipe("addStep"),
    stepTitle: tRecipe("stepTitle"),
    stepDetail: tRecipe("stepDetail"),
    moveUp: tRecipe("moveUp"),
    moveDown: tRecipe("moveDown"),
    remove: tRecipe("remove"),
    save: tCommon("save"),
    cancel: tCommon("cancel"),
    saved: tRecipe("saved"),
  };
}
