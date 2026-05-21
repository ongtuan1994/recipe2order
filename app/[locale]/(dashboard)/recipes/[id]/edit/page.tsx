import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RecipeForm } from "@/components/recipe/RecipeForm";
import { getSaleRecipe } from "@/lib/actions/recipe";
import { listCategories } from "@/lib/actions/category";
import { listIngredientsForPicker } from "@/lib/actions/ingredient";
import { buildRecipeFormLabels } from "@/lib/recipe-form-labels";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [t, recipe, categories, ingredients, labels] = await Promise.all([
    getTranslations("recipe"),
    getSaleRecipe(id),
    listCategories(),
    listIngredientsForPicker(),
    buildRecipeFormLabels(),
  ]);
  if (!recipe) notFound();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("edit")}</h1>
      <RecipeForm
        mode="edit"
        recipeId={recipe.id}
        defaultValues={{
          name: recipe.name,
          nameEn: recipe.nameEn ?? "",
          categoryId: recipe.categoryId ?? "",
          sellPrice: recipe.sellPrice ?? undefined,
          description: recipe.description ?? "",
          notes: recipe.notes ?? "",
          sizes: recipe.sizes.map((s) => ({
            sizeName: s.sizeName,
            ingredients: s.ingredients.map((i) => ({
              ingredientId: i.ingredientId,
              quantity: i.quantity,
              unit: i.unit,
              note: i.note ?? "",
              isOptional: i.isOptional,
            })),
            steps: s.steps.map((step) => ({
              title: step.title ?? "",
              detail: step.detail ?? "",
            })),
          })),
        }}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          baseUnit: i.baseUnit,
        }))}
        labels={labels}
        cancelHref={`/recipes/${recipe.id}`}
      />
    </main>
  );
}
