import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown>;
}

const SITE = import.meta.env.VITE_SITE_URL || "https://lencois.tur.br";

const hreflangUrl = (lng: string, basePath: string) => {
  const prefix = lng === "pt" ? "" : `/${lng}`;
  const p = basePath === "/" ? "" : basePath;
  return `${SITE}${prefix}${p}`;
};

const SEO = ({ title, description, path = "/", image, type = "website", jsonLd }: SEOProps) => {
  const { i18n } = useTranslation();
  const lang = i18n.language === "pt" ? "" : `/${i18n.language}`;
  const base = path === "/" ? "" : path;
  const url = `${SITE}${lang}${base}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <link rel="alternate" hreflang="pt" href={hreflangUrl("pt", path)} />
      <link rel="alternate" hreflang="en" href={hreflangUrl("en", path)} />
      <link rel="alternate" hreflang="es" href={hreflangUrl("es", path)} />
      <link rel="alternate" hreflang="x-default" href={hreflangUrl("pt", path)} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
};

export default SEO;
