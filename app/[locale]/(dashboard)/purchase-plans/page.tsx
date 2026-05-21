import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listPurchasePlans } from "@/lib/actions/purchase-plan";

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  PURCHASED: "default",
  CANCELLED: "outline",
};

export default async function PurchasePlansPage() {
  const [t, plans] = await Promise.all([
    getTranslations("purchase"),
    listPurchasePlans(),
  ]);

  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <Button asChild className="gap-1">
          <Link href="/purchase-plans/new">
            <Plus className="h-4 w-4" /> {t("new")}
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">{t("emptyList")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Link key={p.id} href={`/purchase-plans/${p.id}`}>
              <Card className="h-full hover:border-foreground/40 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium">{p.name}</h3>
                    <Badge variant={statusVariant[p.status] ?? "secondary"}>
                      {t(`status.${p.status.toLowerCase()}` as "status.draft")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {p.targetDate && (
                    <p>
                      {t("targetDate")}: {p.targetDate.toISOString().slice(0, 10)}
                    </p>
                  )}
                  <p>
                    {p.items.length} {t("items")}
                  </p>
                  {p.totalCost !== null && (
                    <p className="text-foreground font-medium">
                      {t("actualTotal")}: ฿{p.totalCost.toFixed(2)}
                    </p>
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
