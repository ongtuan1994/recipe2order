import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPrepRecipe } from "@/lib/actions/prep-recipe";
import { ProductionForm } from "@/components/prep/ProductionForm";
import { PrepRecipeActions } from "@/components/prep/PrepRecipeActions";

export default async function PrepRecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipe, t, tRecipe, tCommon] = await Promise.all([
    getPrepRecipe(id),
    getTranslations("prep"),
    getTranslations("recipe"),
    getTranslations("common"),
  ]);
  if (!recipe || !recipe.outputIngredient) notFound();

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{recipe.name}</h1>
          {recipe.nameEn && (
            <p className="text-muted-foreground">{recipe.nameEn}</p>
          )}
          <div className="flex gap-2 pt-2">
            <Badge variant="default">PREP</Badge>
            <Badge variant="outline">
              → {recipe.outputIngredient.name}
            </Badge>
            <Badge variant="secondary">
              {recipe.yieldQuantity} {recipe.yieldUnit}
            </Badge>
          </div>
        </div>
        <PrepRecipeActions
          prepRecipeId={recipe.id}
          labels={{
            edit: tCommon("edit"),
            delete: tCommon("delete"),
            deleteConfirm: tRecipe("deleteConfirm", { name: recipe.name }),
            cancel: tCommon("cancel"),
            confirm: tCommon("confirm"),
            deleted: tRecipe("deleted"),
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("production")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionForm
            prepRecipeId={recipe.id}
            defaultQty={recipe.yieldQuantity ?? 1}
            outputUnit={recipe.outputIngredient.baseUnit}
            labels={{
              producedQty: t("producedQty"),
              note: tRecipe("notes"),
              produce: t("produce"),
              produced: t("produced"),
              unit: tRecipe("unit"),
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tRecipe("ingredients")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {recipe.prepIngredients.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>{i.ingredient.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {i.quantity} {i.unit}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {recipe.prepSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{tRecipe("steps")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              {recipe.prepSteps.map((step) => (
                <li key={step.id} className="flex gap-2">
                  <span className="font-medium tabular-nums">{step.stepNo}.</span>
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
          </CardContent>
        </Card>
      )}

      {recipe.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tRecipe("notes")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-line text-muted-foreground">
            {recipe.notes}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
