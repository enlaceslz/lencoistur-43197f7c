import { useTranslation } from "react-i18next";

export function useLocalizedPath() {
  const { i18n } = useTranslation();
  const { language } = i18n;

  return (path: string): string => {
    if (language === "pt") return path;
    const [p, qs] = path.split("?");
    const base = p === "/" || p === "" ? "" : p;
    const result = `/${language}${base}`;
    return qs ? `${result}?${qs}` : result;
  };
}
