import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  recipe: {
    id: string;
    name: string;
    nameEn: string | null;
    sellPrice: number | null;
    category: { id: string; name: string; color: string | null } | null;
    sizes: { id: string; sizeName: string }[];
    /** Cost of goods % for the first size. null when any ingredient lacks a price. */
    cogPercent: number | null;
    cogCost: number | null;
  };
  cogLabel: string;
}

function cogColor(pct: number): string {
  if (pct < 30) return "text-emerald-600";
  if (pct < 50) return "text-amber-600";
  return "text-red-600";
}

export function RecipeCard({ recipe, cogLabel }: Props) {
  const cogTitle =
    recipe.cogCost !== null && recipe.cogPercent !== null
      ? `${cogLabel} ฿${recipe.cogCost.toFixed(2)} (${recipe.cogPercent.toFixed(1)}%)`
      : undefined;
  return (
    <Link href={`/recipes/${recipe.id}`} prefetch className="block">
      <Card className="h-full hover:border-foreground/40 transition-colors">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium leading-tight truncate">{recipe.name}</h3>
              {recipe.nameEn && (
                <p className="text-xs text-muted-foreground truncate">{recipe.nameEn}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              {recipe.sellPrice ? (
                <span className="text-sm font-semibold tabular-nums">
                  ฿{recipe.sellPrice.toFixed(0)}
                </span>
              ) : null}
              {recipe.cogPercent !== null ? (
                <span
                  title={cogTitle}
                  className={`text-xs tabular-nums ${cogColor(recipe.cogPercent)}`}
                >
                  {cogLabel} {recipe.cogPercent.toFixed(0)}%
                </span>
              ) : (
                <span className="text-xs text-muted-foreground" title={cogLabel}>
                  {cogLabel} —
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-1">
          {recipe.category && (
            <Badge
              variant="outline"
              style={
                recipe.category.color
                  ? { borderColor: recipe.category.color, color: recipe.category.color }
                  : undefined
              }
            >
              {recipe.category.name}
            </Badge>
          )}
          {recipe.sizes.map((s) => (
            <Badge key={s.id} variant="secondary">
              {s.sizeName}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </Link>
  );
}
