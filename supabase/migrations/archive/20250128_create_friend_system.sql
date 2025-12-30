-- Create friend_invitations table for tracking friend requests
CREATE TABLE IF NOT EXISTS public.friend_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_email TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    
    -- Prevent duplicate invitations
    CONSTRAINT unique_invitation UNIQUE(sender_email, recipient_email),
    
    -- Prevent self-invitations
    CONSTRAINT no_self_invitation CHECK (sender_email != recipient_email)
);

-- Create friendships table for active friendships
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_email TEXT NOT NULL,
    user2_email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure user1 < user2 alphabetically to prevent duplicates
    CONSTRAINT user_order CHECK (user1_email < user2_email),
    CONSTRAINT unique_friendship UNIQUE(user1_email, user2_email)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friend_invitations_sender ON public.friend_invitations(sender_email);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_recipient ON public.friend_invitations(recipient_email);
CREATE INDEX IF NOT EXISTS idx_friend_invitations_status ON public.friend_invitations(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user1 ON public.friendships(user1_email);
CREATE INDEX IF NOT EXISTS idx_friendships_user2 ON public.friendships(user2_email);

-- Enable RLS
ALTER TABLE public.friend_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_invitations
-- Users can view invitations they sent or received
CREATE POLICY "Users can view their invitations"
    ON public.friend_invitations
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = sender_email 
        OR auth.jwt() ->> 'email' = recipient_email
    );

-- Users can create invitations
CREATE POLICY "Users can send invitations"
    ON public.friend_invitations
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'email' = sender_email);

-- Users can update invitations they received (accept/reject)
CREATE POLICY "Recipients can update invitations"
    ON public.friend_invitations
    FOR UPDATE
    USING (auth.jwt() ->> 'email' = recipient_email)
    WITH CHECK (auth.jwt() ->> 'email' = recipient_email);

-- RLS Policies for friendships
-- Users can view friendships they are part of
CREATE POLICY "Users can view their friendships"
    ON public.friendships
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = user1_email 
        OR auth.jwt() ->> 'email' = user2_email
    );

-- Only system can create friendships (via accept invitation)
CREATE POLICY "System can create friendships"
    ON public.friendships
    FOR INSERT
    WITH CHECK (true);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships"
    ON public.friendships
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' = user1_email 
        OR auth.jwt() ->> 'email' = user2_email
    );

-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(email1 TEXT, email2 TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_a TEXT;
    user_b TEXT;
BEGIN
    -- Order emails alphabetically
    IF email1 < email2 THEN
        user_a := email1;
        user_b := email2;
    ELSE
        user_a := email2;
        user_b := email1;
    END IF;
    
    -- Check if friendship exists
    RETURN EXISTS (
        SELECT 1 FROM public.friendships
        WHERE user1_email = user_a AND user2_email = user_b
    );
END;
$$;

-- Function to get pending invitations for a user
CREATE OR REPLACE FUNCTION public.get_pending_invitations(user_email TEXT)
RETURNS TABLE (
    id UUID,
    sender_email TEXT,
    sender_name TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fi.id,
        fi.sender_email,
        u.name as sender_name,
        fi.message,
        fi.created_at
    FROM public.friend_invitations fi
    LEFT JOIN public.users u ON fi.sender_email = u.email
    WHERE fi.recipient_email = user_email
    AND fi.status = 'pending'
    ORDER BY fi.created_at DESC;
END;
$$;

-- Function to get user's friends
CREATE OR REPLACE FUNCTION public.get_friends(user_email TEXT)
RETURNS TABLE (
    friend_email TEXT,
    friend_name TEXT,
    friendship_created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN f.user1_email = user_email THEN f.user2_email
            ELSE f.user1_email
        END as friend_email,
        u.name as friend_name,
        f.created_at as friendship_created_at
    FROM public.friendships f
    LEFT JOIN public.users u ON (
        CASE 
            WHEN f.user1_email = user_email THEN f.user2_email
            ELSE f.user1_email
        END = u.email
    )
    WHERE f.user1_email = user_email OR f.user2_email = user_email
    ORDER BY f.created_at DESC;
END;
$$;
