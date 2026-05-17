import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const t = await getTranslations("app");
  const tNav = await getTranslations("nav");
  const tAuth = await getTranslations("auth");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-xl space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t("name")}</h1>
        <p className="text-lg text-muted-foreground">{t("tagline")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button asChild>
            <Link href="/login">{tAuth("login")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">{tNav("dashboard")}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
