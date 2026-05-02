-- Add avatar_url column to collaborators table
ALTER TABLE public.collaborators 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Ensure storage bucket exists for avatars (if not already there)
-- Note: This might already be in another migration, but adding it here for completeness
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Policies for storage should be handled globally or in a separate storage migration
-- but usually, we want:
-- CREATE POLICY "Avatars are public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
