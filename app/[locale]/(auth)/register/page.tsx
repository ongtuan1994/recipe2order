import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default async function RegisterPage() {
  const t = await getTranslations("auth");
  const tApp = await getTranslations("app");

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">{tApp("name")}</h1>
          <p className="text-sm text-muted-foreground">{t("register")}</p>
        </div>
        <RegisterForm
          labels={{
            name: t("name"),
            email: t("email"),
            password: t("password"),
            submit: t("register"),
            success: t("registerSuccess"),
            emailTaken: t("emailTaken"),
          }}
        />
        <p className="text-center text-sm text-muted-foreground">
          {t("haveAccount")}{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </main>
  );
}
