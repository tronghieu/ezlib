# Authentication Architecture

EzLib implements passwordless email OTP authentication with cross-domain session management, supporting independent login flows for the Reader app and Library Management app while maintaining unified user identity.

## Authentication Technology Stack

| Component | Technology | Purpose | Configuration |
|-----------|------------|---------|---------------|
| **Auth Provider** | Supabase Auth | Passwordless OTP, user management | Email-only auth, custom SMTP |
| **Session Management** | Supabase Client | JWT tokens, cross-domain support | Custom domain configuration |
| **Email Service** | Supabase SMTP | OTP delivery | Custom branding, templates |
| **Frontend Auth** | @supabase/auth-helpers-nextjs | Next.js auth integration | App Router compatible |

## Cross-Domain Authentication Strategy

```mermaid
graph TB
    User[👤 User] --> ReaderApp[📱 Reader App<br/>ezlib.com]
    User --> LibApp[💼 Library Management<br/>manage.ezlib.com]
    
    ReaderApp --> SupabaseAuth[🔐 Supabase Auth]
    LibApp --> SupabaseAuth
    
    SupabaseAuth --> SharedDB[(🗄️ Shared User Database)]
    
    subgraph "Cross-Domain Session Management"
        SupabaseAuth --> JWT1[JWT Token - ezlib.com]
        SupabaseAuth --> JWT2[JWT Token - manage.ezlib.com]
    end
    
    JWT1 --> RLS1[RLS: Reader Permissions]
    JWT2 --> RLS2[RLS: Reader + LibAdmin Permissions]
```

## Registration and Authentication Flows

### New User Registration (Reader App Only)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Reader App
    participant S as Supabase Auth
    participant DB as Database
    
    U->>R: Visit ezlib.com (first time)
    R->>R: Check authentication status
    R->>U: Show registration form
    U->>R: Enter email address
    R->>S: Request OTP (signUp)
    S->>U: Send 6-digit OTP email
    U->>R: Enter OTP code
    R->>S: Verify OTP + create user
    S->>DB: Create auth.users record
    R->>R: Show profile completion form
    U->>R: Enter: display_name, gender, language, country
    R->>DB: Create users profile record
    R->>R: Complete registration → dashboard
```

### Cross-Domain Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as Library App
    participant S as Supabase Auth
    participant DB as Database
    
    U->>L: Visit manage.ezlib.com
    L->>L: Check authentication
    L->>U: Show login form (email only)
    U->>L: Enter existing email
    L->>S: Request login OTP (signIn)
    S->>U: Send 6-digit OTP email
    U->>L: Enter OTP code
    L->>S: Verify OTP
    S->>L: Return JWT token for manage.ezlib.com
    L->>DB: Check LibAdmin permissions via RLS
    alt Has LibAdmin record
        L->>L: Load library management interface
    else No LibAdmin record
        L->>L: Show "Request Library Access" page
    end
```

## Supabase Authentication Configuration

```typescript
// supabase/config/auth.sql
-- Configure auth settings
UPDATE auth.config SET
  site_url = 'https://ezlib.com',
  uri_allow_list = 'https://ezlib.com,https://manage.ezlib.com',
  jwt_exp = 3600, -- 1 hour tokens
  refresh_token_rotation_enabled = true,
  security_captcha_enabled = false, -- OTP provides security
  external_email_enabled = true,
  external_phone_enabled = false,
  enable_signup = true,
  email_confirm_required = false -- OTP verification handles this
  password_min_length = null; -- No passwords

-- Custom auth hook for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile for users who complete registration
  -- (handled by application, not trigger)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Authentication Middleware

```typescript
// middleware.ts - Next.js middleware for auth protection
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;
  
  // Reader app protection (ezlib.com)
  if (req.nextUrl.hostname === 'ezlib.com') {
    if (pathname.startsWith('/profile') || pathname.startsWith('/borrowing')) {
      if (!session) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }
  }
  
  // Library management protection (manage.ezlib.com)
  if (req.nextUrl.hostname === 'manage.ezlib.com') {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
    // Check LibAdmin permissions
    const { data: adminCheck } = await supabase
      .from('lib_admins')
      .select('id')
      .eq('user_id', session.user.id)
      .single();
    
    if (!adminCheck && !pathname.startsWith('/request-access')) {
      return NextResponse.redirect(new URL('/request-access', req.url));
    }
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Role-Based Access Control Implementation

```typescript
// lib/auth/permissions.ts
export interface UserPermissions {
  isReader: boolean;
  isLibraryAdmin: boolean;
  adminLibraries: string[]; // Library IDs where user is admin
  adminPermissions: Record<string, AdminPermissions>; // Per library
}

export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  const supabase = createClientComponentClient();
  
  // Check library admin status
  const { data: adminRecords } = await supabase
    .from('lib_admins')
    .select(`
      library_id,
      role,
      permissions,
      libraries!inner(name, status)
    `)
    .eq('user_id', userId)
    .eq('libraries.status', 'active');
  
  return {
    isReader: true, // All authenticated users are readers
    isLibraryAdmin: adminRecords.length > 0,
    adminLibraries: adminRecords.map(r => r.library_id),
    adminPermissions: adminRecords.reduce((acc, record) => {
      acc[record.library_id] = record.permissions;
      return acc;
    }, {} as Record<string, AdminPermissions>)
  };
}
```
