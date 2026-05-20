import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, ChefHat, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listSaleRecipes } from "@/lib/actions/recipe";
import { RecipeCard } from "@/components/recipe/RecipeCard";

export default async function RecipesPage() {
  const t = await getTranslations("recipe");
  const tCommon = await getTranslations("common");
  const recipes = await listSaleRecipes();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("saleRecipes")}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1">
            <a href="/api/export/recipes">
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
          {recipes.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={{
                id: r.id,
                name: r.name,
                nameEn: r.nameEn,
                sellPrice: r.sellPrice,
                imageUrl: r.imageUrl,
                category: r.category
                  ? { id: r.category.id, name: r.category.name, color: r.category.color }
                  : null,
                sizes: r.sizes,
              }}
            />
          ))}
        </div>
      )}
      {/* tCommon kept for future search/filter UI */}
      <span className="hidden">{tCommon("search")}</span>
    </main>
  );
}
