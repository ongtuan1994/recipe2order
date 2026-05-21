import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { capacityForAllSaleSizes } from "@/lib/stock/capacity";
import { getCurrentUserId } from "@/lib/auth-helpers";

export default async function CapacityPage() {
  const userId = await getCurrentUserId();
  const [t, items] = await Promise.all([
    getTranslations("capacity"),
    capacityForAllSaleSizes(userId),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>

      {items.length === 0 ? (
        <p className="text-muted-foreground">{t("noRecipes")}</p>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipe</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>{t("maxUnits")}</TableHead>
                  <TableHead>{t("bottleneck")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.sizeId}>
                    <TableCell className="font-medium">{it.recipeName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{it.sizeName}</Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      <span
                        className={
                          it.capacity.maxUnits === 0
                            ? "text-destructive font-semibold"
                            : it.capacity.maxUnits < 5
                              ? "text-amber-600 font-semibold"
                              : "text-foreground"
                        }
                      >
                        {it.capacity.maxUnits} {t("units")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {it.capacity.bottleneck?.ingredientName ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
