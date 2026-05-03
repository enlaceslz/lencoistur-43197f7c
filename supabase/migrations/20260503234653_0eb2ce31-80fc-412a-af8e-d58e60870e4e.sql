-- No specific migration needed if we use the existing 'value' JSONB column in site_settings.
-- However, I should check if the table exists and if I should add a specific entry or just use the UI to update the existing 'site' settings key.

-- Let's check the current site_settings structure.
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'site_settings';
