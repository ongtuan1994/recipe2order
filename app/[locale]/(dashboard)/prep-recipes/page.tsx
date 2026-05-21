import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listPrepRecipes } from "@/lib/actions/prep-recipe";

export default async function PrepRecipesPage() {
  const [t, items] = await Promise.all([
    getTranslations("prep"),
    listPrepRecipes(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild className="gap-1">
          <Link href="/prep-recipes/new">
            <Plus className="h-4 w-4" /> {t("new")}
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Beaker className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("emptyList")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <Link key={r.id} href={`/prep-recipes/${r.id}`} prefetch>
              <Card className="h-full hover:border-foreground/40 transition-colors">
                <CardHeader>
                  <h3 className="font-medium leading-tight">{r.name}</h3>
                  {r.nameEn && (
                    <p className="text-xs text-muted-foreground">{r.nameEn}</p>
                  )}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {r.outputIngredient ? (
                    <span>
                      → {r.outputIngredient.name} ({r.yieldQuantity} {r.yieldUnit})
                    </span>
                  ) : (
                    <span className="text-destructive">No output linked</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
