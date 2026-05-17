import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { listPurchasePlans } from "@/lib/actions/purchase-plan";

export default async function PurchasePlansPage() {
  const t = await getTranslations("purchase");
  const plans = await listPurchasePlans();

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
                  <h3 className="font-medium">{p.name}</h3>
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
