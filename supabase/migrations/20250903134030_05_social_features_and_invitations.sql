-- =============================================================================
-- EzLib Migration: Social Features and Invitations
-- =============================================================================
-- Purpose: Create social features, reviews, follows, and invitation system
-- Dependencies: Foundation functions, users, books, and libraries tables
-- Migration: 05_social_features_and_invitations.sql
-- =============================================================================

-- =============================================================================
-- SOCIAL FEATURES TABLES
-- =============================================================================

-- Reviews
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_edition_id UUID NOT NULL REFERENCES public.book_editions(id) ON DELETE CASCADE,
    general_book_id UUID REFERENCES public.general_books(id) ON DELETE SET NULL, -- Denormalized for efficient querying
    reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    language TEXT NOT NULL DEFAULT 'en', -- Review language
    visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    social_metrics JSONB DEFAULT '{
        "like_count": 0,
        "comment_count": 0,
        "borrow_influence_count": 0,
        "share_count": 0
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(book_edition_id, reviewer_id) -- One review per edition per user
);

-- Author follows
CREATE TABLE public.author_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.authors(id) ON DELETE CASCADE,
    notification_preferences JSONB DEFAULT '{
        "new_books": true,
        "news_updates": true,
        "awards": true
    }'::jsonb,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, author_id)
);

-- Social follows (user to user)
CREATE TABLE public.social_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    followed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- =============================================================================
-- INVITATION SYSTEM TABLES
-- =============================================================================

-- Invitations for library staff and members
CREATE TABLE public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    library_id UUID NOT NULL REFERENCES public.libraries(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.library_staff(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'librarian', 'volunteer')),
    invitation_type TEXT NOT NULL CHECK (invitation_type IN ('library_staff', 'library_member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    token TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''), -- Secure invitation token
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    personal_message TEXT,
    metadata JSONB DEFAULT '{}', -- Additional invitation-specific data
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(library_id, email, invitation_type) -- Prevent duplicate pending invitations
);

-- Invitation responses (audit trail)
CREATE TABLE public.invitation_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_id UUID NOT NULL REFERENCES public.invitations(id) ON DELETE CASCADE,
    responder_user_id UUID REFERENCES auth.users(id), -- NULL if not yet registered
    response_type TEXT NOT NULL CHECK (response_type IN ('accepted', 'declined', 'expired')),
    response_date TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    created_library_staff_id UUID REFERENCES public.library_staff(id), -- Created staff record if accepted
    created_library_member_id UUID REFERENCES public.library_members(id) -- Created member record if accepted
);

-- =============================================================================
-- INDEXES FOR SOCIAL FEATURES
-- =============================================================================

-- Review indexes
CREATE INDEX idx_reviews_general_book ON public.reviews(general_book_id, visibility);
CREATE INDEX idx_reviews_edition ON public.reviews(book_edition_id, visibility);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_language ON public.reviews(language);

-- Follow indexes
CREATE INDEX idx_author_follows_user ON public.author_follows(user_id);
CREATE INDEX idx_author_follows_author ON public.author_follows(author_id);
CREATE INDEX idx_social_follows_follower ON public.social_follows(follower_id);
CREATE INDEX idx_social_follows_following ON public.social_follows(following_id);

-- Invitation system indexes
CREATE INDEX idx_invitations_library_status ON public.invitations(library_id, status) WHERE status = 'pending';
CREATE INDEX idx_invitations_token ON public.invitations(token) WHERE status = 'pending';
CREATE INDEX idx_invitations_email_library ON public.invitations(email, library_id, invitation_type);
CREATE INDEX idx_invitations_inviter ON public.invitations(inviter_id, created_at DESC);
CREATE INDEX idx_invitations_expires ON public.invitations(expires_at) WHERE status = 'pending';
CREATE INDEX idx_invitation_responses_invitation ON public.invitation_responses(invitation_id, response_date DESC);
CREATE INDEX idx_invitation_responses_responder ON public.invitation_responses(responder_user_id) WHERE responder_user_id IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on social tables
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_responses ENABLE ROW LEVEL SECURITY;

