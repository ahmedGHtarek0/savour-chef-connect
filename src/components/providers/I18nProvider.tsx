import { useEffect, type ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import i18n, { LANGUAGES } from "@/lib/i18n";

function DirSync() {
  const { i18n: i } = useTranslation();
  useEffect(() => {
    if (typeof document === "undefined") return;
    const lang = LANGUAGES.find(l => l.code === i.language.split("-")[0]) ?? LANGUAGES[0];
    document.documentElement.lang = lang.code;
    document.documentElement.dir = lang.dir;
  }, [i.language]);
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <DirSync />
      {children}
    </I18nextProvider>
  );
}