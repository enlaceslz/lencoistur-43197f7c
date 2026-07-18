import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

const detectLang = () => {
  if (typeof window === "undefined") return "pt";
  const match = window.location.pathname.match(/^\/(en|es)(\/|$)/);
  return match?.[1] || localStorage.getItem("i18nextLng") || "pt";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { pt: { translation: pt }, en: { translation: en }, es: { translation: es } },
    lng: detectLang(),
    fallbackLng: "pt",
    supportedLngs: ["pt", "en", "es"],
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      caches: ["localStorage"],
    },
  });

export default i18n;
