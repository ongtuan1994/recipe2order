import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PrepRecipeForm } from "@/components/prep/PrepRecipeForm";
import { listIngredientsForPicker } from "@/lib/actions/ingredient";
import {
  getPrepRecipe,
  listAvailablePrepIngredients,
} from "@/lib/actions/prep-recipe";
import { buildPrepFormLabels } from "@/lib/prep-form-labels";

export default async function EditPrepRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("recipe");
  const [recipe, ingredients, prepIngredients, labels] = await Promise.all([
    getPrepRecipe(id),
    listIngredientsForPicker(),
    listAvailablePrepIngredients(id),
    buildPrepFormLabels(),
  ]);
  if (!recipe || !recipe.outputIngredient) notFound();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <PrepRecipeForm
        mode="edit"
        prepRecipeId={recipe.id}
        defaultValues={{
          name: recipe.name,
          nameEn: recipe.nameEn ?? "",
          outputIngredientId: recipe.outputIngredient.id,
          yieldQuantity: recipe.yieldQuantity!,
          yieldUnit: recipe.yieldUnit!,
          description: recipe.description ?? "",
          notes: recipe.notes ?? "",
          ingredients: recipe.prepIngredients.map((i) => ({
            ingredientId: i.ingredientId,
            quantity: i.quantity,
            unit: i.unit,
            note: i.note ?? "",
            isOptional: i.isOptional,
          })),
          steps: recipe.prepSteps.map((s) => ({
            title: s.title ?? "",
            detail: s.detail ?? "",
          })),
        }}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          baseUnit: i.baseUnit,
        }))}
        prepIngredientOptions={prepIngredients.map((p) => ({
          id: p.id,
          name: p.name,
          baseUnit: p.baseUnit,
        }))}
        labels={labels}
        cancelHref={`/prep-recipes/${recipe.id}`}
      />
    </main>
  );
}
