import { useTranslation } from "react-i18next";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border/50 mt-24 py-10">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {t("app.name")} — {t("app.tagline")}</p>
        <p className="opacity-70">Made with care for home chefs everywhere.</p>
      </div>
    </footer>
  );
}