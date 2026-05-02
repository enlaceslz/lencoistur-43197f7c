ALTER TABLE public.bookings ADD COLUMN collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;

-- Create an index for performance
CREATE INDEX idx_bookings_collaborator_id ON public.bookings(collaborator_id);
