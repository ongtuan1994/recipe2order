import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, Carrot, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listIngredients } from "@/lib/actions/ingredient";

export default async function IngredientsPage() {
  const [t, items] = await Promise.all([
    getTranslations("ingredient"),
    listIngredients(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-1">
            <a href="/api/export/ingredients" download>
              <Download className="h-4 w-4" /> Export
            </a>
          </Button>
          <Button asChild className="gap-1">
            <Link href="/ingredients/new">
              <Plus className="h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Carrot className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("emptyList")}</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("baseUnit")}</TableHead>
              <TableHead>{t("pricePerBase")}</TableHead>
              <TableHead>Batches</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((i) => (
              <TableRow key={i.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/ingredients/${i.id}`}
                    className="font-medium hover:underline"
                  >
                    {i.name}
                  </Link>
                  {i.nameEn && (
                    <span className="block text-xs text-muted-foreground">{i.nameEn}</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={i.type === "PREP" ? "default" : "secondary"}
                    className={
                      i.type === "PREP"
                        ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                        : undefined
                    }
                  >
                    {i.type}
                  </Badge>
                </TableCell>
                <TableCell>{i.baseUnit}</TableCell>
                <TableCell>
                  {i.defaultVariant ? (
                    <span className="tabular-nums">
                      ฿{i.defaultVariant.pricePerBaseUnit.toFixed(3)} / {i.baseUnit}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="tabular-nums">{i._count.batches}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  );
}
