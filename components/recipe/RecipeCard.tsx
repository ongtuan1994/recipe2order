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
  };
}

export function RecipeCard({ recipe }: Props) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="block">
      <Card className="h-full hover:border-foreground/40 transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium leading-tight">{recipe.name}</h3>
              {recipe.nameEn && (
                <p className="text-xs text-muted-foreground">{recipe.nameEn}</p>
              )}
            </div>
            {recipe.sellPrice ? (
              <span className="text-sm font-semibold tabular-nums">
                ฿{recipe.sellPrice.toFixed(0)}
              </span>
            ) : null}
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
