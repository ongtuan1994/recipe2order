import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSaleRecipe } from "@/lib/actions/recipe";
import { RecipeActions } from "@/components/recipe/RecipeActions";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const recipe = await getSaleRecipe(id);
  if (!recipe) notFound();

  const t = await getTranslations("recipe");
  const tCommon = await getTranslations("common");

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{recipe.name}</h1>
          {recipe.nameEn && (
            <p className="text-muted-foreground">{recipe.nameEn}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {recipe.category && (
              <Badge variant="outline">{recipe.category.name}</Badge>
            )}
            {recipe.sellPrice && (
              <Badge variant="secondary">฿{recipe.sellPrice.toFixed(0)}</Badge>
            )}
          </div>
        </div>
        <RecipeActions
          recipeId={recipe.id}
          locale={locale}
          labels={{
            edit: tCommon("edit"),
            duplicate: tCommon("duplicate"),
            delete: tCommon("delete"),
            deleteConfirm: t("deleteConfirm", { name: recipe.name }),
            cancel: tCommon("cancel"),
            confirm: tCommon("confirm"),
            deleted: t("deleted"),
            duplicated: t("duplicated"),
          }}
        />
      </div>

      {recipe.description && (
        <Card>
          <CardContent className="pt-6 text-sm whitespace-pre-line">
            {recipe.description}
          </CardContent>
        </Card>
      )}

      {recipe.sizes.map((size) => (
        <Card key={size.id}>
          <CardHeader>
            <CardTitle className="text-lg">{size.sizeName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">{t("ingredients")}</h3>
              <ul className="space-y-1 text-sm">
                {size.ingredients.map((i) => (
                  <li key={i.id} className="flex justify-between gap-3">
                    <span>
                      {i.ingredient.name}
                      {i.isOptional && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({t("optional")})
                        </span>
                      )}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {i.quantity} {i.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {size.steps.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">{t("steps")}</h3>
                <ol className="space-y-2 text-sm">
                  {size.steps.map((step) => (
                    <li key={step.id} className="flex gap-2">
                      <span className="font-medium text-muted-foreground tabular-nums">
                        {step.stepNo}.
                      </span>
                      <div>
                        {step.title && <p className="font-medium">{step.title}</p>}
                        {step.detail && (
                          <p className="text-muted-foreground whitespace-pre-line">
                            {step.detail}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {recipe.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("notes")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-line text-muted-foreground">
            {recipe.notes}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
