import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
];

interface Props {
  variant?: "light" | "dark";
}

const toLangPath = (path: string, targetLang: string, currentLang: string): string => {
  const stripped = currentLang !== "pt" ? path.replace(/^\/[a-z]{2}/, "") || "/" : path;
  if (targetLang === "pt") return stripped;
  const base = stripped === "/" ? "" : stripped;
  return `/${targetLang}${base}`;
};

const LanguageSwitcher = ({ variant = "dark" }: Props) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const current = languages.find((l) => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    if (code === i18n.language) return;
    const target = toLangPath(location.pathname, code, i18n.language);
    const qs = location.search;
    navigate(`${target}${qs}`, { replace: true });
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-secondary ${
          variant === "light" ? "text-primary-foreground/90" : "text-foreground/80"
        }`}
      >
        <Globe size={16} />
        <span>{current.flag}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`cursor-pointer ${i18n.language === lang.code ? "bg-muted font-semibold" : ""}`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
