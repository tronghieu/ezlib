-- =============================================================================
-- EzLib Migration: User Profiles and Preferences
-- =============================================================================
-- Purpose: Create user-related tables extending Supabase auth.users
-- Dependencies: Foundation functions and triggers
-- Migration: 02_users_profiles_and_preferences.sql
-- =============================================================================

-- =============================================================================
-- USER PROFILE TABLES
-- =============================================================================

-- User profiles (public user information)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    location JSONB DEFAULT '{
        "city": null,
        "country": null,
        "timezone": null
    }'::jsonb,
    social_links JSONB DEFAULT '{
        "website": null,
        "goodreads": null,
        "twitter": null,
        "instagram": null
    }'::jsonb,
    reading_stats JSONB DEFAULT '{
        "books_read": 0,
        "reviews_written": 0,
        "favorite_genres": [],
        "reading_goal_yearly": null
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences (private user settings)
CREATE TABLE public.user_preferences (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications JSONB NOT NULL DEFAULT '{
        "email_enabled": true,
        "sms_enabled": false,
        "push_enabled": true,
        "due_date_reminders": true,
        "new_book_alerts": true,
        "social_activity": true
    }'::jsonb,
    privacy JSONB NOT NULL DEFAULT '{
        "profile_visibility": "public",
        "reading_activity": "public",
        "review_visibility": "public",
        "location_sharing": false
    }'::jsonb,
    interface JSONB NOT NULL DEFAULT '{
        "preferred_language": "en",
        "preferred_country": "US",
        "theme": "system",
        "books_per_page": 20,
        "default_view": "grid"
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR USER TABLES
-- =============================================================================

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_display_name ON public.user_profiles(display_name);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on user tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON public.user_profiles
    FOR SELECT USING (true); -- Public profiles visible to all

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON public.user_preferences
    FOR ALL USING (auth.uid() = id);

-- =============================================================================
-- USER PROFILE SYNCHRONIZATION TRIGGERS
-- =============================================================================

-- Function to automatically create user profile from auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to create profile, but don't let errors block user creation
    BEGIN
        INSERT INTO public.user_profiles (
            id,
            email,
            display_name,
            avatar_url
        ) VALUES (
            NEW.id,
            NEW.email,
            COALESCE(
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'full_name',
                split_part(NEW.email, '@', 1)
            ),
            NEW.raw_user_meta_data->>'avatar_url'
        );

        INSERT INTO public.user_preferences (id) VALUES (NEW.id);
    EXCEPTION
        WHEN OTHERS THEN
            -- Log error but don't block user creation
            RAISE LOG 'Failed to create user profile for %: %', NEW.email, SQLERRM;
            -- Don't re-raise - allow user creation to continue
    END;

    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;
set search_path = '';

-- Function to update user profile when auth.users changes
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user profile if relevant fields changed
    IF (OLD.email IS DISTINCT FROM NEW.email) OR
       (OLD.raw_user_meta_data->>'display_name' IS DISTINCT FROM NEW.raw_user_meta_data->>'display_name') OR
       (OLD.raw_user_meta_data->>'full_name' IS DISTINCT FROM NEW.raw_user_meta_data->>'full_name') OR
       (OLD.raw_user_meta_data->>'avatar_url' IS DISTINCT FROM NEW.raw_user_meta_data->>'avatar_url') THEN

        UPDATE public.user_profiles SET
            email = NEW.email,
            display_name = COALESCE(
                NEW.raw_user_meta_data->>'display_name',
                NEW.raw_user_meta_data->>'full_name',
                split_part(NEW.email, '@', 1)
            ),
            avatar_url = NEW.raw_user_meta_data->>'avatar_url',
            updated_at = NOW()
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- Function to handle user profile cleanup on auth user deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Cascade delete will handle user_profiles and user_preferences
    -- but we can add custom cleanup logic here if needed

    -- Log deletion event or perform other cleanup
    -- Example: Archive user data before deletion

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = '';

-- =============================================================================
-- APPLY TRIGGERS
-- =============================================================================

-- Triggers for auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_update();

CREATE TRIGGER on_auth_user_deleted
    AFTER DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_delete();

-- Update timestamp triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE public.user_profiles IS 'Public user profiles extending Supabase auth.users with display information and reading statistics';
COMMENT ON TABLE public.user_preferences IS 'Private user preferences for notifications, privacy, and interface settings';

COMMENT ON COLUMN public.user_profiles.email IS 'Synchronized with auth.users.email, indexed for lookups';
COMMENT ON COLUMN public.user_profiles.display_name IS 'User-facing display name, auto-generated from auth metadata if not provided';
COMMENT ON COLUMN public.user_profiles.reading_stats IS 'Aggregated reading statistics and goals';
COMMENT ON COLUMN public.user_preferences.notifications IS 'Notification preferences for various types of alerts';
COMMENT ON COLUMN public.user_preferences.privacy IS 'Privacy settings controlling visibility of user data';
COMMENT ON COLUMN public.user_preferences.interface IS 'User interface preferences and localization settings';
