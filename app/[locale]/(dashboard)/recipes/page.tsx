import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, ChefHat, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { listSaleRecipes } from "@/lib/actions/recipe";
import { listCategories } from "@/lib/actions/category";
import { RecipeCard } from "@/components/recipe/RecipeCard";
import { CategoryFilter } from "@/components/recipe/CategoryFilter";
import { computeSizeCost, getIngredientCostMap } from "@/lib/stock/cost";

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const userId = await getCurrentUserId();
  const [t, recipes, categories, costs] = await Promise.all([
    getTranslations("recipe"),
    listSaleRecipes({ categoryId: category }),
    listCategories(),
    getIngredientCostMap(userId),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("saleRecipes")}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1">
            <a href="/api/export/recipes" download>
              <Download className="h-4 w-4" /> Export
            </a>
          </Button>
          <Button asChild className="gap-1">
            <Link href="/recipes/new">
              <Plus className="h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        </div>
      </div>

      <CategoryFilter
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        allLabel={t("allCategories")}
      />

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ChefHat className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("emptyList")}</p>
          <Button asChild>
            <Link href="/recipes/new">{t("new")}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {recipes.map((r) => {
            const firstSize = r.sizes[0];
            const sizeCost = firstSize
              ? computeSizeCost(firstSize.ingredients, costs)
              : null;
            const cogCost = sizeCost?.complete ? sizeCost.totalCost : null;
            const cogPercent =
              cogCost !== null && r.sellPrice && r.sellPrice > 0
                ? (cogCost / r.sellPrice) * 100
                : null;
            return (
              <RecipeCard
                key={r.id}
                cogLabel={t("cog")}
                recipe={{
                  id: r.id,
                  name: r.name,
                  nameEn: r.nameEn,
                  sellPrice: r.sellPrice,
                  category: r.category,
                  sizes: r.sizes.map((s) => ({ id: s.id, sizeName: s.sizeName })),
                  cogPercent,
                  cogCost,
                }}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
