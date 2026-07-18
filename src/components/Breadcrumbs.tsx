import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useLocalizedPath } from "@/lib/useLocalizedPath";

interface Crumb {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: Crumb[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const loc = useLocalizedPath();

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.path ? { item: `https://lencois.tur.br${loc(item.path)}` } : {}),
    })),
  };

  return (
    <>
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      </Helmet>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-muted-foreground/50" />}
            {item.path && i < items.length - 1 ? (
              <Link to={loc(item.path)} className="hover:text-primary transition-colors">{item.label}</Link>
            ) : (
              <span className={i === items.length - 1 ? "text-foreground font-medium" : ""}>{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;
