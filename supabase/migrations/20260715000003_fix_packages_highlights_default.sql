-- Fix root cause of frontend crash on / (homepage PackagesSection).
-- public_packages.highlights is an ARRAY column with no default, so rows
-- inserted without it came back as NULL, and the SPA did
-- `pkg.highlights.map(...)` -> "Cannot read properties of null (reading 'map')",
-- which (with no ErrorBoundary) white-screened the whole site.
-- Made idempotent so it is safe to re-run.

ALTER TABLE public_packages ALTER COLUMN highlights SET DEFAULT '{}';

UPDATE public_packages
   SET highlights = '{}'
 WHERE highlights IS NULL;
