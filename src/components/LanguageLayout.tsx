import { useEffect } from "react";
import { useParams, Navigate, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

const VALID_LANGS = ["en", "es"];

const LanguageLayout = () => {
  const { lang } = useParams<{ lang: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (lang && VALID_LANGS.includes(lang) && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, i18n]);

  if (!lang || !VALID_LANGS.includes(lang)) {
    const target = location.pathname.replace(/^\/[a-z]{2}/, "") || "/";
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
};

export default LanguageLayout;
