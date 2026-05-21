import { getTranslations } from "next-intl/server";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { listCategories } from "@/lib/actions/category";
import { listIngredientsForPicker } from "@/lib/actions/ingredient";
import { buildRecipeFormLabels } from "@/lib/recipe-form-labels";

export default async function NewRecipePage() {
  const [t, categories, ingredients, labels] = await Promise.all([
    getTranslations("recipe"),
    listCategories(),
    listIngredientsForPicker(),
    buildRecipeFormLabels(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("new")}</h1>
      <RecipeForm
        mode="create"
        defaultValues={{
          name: "",
          nameEn: "",
          categoryId: "",
          sellPrice: undefined,
          description: "",
          notes: "",
          sizes: [
            {
              sizeName: "",
              ingredients: [
                { ingredientId: "", quantity: 0, unit: "g", note: "", isOptional: false },
              ],
              steps: [],
            },
          ],
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          baseUnit: i.baseUnit,
        }))}
        labels={labels}
        cancelHref="/recipes"
      />
    </main>
  );
}
