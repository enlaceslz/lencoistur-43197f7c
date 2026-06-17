---
name: images-media
description: "Estratégia de imagens e mídia para web: seleção visual orientada a propósito, otimização técnica (WebP/AVIF, srcset, lazy loading), uso de SVG para ícones, alt texts descritivos e orçamento de performance abaixo de 200KB por imagem. Garante que cada elemento visual contribui para o objetivo da página sem prejudicar o tempo de carregamento."
---

Review and optimize the images and media in this project.

1. IMAGE FORMAT AUDIT — What image formats are currently used (PNG, JPG, GIF, WebP, AVIF, SVG)? All photos and complex images should be WebP or AVIF. All icons and simple graphics should be SVG. Flag any large PNGs or JPGs that should be converted.

2. RESPONSIVE IMAGES — Are images using srcset and sizes attributes for different viewport sizes? Example: <img srcset="img-400.webp 400w, img-800.webp 800w, img-1200.webp 1200w" sizes="(max-width: 640px) 100vw, 50vw">. Implement for all hero and feature images.

3. LAZY LOADING — Are images below the fold using loading="lazy"? The first 1-2 images above the fold should use loading="eager" (or no attribute). All others: loading="lazy".

4. SVG ICONS — Are icon SVGs inline or external sprite? Inline SVGs: can be styled with CSS, no extra HTTP requests. External sprites: better caching, cleaner HTML. Do all SVG icons have aria-hidden="true" (if decorative) or a title element (if meaningful)?

5. ALT TEXT — Check every <img> tag. Decorative images: alt="". Informative images: descriptive alt text (what does the image communicate, not describe). Product images: include product name and key visual attributes.

6. CORE WEB VITALS — Are images causing LCP (Largest Contentful Paint) issues? The LCP element (usually the hero image) should be: preloaded with <link rel="preload">, served in WebP/AVIF, sized correctly (no oversized images scaled down with CSS), and using fetchpriority="high".

Provide specific code fixes for each issue.
