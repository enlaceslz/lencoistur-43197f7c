---
name: Navigation Design
description: Arquitetura da navegação com no máximo 5–7 itens no menu principal, meta-navegação, breadcrumbs, links no rodapé e busca integrada. Prioriza clareza sobre criatividade, acessibilidade por teclado e orienta o usuário pelo site sem que ele precise pensar. Inclui padrões para mobile (hamburger, bottom nav) e desktop (mega menu, tabs).
---

Review and improve the navigation design of this project.

1. NAVIGATION AUDIT — What navigation patterns are currently used (top nav, sidebar, breadcrumbs, footer nav, mega menu, tab bar)? Are they appropriate for the content volume and user goals?

2. INFORMATION ARCHITECTURE — List all navigation items. Are they labeled in user-language (not company jargon)? Are related items grouped? Is the depth more than 3 levels (if so, flatten)? Can users always tell where they are and how to get back?

3. MOBILE NAVIGATION — Below 768px, does the main nav collapse to a hamburger menu? When opened: does the menu overlay have sufficient contrast? Can it be closed with Esc? Is focus trapped inside the open menu? Is there a close button?

4. ACTIVE STATES — Is the current page/section clearly indicated in the navigation? Are active states visually distinct (not just a color change, but also a weight or indicator change)?

5. BREADCRUMBS — For pages deeper than 2 levels: are breadcrumbs shown? Are they marked up with nav aria-label="Breadcrumb" and the current page marked with aria-current="page"?

6. KEYBOARD & ACCESSIBILITY — Can the navigation be fully operated with keyboard? Tab through the nav: every item reachable? Dropdown menus: open with Enter/Space, navigate with Arrow keys, close with Esc? Is there a visible focus indicator on every nav item?

7. SEARCH — If the site has 20+ pages, is there a search feature? Is the search input accessible (role="search", label)?

Provide specific HTML/CSS fixes for each issue found.
