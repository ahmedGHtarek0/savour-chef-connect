import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import zh from "./locales/zh.json";
import it from "./locales/it.json";
import tr from "./locales/tr.json";
import de from "./locales/de.json";

export const LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "it", label: "Italiano", dir: "ltr" },
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ar: { translation: ar },
        fr: { translation: fr },
        es: { translation: es },
        zh: { translation: zh },
        it: { translation: it },
        tr: { translation: tr },
        de: { translation: de },
      },
      fallbackLng: "en",
      interpolation: { escapeValue: false },
      detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
    });
}

export default i18n;