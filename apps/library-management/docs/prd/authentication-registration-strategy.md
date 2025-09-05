# Authentication & Registration Strategy

## Registration Flow (Reader App Only)

**Single Registration Point:** All user registration occurs exclusively on the Reader app (`ezlib.com`) to avoid user confusion and establish clear platform identity. Library staff must first register as readers before gaining access to management tools.

**Passwordless Email OTP Process:**

1. **Email Collection**: Library staff visit `ezlib.com` → enter email address → request verification code
2. **OTP Verification**: 6-digit code sent to email → user enters code for authentication
3. **Profile Setup**: User completes profile with display name, gender, language preference, and region selection
4. **Default Access**: All accounts created as readers with Supabase authenticated role

## Cross-Domain Access Strategy

**Early Stage Implementation:**

- **Independent Login**: Library staff must log in separately on `ezlib.com` and `manage.ezlib.com`
- **Registration Restriction**: Management app shows "Login with existing account" - no registration option
- **Clear Messaging**: Management app explains users must first register on main platform

**Role-Based Access Control:**

- **Default Role**: All users can access reader features (social book discovery) with authenticated role
- **Library Management Access**: Users gain admin capabilities when added to library_staff table for specific libraries
- **Permission Levels**: Owner, Manager, Librarian roles with granular permissions for each library

**Future Enhancement:** Planned implementation of cross-domain session sharing for seamless user experience between applications.

## Technical Implementation

**Supabase Authentication:**

- Email OTP authentication using `supabase.auth.signInWithOtp()`
- JWT tokens with role-based claims
- Row Level Security policies enforcing multi-tenant access

**User Profile Structure:**

- Base user record in `users` table
- Optional `library_members` records for library memberships
- Optional `library_staff` records for management access
- Preference storage for language, region, notification settings