-- Review policies
CREATE POLICY "Public reviews visible to all" ON public.reviews
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Followers can view follower-only reviews" ON public.reviews
    FOR SELECT USING (
        visibility = 'followers' AND (
            reviewer_id = auth.uid() OR
            reviewer_id IN (
                SELECT following_id FROM public.social_follows
                WHERE follower_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can manage own reviews" ON public.reviews
    FOR ALL USING (reviewer_id = auth.uid());

-- Author follow policies
CREATE POLICY "Users can manage own author follows" ON public.author_follows
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Author follows are public for discovery" ON public.author_follows
    FOR SELECT USING (true);

-- Social follow policies
CREATE POLICY "Users can manage own social follows" ON public.social_follows
    FOR ALL USING (follower_id = auth.uid());

CREATE POLICY "Social follows are public for discovery" ON public.social_follows
    FOR SELECT USING (true);

-- Invitation policies
CREATE POLICY "Staff can view library invitations" ON public.invitations
    FOR SELECT USING (
        public.get_user_role(library_id) IS NOT NULL
    );

CREATE POLICY "Public can view pending invitations by token" ON public.invitations
    FOR SELECT USING (
        status = 'pending' AND expires_at > NOW()
    );

CREATE POLICY "Owners can create invitations" ON public.invitations
    FOR INSERT WITH CHECK (
        public.get_user_role(library_id) = 'owner'
    );

CREATE POLICY "Inviters and owners can edit invitations" ON public.invitations
    FOR UPDATE USING (
        inviter_id IN (SELECT id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
        OR public.get_user_role(library_id) = 'owner'
    );

CREATE POLICY "Inviters can view own invitations" ON public.invitations
    FOR SELECT USING (
        inviter_id IN (SELECT id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
    );

CREATE POLICY "Inviters can delete own invitations" ON public.invitations
    FOR DELETE USING (
        inviter_id IN (SELECT id FROM public.library_staff WHERE user_id = auth.uid() AND is_deleted = FALSE)
        OR public.get_user_role(library_id) IN ('owner', 'manager')
    );

-- Invitation response policies
CREATE POLICY "Staff can view invitation responses" ON public.invitation_responses
    FOR SELECT USING (
        invitation_id IN (
            SELECT id FROM public.invitations
            WHERE public.get_user_role(library_id) IS NOT NULL
        )
    );

CREATE POLICY "Users can view own invitation responses" ON public.invitation_responses
    FOR SELECT USING (
        responder_user_id = auth.uid()
    );

CREATE POLICY "Inviters can view responses to their invitations" ON public.invitation_responses
    FOR SELECT USING (
        invitation_id IN (
            SELECT id FROM public.invitations
            WHERE inviter_id IN (
                SELECT id FROM public.library_staff
                WHERE user_id = auth.uid() AND is_deleted = FALSE
            )
        )
    );

CREATE POLICY "System can create invitation responses" ON public.invitation_responses
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Prohibit invitation response edits" ON public.invitation_responses
    FOR UPDATE USING (false);

CREATE POLICY "Prohibit invitation response deletes" ON public.invitation_responses
    FOR DELETE USING (false);

-- =============================================================================
-- INVITATION SYSTEM FUNCTIONS
-- =============================================================================

-- Function to handle invitation expiration
CREATE OR REPLACE FUNCTION public.handle_invitation_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically expire invitations that have passed their expiry date
    IF NEW.expires_at <= NOW() AND OLD.status = 'pending' THEN
        NEW.status = 'expired';

        -- Create audit trail
        INSERT INTO public.invitation_responses (invitation_id, response_type, notes)
        VALUES (NEW.id, 'expired', 'Automatically expired');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Function to process invitation acceptance
CREATE OR REPLACE FUNCTION public.process_invitation_acceptance(
    invitation_token TEXT,
    accepting_user_id UUID,
    response_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    invitation_record public.invitations%ROWTYPE;
    created_staff_id UUID;
    created_member_id UUID;
    result JSONB;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid or expired invitation token'
        );
    END IF;

    -- Check if user email matches invitation email
    IF NOT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = accepting_user_id
        AND email = invitation_record.email
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Email does not match invitation'
        );
    END IF;

    -- Process based on invitation type
    IF invitation_record.invitation_type = 'library_staff' THEN
        -- Check if staff record already exists
        IF EXISTS (
            SELECT 1 FROM public.library_staff
            WHERE user_id = accepting_user_id
            AND library_id = invitation_record.library_id
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is already a staff member of this library'
            );
        END IF;

        -- Create library staff record
        INSERT INTO public.library_staff (
            user_id,
            library_id,
            role,
            employment_info
        ) VALUES (
            accepting_user_id,
            invitation_record.library_id,
            invitation_record.role,
            jsonb_build_object('hire_date', NOW()::date)
        ) RETURNING id INTO created_staff_id;

    ELSIF invitation_record.invitation_type = 'library_member' THEN
        -- Check if member record already exists
        IF EXISTS (
            SELECT 1 FROM public.library_members
            WHERE user_id = accepting_user_id
            AND library_id = invitation_record.library_id
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'User is already a member of this library'
            );
        END IF;

        -- Create library member record
        INSERT INTO public.library_members (
            user_id,
            library_id,
            member_id,
            personal_info
        ) VALUES (
            accepting_user_id,
            invitation_record.library_id,
            'INV-' || substring(invitation_record.token from 1 for 8),
            jsonb_build_object(
                'first_name', (SELECT display_name FROM public.user_profiles WHERE id = accepting_user_id),
                'email', invitation_record.email
            )
        ) RETURNING id INTO created_member_id;
    END IF;

    -- Update invitation status
    UPDATE public.invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = invitation_record.id;

    -- Create response record
    INSERT INTO public.invitation_responses (
        invitation_id,
        responder_user_id,
        response_type,
        notes,
        created_library_staff_id,
        created_library_member_id
    ) VALUES (
        invitation_record.id,
        accepting_user_id,
        'accepted',
        response_notes,
        created_staff_id,
        created_member_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'invitation_type', invitation_record.invitation_type,
        'library_id', invitation_record.library_id,
        'role', invitation_record.role,
        'created_staff_id', created_staff_id,
        'created_member_id', created_member_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Function to decline invitation
CREATE OR REPLACE FUNCTION public.decline_invitation(
    invitation_token TEXT,
    declining_user_id UUID DEFAULT NULL,
    response_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    invitation_record public.invitations%ROWTYPE;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record
    FROM public.invitations
    WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Update invitation status
    UPDATE public.invitations
    SET status = 'declined', updated_at = NOW()
    WHERE id = invitation_record.id;

    -- Create response record
    INSERT INTO public.invitation_responses (
        invitation_id,
        responder_user_id,
        response_type,
        notes
    ) VALUES (
        invitation_record.id,
        declining_user_id,
        'declined',
        response_notes
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

COMMENT ON FUNCTION public.process_invitation_acceptance(TEXT, UUID, TEXT) IS 'Processes invitation acceptance and creates appropriate library relationships';
COMMENT ON FUNCTION public.decline_invitation(TEXT, UUID, TEXT) IS 'Processes invitation decline and creates audit trail';

-- =============================================================================
-- APPLY TRIGGERS
-- =============================================================================

-- Update timestamp triggers
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Invitation expiration trigger
CREATE TRIGGER invitation_expiration_check
    BEFORE UPDATE ON public.invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invitation_expiration();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.reviews IS 'User reviews and ratings for book editions with social interaction metrics';
COMMENT ON TABLE public.author_follows IS 'User subscriptions to author updates and notifications';
COMMENT ON TABLE public.social_follows IS 'User-to-user following relationships for social features';
COMMENT ON TABLE public.invitations IS 'Invitation system for library staff and member recruitment';
COMMENT ON TABLE public.invitation_responses IS 'Audit trail for invitation acceptances, declines, and expirations';

COMMENT ON COLUMN public.reviews.visibility IS 'Review visibility: public, followers-only, or private';
COMMENT ON COLUMN public.reviews.social_metrics IS 'Engagement metrics for social features';
COMMENT ON COLUMN public.invitations.token IS 'Secure URL-safe token for invitation acceptance';
COMMENT ON COLUMN public.invitations.invitation_type IS 'Type of invitation: staff member or library member';
COMMENT ON COLUMN public.invitation_responses.ip_address IS 'IP address of invitation responder for security';
COMMENT ON COLUMN public.invitation_responses.created_library_staff_id IS 'Reference to created staff record if invitation was accepted';
COMMENT ON COLUMN public.invitation_responses.created_library_member_id IS 'Reference to created member record if invitation was accepted';
