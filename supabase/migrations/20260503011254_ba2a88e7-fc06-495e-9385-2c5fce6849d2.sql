-- Create notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL); -- NULL user_id for system-wide notifications

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id OR (user_id IS NULL AND auth.uid() IS NOT NULL));

CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true); -- Allow system/edge functions to insert

-- Index for performance
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
