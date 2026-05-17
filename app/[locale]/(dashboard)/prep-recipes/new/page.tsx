import { getTranslations } from "next-intl/server";
import { PrepRecipeForm } from "@/components/prep/PrepRecipeForm";
import { listIngredientsForPicker } from "@/lib/actions/ingredient";
import { listAvailablePrepIngredients } from "@/lib/actions/prep-recipe";
import { buildPrepFormLabels } from "@/lib/prep-form-labels";

export default async function NewPrepRecipePage() {
  const t = await getTranslations("prep");
  const [ingredients, prepIngredients, labels] = await Promise.all([
    listIngredientsForPicker(),
    listAvailablePrepIngredients(),
    buildPrepFormLabels(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <PrepRecipeForm
        mode="create"
        defaultValues={{
          name: "",
          nameEn: "",
          outputIngredientId: prepIngredients[0]?.id ?? "",
          yieldQuantity: 1,
          yieldUnit: prepIngredients[0]?.baseUnit ?? "g",
          description: "",
          notes: "",
          ingredients: [
            { ingredientId: "", quantity: 0, unit: "g", note: "", isOptional: false },
          ],
          steps: [],
        }}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          baseUnit: i.baseUnit,
        }))}
        prepIngredientOptions={prepIngredients}
        labels={labels}
        cancelHref="/prep-recipes"
      />
    </main>
  );
}
