# English/Vietnamese Internationalization Implementation Plan

<!-- Powered by BMAD™ Core -->

## Executive Summary

This document provides a comprehensive technical implementation plan for adding English and Vietnamese internationalization (i18n) support to the Library Management System. The plan leverages `next-intl` for type-safe, performance-optimized internationalization that integrates seamlessly with Next.js 15 App Router architecture, using a **cookie-based locale management approach without URL routing**.

## Technical Architecture Overview

### Selected i18n Solution: next-intl v4+

**Rationale:**

- **Next.js 15 Compatibility**: Full App Router support with Server Components
- **Type Safety**: Generated TypeScript types for translations
- **Performance**: Built-in optimization with static rendering support
- **Developer Experience**: Intuitive API with comprehensive documentation
- **Maintenance**: Active development with strong community support

### Implementation Strategy: Without i18n Routing (Cookie-Based)

**Selected Approach:** Cookie and user preference-based locale management (no URL prefixes)

**Benefits:**

- **Clean URLs**: No `/en/` or `/vi/` prefixes cluttering the URL structure
- **User Preference Persistence**: Language choice saved in cookies and database
- **Simplified Routing**: No need for locale segments in routes
- **Better for Admin Apps**: Ideal for authenticated applications where SEO is not a priority
- **Seamless Language Switching**: No URL changes when switching languages

## Phase 1: Foundation Setup (Week 1-2)

### 1.1 Package Installation and Configuration

```bash
# Install next-intl
pnpm add next-intl@latest

# Development dependencies for translation management
pnpm add -D @types/intl-locale
```

### 1.2 Project Structure Implementation

```
src/
├── i18n/
│   ├── config.ts               # i18n configuration (locales, default)
│   ├── request.ts              # Server-side i18n config
│   └── locale.ts               # Locale management utilities
├── messages/
│   ├── en.json                 # English translations
│   ├── vi.json                 # Vietnamese translations
│   └── index.ts                # Message type exports
├── app/
│   ├── layout.tsx              # Root layout with i18n provider
│   ├── page.tsx               # Homepage
│   ├── dashboard/             # Dashboard routes
│   ├── inventory/             # Book management
│   ├── members/               # Member management
│   ├── settings/              # Library configuration
│   └── api/
│       └── locale/            # API route for locale switching
│           └── route.ts
└── lib/
    └── locale-cookie.ts        # Cookie management utilities
```

### 1.3 Core Configuration Files

#### `src/i18n/config.ts`

```typescript
export const locales = ["en", "vi"] as const;
export const defaultLocale = "en" as const;

export type Locale = (typeof locales)[number];

// Cookie configuration
export const LOCALE_COOKIE_NAME = "library-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
```

#### `src/i18n/request.ts`

```typescript
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales, defaultLocale, LOCALE_COOKIE_NAME } from "./config";
import { getUserLocalePreference } from "@/lib/supabase/user-preferences";

export default getRequestConfig(async () => {
  // Get locale from cookie or user preference
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  // Optionally get user preference from database
  // const userLocale = await getUserLocalePreference();

  // Determine final locale
  let locale = cookieLocale || defaultLocale;

  // Validate locale
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,

    // Format configurations
    formats: {
      dateTime: {
        short: {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
        long: {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        },
      },
      number: {
        currency: {
          style: "currency",
          currency: locale === "vi" ? "VND" : "USD",
        },
      },
    },

    // Timezone configuration
    timeZone: locale === "vi" ? "Asia/Ho_Chi_Minh" : "UTC",
  };
});
```

#### `src/lib/locale-cookie.ts`

```typescript
import { cookies } from "next/headers";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE,
  Locale,
} from "@/i18n/config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const locale = cookieStore.get(LOCALE_COOKIE_NAME)?.value as Locale;
  return locale || "en";
}

export async function setLocale(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE_NAME, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
```

#### `next.config.ts`

```typescript
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Existing configuration preserved
};

// Wrap with next-intl plugin (no routing)
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
```

#### `src/app/api/locale/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { setLocale } from "@/lib/locale-cookie";
import { locales, Locale } from "@/i18n/config";
import { updateUserLocalePreference } from "@/lib/supabase/user-preferences";

export async function POST(request: NextRequest) {
  const { locale, userId } = await request.json();

  // Validate locale
  if (!locales.includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  // Set cookie
  await setLocale(locale as Locale);

  // Optionally update user preference in database
  if (userId) {
    try {
      await updateUserLocalePreference(userId, locale);
    } catch (error) {
      console.error("Failed to update user locale preference:", error);
    }
  }

  return NextResponse.json({ success: true });
}
```

### 1.4 App Router Layout Updates

#### `src/app/layout.tsx`

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({
  children
}: RootLayoutProps) {
  // Get locale from cookie/preference
  const locale = await getLocale();

  // Get messages for the current locale
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
        >
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Phase 2: Core Translation Infrastructure (Week 2-3)

### 2.1 Message Structure Design

#### `src/messages/en.json`

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "search": "Search",
    "filter": "Filter",
    "reset": "Reset",
    "back": "Back",
    "next": "Next",
    "previous": "Previous"
  },

  "navigation": {
    "dashboard": "Dashboard",
    "inventory": "Inventory",
    "members": "Members",
    "circulation": "Circulation",
    "reports": "Reports",
    "settings": "Settings",
    "logout": "Logout"
  },

  "dashboard": {
    "title": "Library Dashboard",
    "welcomeMessage": "Welcome to {libraryName}",
    "statistics": {
      "totalBooks": "Total Books",
      "availableBooks": "Available Books",
      "checkedOutBooks": "Checked Out",
      "totalMembers": "Total Members",
      "activeMembers": "Active Members",
      "overdueItems": "Overdue Items"
    },
    "quickActions": {
      "addBook": "Add Book",
      "addMember": "Add Member",
      "checkOut": "Check Out",
      "checkIn": "Check In"
    },
    "recentActivity": {
      "title": "Recent Activity",
      "checkOut": "{memberName} checked out {bookTitle}",
      "checkIn": "{memberName} returned {bookTitle}",
      "newMember": "New member registered: {memberName}",
      "newBook": "New book added: {bookTitle}"
    }
  },

  "inventory": {
    "title": "Book Inventory",
    "addBook": "Add New Book",
    "searchPlaceholder": "Search books by title, author, or ISBN...",
    "filters": {
      "status": "Status",
      "available": "Available",
      "checkedOut": "Checked Out",
      "maintenance": "Maintenance"
    },
    "columns": {
      "title": "Title",
      "author": "Author",
      "isbn": "ISBN",
      "status": "Status",
      "location": "Location",
      "actions": "Actions"
    },
    "addBookForm": {
      "title": "Add New Book",
      "isbn": "ISBN (optional)",
      "manualEntry": "Manual Entry",
      "bookTitle": "Book Title",
      "author": "Author",
      "publisher": "Publisher",
      "publishYear": "Publication Year",
      "description": "Description",
      "location": "Shelf Location",
      "submit": "Add Book",
      "isbnLookup": "Look up by ISBN",
      "validation": {
        "titleRequired": "Book title is required",
        "authorRequired": "Author name is required",
        "invalidIsbn": "Please enter a valid 13-digit ISBN"
      }
    }
  },

  "members": {
    "title": "Library Members",
    "addMember": "Add New Member",
    "searchPlaceholder": "Search members by name or email...",
    "columns": {
      "memberId": "Member ID",
      "name": "Name",
      "email": "Email",
      "joinDate": "Join Date",
      "status": "Status",
      "currentBooks": "Current Books",
      "actions": "Actions"
    },
    "addMemberForm": {
      "title": "Register New Member",
      "firstName": "First Name",
      "lastName": "Last Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "address": "Address",
      "submit": "Register Member",
      "validation": {
        "firstNameRequired": "First name is required",
        "lastNameRequired": "Last name is required",
        "emailRequired": "Email address is required",
        "emailInvalid": "Please enter a valid email address"
      }
    },
    "profile": {
      "currentCheckouts": "Current Checkouts",
      "borrowingHistory": "Borrowing History",
      "contactInfo": "Contact Information",
      "memberSince": "Member since {date}",
      "totalBorrows": "{count} books borrowed",
      "noCurrentCheckouts": "No books currently checked out",
      "noBorrowingHistory": "No borrowing history"
    }
  },

  "circulation": {
    "title": "Circulation",
    "checkOut": "Check Out",
    "checkIn": "Check In",
    "memberLookup": "Member Lookup",
    "bookLookup": "Book Lookup",
    "scanBarcode": "Scan Barcode",
    "enterManually": "Enter Manually",
    "checkOutForm": {
      "selectMember": "Select Member",
      "selectBook": "Select Book",
      "dueDate": "Due Date",
      "notes": "Notes (optional)",
      "confirm": "Confirm Check Out"
    },
    "checkInForm": {
      "scanBook": "Scan Book Barcode",
      "condition": "Book Condition",
      "conditionGood": "Good",
      "conditionDamaged": "Damaged",
      "conditionLost": "Lost",
      "notes": "Notes (optional)",
      "confirm": "Confirm Check In"
    },
    "messages": {
      "checkOutSuccess": "Book successfully checked out to {memberName}",
      "checkInSuccess": "Book successfully returned by {memberName}",
      "memberNotFound": "Member not found",
      "bookNotFound": "Book not found",
      "bookNotAvailable": "Book is not available for checkout",
      "memberHasOverdue": "Member has overdue items"
    }
  },

  "auth": {
    "signIn": "Sign In",
    "signOut": "Sign Out",
    "email": "Email Address",
    "otpCode": "Verification Code",
    "sendCode": "Send Code",
    "verifyCode": "Verify Code",
    "signInInstructions": "Enter your email to receive a verification code",
    "otpInstructions": "Enter the 6-digit code sent to your email",
    "invalidEmail": "Please enter a valid email address",
    "invalidOtp": "Please enter a valid 6-digit code",
    "signInError": "Sign in failed. Please try again.",
    "otpSent": "Verification code sent to {email}",
    "resendCode": "Resend Code"
  },

  "errors": {
    "general": "An error occurred. Please try again.",
    "network": "Network error. Please check your connection.",
    "unauthorized": "You don't have permission to access this resource.",
    "notFound": "The requested resource was not found.",
    "validation": "Please check the form for errors.",
    "database": "Database error. Please contact support."
  }
}
```

#### `src/messages/vi.json`

```json
{
  "common": {
    "loading": "Đang tải...",
    "error": "Lỗi",
    "success": "Thành công",
    "cancel": "Hủy",
    "confirm": "Xác nhận",
    "save": "Lưu",
    "delete": "Xóa",
    "edit": "Chỉnh sửa",
    "search": "Tìm kiếm",
    "filter": "Lọc",
    "reset": "Đặt lại",
    "back": "Quay lại",
    "next": "Tiếp theo",
    "previous": "Trước đó"
  },

  "navigation": {
    "dashboard": "Bảng điều khiển",
    "inventory": "Kho sách",
    "members": "Thành viên",
    "circulation": "Lưu thông",
    "reports": "Báo cáo",
    "settings": "Cài đặt",
    "logout": "Đăng xuất"
  },

  "dashboard": {
    "title": "Bảng điều khiển thư viện",
    "welcomeMessage": "Chào mừng đến với {libraryName}",
    "statistics": {
      "totalBooks": "Tổng số sách",
      "availableBooks": "Sách có sẵn",
      "checkedOutBooks": "Đã cho mượn",
      "totalMembers": "Tổng thành viên",
      "activeMembers": "Thành viên hoạt động",
      "overdueItems": "Sách quá hạn"
    },
    "quickActions": {
      "addBook": "Thêm sách",
      "addMember": "Thêm thành viên",
      "checkOut": "Cho mượn",
      "checkIn": "Trả sách"
    },
    "recentActivity": {
      "title": "Hoạt động gần đây",
      "checkOut": "{memberName} đã mượn {bookTitle}",
      "checkIn": "{memberName} đã trả {bookTitle}",
      "newMember": "Thành viên mới đăng ký: {memberName}",
      "newBook": "Sách mới được thêm: {bookTitle}"
    }
  },

  "inventory": {
    "title": "Kho sách",
    "addBook": "Thêm sách mới",
    "searchPlaceholder": "Tìm kiếm sách theo tên, tác giả hoặc ISBN...",
    "filters": {
      "status": "Trạng thái",
      "available": "Có sẵn",
      "checkedOut": "Đã cho mượn",
      "maintenance": "Bảo trì"
    },
    "columns": {
      "title": "Tên sách",
      "author": "Tác giả",
      "isbn": "ISBN",
      "status": "Trạng thái",
      "location": "Vị trí",
      "actions": "Thao tác"
    },
    "addBookForm": {
      "title": "Thêm sách mới",
      "isbn": "ISBN (tùy chọn)",
      "manualEntry": "Nhập thủ công",
      "bookTitle": "Tên sách",
      "author": "Tác giả",
      "publisher": "Nhà xuất bản",
      "publishYear": "Năm xuất bản",
      "description": "Mô tả",
      "location": "Vị trí kệ sách",
      "submit": "Thêm sách",
      "isbnLookup": "Tra cứu theo ISBN",
      "validation": {
        "titleRequired": "Tên sách là bắt buộc",
        "authorRequired": "Tên tác giả là bắt buộc",
        "invalidIsbn": "Vui lòng nhập ISBN hợp lệ gồm 13 chữ số"
      }
    }
  },

  "members": {
    "title": "Thành viên thư viện",
    "addMember": "Thêm thành viên mới",
    "searchPlaceholder": "Tìm kiếm thành viên theo tên hoặc email...",
    "columns": {
      "memberId": "Mã thành viên",
      "name": "Họ tên",
      "email": "Email",
      "joinDate": "Ngày tham gia",
      "status": "Trạng thái",
      "currentBooks": "Sách đang mượn",
      "actions": "Thao tác"
    },
    "addMemberForm": {
      "title": "Đăng ký thành viên mới",
      "firstName": "Tên",
      "lastName": "Họ",
      "email": "Địa chỉ Email",
      "phone": "Số điện thoại",
      "address": "Địa chỉ",
      "submit": "Đăng ký thành viên",
      "validation": {
        "firstNameRequired": "Tên là bắt buộc",
        "lastNameRequired": "Họ là bắt buộc",
        "emailRequired": "Địa chỉ email là bắt buộc",
        "emailInvalid": "Vui lòng nhập địa chỉ email hợp lệ"
      }
    },
    "profile": {
      "currentCheckouts": "Sách đang mượn",
      "borrowingHistory": "Lịch sử mượn sách",
      "contactInfo": "Thông tin liên hệ",
      "memberSince": "Thành viên từ {date}",
      "totalBorrows": "Đã mượn {count} cuốn sách",
      "noCurrentCheckouts": "Hiện không mượn sách nào",
      "noBorrowingHistory": "Chưa có lịch sử mượn sách"
    }
  },

  "circulation": {
    "title": "Lưu thông sách",
    "checkOut": "Cho mượn",
    "checkIn": "Trả sách",
    "memberLookup": "Tra cứu thành viên",
    "bookLookup": "Tra cứu sách",
    "scanBarcode": "Quét mã vạch",
    "enterManually": "Nhập thủ công",
    "checkOutForm": {
      "selectMember": "Chọn thành viên",
      "selectBook": "Chọn sách",
      "dueDate": "Ngày hạn trả",
      "notes": "Ghi chú (tùy chọn)",
      "confirm": "Xác nhận cho mượn"
    },
    "checkInForm": {
      "scanBook": "Quét mã vạch sách",
      "condition": "Tình trạng sách",
      "conditionGood": "Tốt",
      "conditionDamaged": "Hư hỏng",
      "conditionLost": "Mất",
      "notes": "Ghi chú (tùy chọn)",
      "confirm": "Xác nhận trả sách"
    },
    "messages": {
      "checkOutSuccess": "Đã cho {memberName} mượn sách thành công",
      "checkInSuccess": "{memberName} đã trả sách thành công",
      "memberNotFound": "Không tìm thấy thành viên",
      "bookNotFound": "Không tìm thấy sách",
      "bookNotAvailable": "Sách không có sẵn để cho mượn",
      "memberHasOverdue": "Thành viên có sách quá hạn"
    }
  },

  "auth": {
    "signIn": "Đăng nhập",
    "signOut": "Đăng xuất",
    "email": "Địa chỉ Email",
    "otpCode": "Mã xác thực",
    "sendCode": "Gửi mã",
    "verifyCode": "Xác thực mã",
    "signInInstructions": "Nhập email để nhận mã xác thực",
    "otpInstructions": "Nhập mã 6 chữ số đã gửi đến email của bạn",
    "invalidEmail": "Vui lòng nhập địa chỉ email hợp lệ",
    "invalidOtp": "Vui lòng nhập mã 6 chữ số hợp lệ",
    "signInError": "Đăng nhập thất bại. Vui lòng thử lại.",
    "otpSent": "Đã gửi mã xác thực đến {email}",
    "resendCode": "Gửi lại mã"
  },

  "errors": {
    "general": "Đã xảy ra lỗi. Vui lòng thử lại.",
    "network": "Lỗi mạng. Vui lòng kiểm tra kết nối internet.",
    "unauthorized": "Bạn không có quyền truy cập tài nguyên này.",
    "notFound": "Không tìm thấy tài nguyên được yêu cầu.",
    "validation": "Vui lòng kiểm tra lại thông tin trong form.",
    "database": "Lỗi cơ sở dữ liệu. Vui lòng liên hệ bộ phận hỗ trợ."
  }
}
```

### 2.2 TypeScript Integration

#### `src/messages/index.ts`

```typescript
import en from "./en.json";
import vi from "./vi.json";

export const messages = {
  en,
  vi,
};

export type Messages = typeof en;
export type LocaleMessages = typeof messages;

// Type augmentation for next-intl
declare global {
  interface IntlMessages extends Messages {}
}
```

#### Global type declaration `src/types/global.d.ts`

```typescript
import { routing } from "@/i18n/routing";
import { formats } from "@/i18n/request";
import en from "@/messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof en;
    Formats: typeof formats;
  }
}
```

## Phase 3: Component Integration (Week 3-4)

### 3.1 Navigation Components

#### `src/components/navigation/language-switcher.tsx`

```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Globe, Loader2 } from 'lucide-react';
import { locales } from '@/i18n/config';
import { useToast } from '@/components/ui/use-toast';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('common');
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = async (newLocale: string) => {
    startTransition(async () => {
      try {
        // Call API to set cookie and update user preference
        const response = await fetch('/api/locale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            locale: newLocale,
            // Include userId if available from auth context
            // userId: user?.id
          })
        });

        if (!response.ok) {
          throw new Error('Failed to change language');
        }

        // Refresh the page to apply new locale
        router.refresh();

        toast({
          title: t('languageChanged'),
          description: t('languageChangedDescription'),
        });
      } catch (error) {
        toast({
          title: t('error'),
          description: t('languageChangeFailed'),
          variant: 'destructive'
        });
      }
    });
  };

  const languages = {
    en: 'English',
    vi: 'Tiếng Việt'
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          {languages[locale as keyof typeof languages]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => handleLocaleChange(lng)}
            className={locale === lng ? 'bg-accent' : ''}
            disabled={isPending}
          >
            {languages[lng as keyof typeof languages]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### `src/components/navigation/main-nav.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard', key: 'dashboard' },
  { href: '/inventory', key: 'inventory' },
  { href: '/members', key: 'members' },
  { href: '/circulation', key: 'circulation' },
  { href: '/reports', key: 'reports' },
  { href: '/settings', key: 'settings' }
];

export function MainNav() {
  const t = useTranslations('navigation');
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary',
            pathname === item.href
              ? 'text-foreground'
              : 'text-muted-foreground'
          )}
        >
          {t(item.key)}
        </Link>
      ))}
    </nav>
  );
}
```

### 3.2 Form Components

#### `src/components/forms/add-book-form.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AddBookFormProps {
  onSubmit: (data: AddBookFormData) => Promise<void>;
}

// Create schema factory for localized validation
function createAddBookSchema(t: any) {
  return z.object({
    isbn: z.string()
      .regex(/^\d{13}$/, t('validation.invalidIsbn'))
      .optional()
      .or(z.literal('')),
    title: z.string()
      .min(1, t('validation.titleRequired')),
    author: z.string()
      .min(1, t('validation.authorRequired')),
    publisher: z.string().optional(),
    publishYear: z.coerce.number().optional(),
    description: z.string().optional(),
    location: z.string().optional()
  });
}

export function AddBookForm({ onSubmit }: AddBookFormProps) {
  const t = useTranslations('inventory.addBookForm');

  // Create localized schema
  const schema = createAddBookSchema(t);
  type AddBookFormData = z.infer<typeof schema>;

  const form = useForm<AddBookFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      isbn: '',
      title: '',
      author: '',
      publisher: '',
      publishYear: undefined,
      description: '',
      location: ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="isbn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('isbn')}</FormLabel>
              <FormControl>
                <Input placeholder="9781234567890" {...field} />
              </FormControl>
              <FormDescription>
                {t('isbnLookup')}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('bookTitle')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('author')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="publisher"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('publisher')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publishYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('publishYear')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('location')}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {t('submit')}
        </Button>
      </form>
    </Form>
  );
}
```

### 3.3 Data Display Components

#### `src/components/dashboard/statistics-card.tsx`

```typescript
'use client';

import { useTranslations, useFormatter } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsCardProps {
  type: 'totalBooks' | 'availableBooks' | 'checkedOutBooks' |
        'totalMembers' | 'activeMembers' | 'overdueItems';
  value: number;
  icon: React.ReactNode;
}

export function StatisticsCard({ type, value, icon }: StatisticsCardProps) {
  const t = useTranslations('dashboard.statistics');
  const format = useFormatter();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {t(type)}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {format.number(value)}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Phase 4: Advanced Features (Week 4-5)

### 4.1 Date and Number Formatting

#### `src/lib/i18n/formatters.ts`

```typescript
import { useFormatter } from "next-intl";

export function useLibraryFormatters() {
  const format = useFormatter();

  return {
    // Date formatting
    formatDate: (date: Date) => format.dateTime(date, "short"),
    formatDateTime: (date: Date) => format.dateTime(date, "long"),

    // Number formatting
    formatNumber: (num: number) => format.number(num),
    formatCurrency: (amount: number) => format.number(amount, "currency"),

    // Library-specific formats
    formatMemberId: (id: string) => `#${id}`,
    formatIsbn: (isbn: string) =>
      isbn.replace(/(\d{3})(\d{1})(\d{3})(\d{3})(\d{3})/, "$1-$2-$3-$4-$5"),

    // Relative time for activity feeds
    formatRelativeTime: (date: Date) => format.relativeTime(date),
  };
}
```

### 4.2 Error Handling

#### `src/components/error/error-boundary.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const t = useTranslations('errors');

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>{t('general')}</CardTitle>
          <CardDescription>
            {error.message || t('general')}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={reset} variant="outline">
            {t('common.tryAgain')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 4.3 Loading States

#### `src/components/ui/loading-skeleton.tsx`

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSkeletonProps {
  type: 'table' | 'card' | 'form' | 'dashboard';
  count?: number;
}

export function LoadingSkeleton({ type, count = 1 }: LoadingSkeletonProps) {
  const t = useTranslations('common');

  const renderTableSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-pulse">
      <div className="sr-only">{t('loading')}</div>
      {type === 'table' && renderTableSkeleton()}
      {type === 'card' && renderCardSkeleton()}
      {type === 'form' && renderFormSkeleton()}
      {type === 'dashboard' && renderDashboardSkeleton()}
    </div>
  );
}
```

## Phase 5: Database Integration (Week 5-6)

### 5.1 User Locale Preferences

#### Database Migration

```sql
-- Add language preference to user profiles
ALTER TABLE profiles
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en';

-- Add indexes for performance
CREATE INDEX idx_profiles_preferred_language ON profiles(preferred_language);

-- Update RLS policies to include language preference
```

#### `src/lib/supabase/user-preferences.ts`

```typescript
import { createClient } from "@/lib/supabase/client";
import { routing } from "@/i18n/routing";

export async function getUserLocalePreference(userId: string): Promise<string> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", userId)
    .single();

  if (error || !data?.preferred_language) {
    return routing.defaultLocale;
  }

  // Validate that the preferred language is supported
  if (routing.locales.includes(data.preferred_language as any)) {
    return data.preferred_language;
  }

  return routing.defaultLocale;
}

export async function updateUserLocalePreference(
  userId: string,
  locale: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ preferred_language: locale })
    .eq("id", userId);

  if (error) {
    throw new Error("Failed to update language preference");
  }
}
```

### 5.2 Localized Data Storage

#### Library Configuration

```sql
-- Add localized library information
ALTER TABLE libraries
ADD COLUMN localized_info JSONB DEFAULT '{}';

-- Example structure:
-- {
--   "name": {
--     "en": "Central Public Library",
--     "vi": "Thư viện Công cộng Trung tâm"
--   },
--   "description": {
--     "en": "Serving the community since 1950",
--     "vi": "Phục vụ cộng đồng từ năm 1950"
--   }
-- }
```

#### `src/lib/supabase/localized-data.ts`

```typescript
import { createClient } from "@/lib/supabase/client";

export interface LocalizedLibraryData {
  name: Record<string, string>;
  description?: Record<string, string>;
  policies?: Record<string, string>;
}

export async function getLocalizedLibraryInfo(
  libraryId: string,
  locale: string
): Promise<LocalizedLibraryData | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("libraries")
    .select("name, localized_info")
    .eq("id", libraryId)
    .single();

  if (error || !data) {
    return null;
  }

  const localizedInfo = data.localized_info || {};

  return {
    name: {
      [locale]: localizedInfo.name?.[locale] || data.name,
      ...localizedInfo.name,
    },
    description: localizedInfo.description,
    policies: localizedInfo.policies,
  };
}
```

## Phase 6: Performance Optimization (Week 6-7)

### 6.1 Dynamic Rendering with Cookie-Based Locale

#### `src/app/page.tsx`

```typescript
import { getTranslations, getLocale } from 'next-intl/server';

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return {
    title: t('title'),
    description: t('welcomeMessage', { libraryName: 'Library System' })
  };
}

export default async function HomePage() {
  // Get translations for the current locale
  const t = await getTranslations('dashboard');
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">
        {t('welcomeMessage', { libraryName: 'Library System' })}
      </p>
      {/* Rest of component */}
    </div>
  );
}
```

### 6.2 Translation Bundle Splitting

#### `src/lib/i18n/lazy-translations.ts`

```typescript
import { useTranslations } from 'next-intl';
import { lazy, Suspense } from 'react';

// Create lazy-loaded translation bundles for large sections
const LazyInventoryTranslations = lazy(() =>
  import('@/messages/inventory').then(module => ({
    default: module.InventoryTranslations
  }))
);

const LazyMemberTranslations = lazy(() =>
  import('@/messages/members').then(module => ({
    default: module.MemberTranslations
  }))
);

export function LazyTranslationProvider({
  section,
  children
}: {
  section: 'inventory' | 'members';
  children: React.ReactNode;
}) {
  const TranslationComponent = section === 'inventory'
    ? LazyInventoryTranslations
    : LazyMemberTranslations;

  return (
    <Suspense fallback={<div>Loading translations...</div>}>
      <TranslationComponent>
        {children}
      </TranslationComponent>
    </Suspense>
  );
}
```

### 6.3 Cache Optimization

#### `src/lib/i18n/cache-config.ts`

```typescript
import { unstable_cache } from "next/cache";

// Cache translated content for better performance
export const getCachedTranslations = unstable_cache(
  async (locale: string, namespace: string) => {
    const messages = await import(`../../messages/${locale}.json`);
    return messages.default[namespace];
  },
  ["translations"],
  {
    tags: ["translations"],
    revalidate: 3600, // 1 hour cache
  }
);

// Cache user locale preferences
export const getCachedUserLocale = unstable_cache(
  async (userId: string) => {
    // Implementation for fetching user locale
    return "en"; // placeholder
  },
  ["user-locale"],
  {
    tags: ["user-locale"],
    revalidate: 300, // 5 minutes cache
  }
);
```

## Phase 7: Testing & Quality Assurance (Week 7-8)

### 7.1 i18n Testing Strategy

#### `src/__tests__/i18n/translations.test.ts`

```typescript
import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

describe("Translation consistency", () => {
  it("should have matching keys in all locales", () => {
    const enKeys = getAllKeys(en);
    const viKeys = getAllKeys(vi);

    expect(viKeys).toEqual(enKeys);
  });

  it("should not have empty translation values", () => {
    const enEmpty = findEmptyValues(en);
    const viEmpty = findEmptyValues(vi);

    expect(enEmpty).toEqual([]);
    expect(viEmpty).toEqual([]);
  });

  it("should have proper interpolation syntax", () => {
    const enInterpolations = findInterpolations(en);
    const viInterpolations = findInterpolations(vi);

    enInterpolations.forEach((key) => {
      expect(viInterpolations).toContain(key);
    });
  });
});

function getAllKeys(obj: any, prefix = ""): string[] {
  let keys: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

function findEmptyValues(obj: any, prefix = ""): string[] {
  const empty: string[] = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "object" && obj[key] !== null) {
      empty.push(...findEmptyValues(obj[key], fullKey));
    } else if (!obj[key] || obj[key].trim() === "") {
      empty.push(fullKey);
    }
  }

  return empty;
}

function findInterpolations(obj: any): string[] {
  const interpolations: string[] = [];

  const traverse = (current: any, path = "") => {
    for (const key in current) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof current[key] === "object") {
        traverse(current[key], currentPath);
      } else if (typeof current[key] === "string") {
        const matches = current[key].match(/\{[^}]+\}/g);
        if (matches) {
          interpolations.push(currentPath);
        }
      }
    }
  };

  traverse(obj);
  return interpolations;
}
```

#### `src/__tests__/components/language-switcher.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { LanguageSwitcher } from '@/components/navigation/language-switcher';

const mockMessages = {
  common: {
    language: 'Language'
  }
};

const mockRouter = {
  push: vi.fn()
};

vi.mock('@/i18n/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => mockRouter
}));

describe('LanguageSwitcher', () => {
  it('should render language options', () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('should switch locale when option is selected', () => {
    render(
      <NextIntlClientProvider locale="en" messages={mockMessages}>
        <LanguageSwitcher />
      </NextIntlClientProvider>
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Tiếng Việt'));

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard', { locale: 'vi' });
  });
});
```

### 7.2 E2E Testing with Playwright

#### `tests/e2e/i18n.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Internationalization", () => {
  test("should display English content by default", async ({ page }) => {
    await page.goto("/en/dashboard");

    await expect(page.locator("h1")).toContainText("Library Dashboard");
    await expect(page.locator("[data-testid=nav-inventory]")).toContainText(
      "Inventory"
    );
  });

  test("should display Vietnamese content when locale is vi", async ({
    page,
  }) => {
    await page.goto("/vi/dashboard");

    await expect(page.locator("h1")).toContainText("Bảng điều khiển thư viện");
    await expect(page.locator("[data-testid=nav-inventory]")).toContainText(
      "Kho sách"
    );
  });

  test("should switch languages using language switcher", async ({ page }) => {
    await page.goto("/en/dashboard");

    // Click language switcher
    await page.click("[data-testid=language-switcher]");
    await page.click("text=Tiếng Việt");

    // Verify URL changed and content is in Vietnamese
    await expect(page).toHaveURL("/vi/dashboard");
    await expect(page.locator("h1")).toContainText("Bảng điều khiển thư viện");
  });

  test("should maintain route when switching languages", async ({ page }) => {
    await page.goto("/en/inventory");

    await page.click("[data-testid=language-switcher]");
    await page.click("text=Tiếng Việt");

    await expect(page).toHaveURL("/vi/inventory");
  });

  test("should redirect invalid locale to default", async ({ page }) => {
    await page.goto("/fr/dashboard");

    await expect(page).toHaveURL("/en/dashboard");
  });
});
```

## Implementation Timeline & Milestones

### Week 1-2: Foundation Setup

- **Deliverables:**
  - next-intl package installation and configuration
  - Basic routing setup with middleware
  - Initial message structure for core components
  - TypeScript integration

- **Success Criteria:**
  - App loads with `/en` and `/vi` routes
  - Language switcher functional
  - Basic navigation translated

### Week 3-4: Component Integration

- **Deliverables:**
  - All navigation components localized
  - Form validation with localized error messages
  - Data display components with proper formatting
  - Loading and error states translated

- **Success Criteria:**
  - All existing components display in both languages
  - Form validation works in both locales
  - Date/number formatting appropriate for each locale

### Week 5-6: Database & Performance

- **Deliverables:**
  - User locale preference storage
  - Database schema for localized content
  - Performance optimizations with static generation
  - Translation bundle optimization

- **Success Criteria:**
  - User language preferences persist across sessions
  - Page load performance maintained
  - SEO metadata properly localized

### Week 7-8: Testing & Quality Assurance

- **Deliverables:**
  - Comprehensive test suite for i18n functionality
  - E2E tests covering language switching flows
  - Translation consistency validation
  - Performance benchmarking

- **Success Criteria:**
  - All tests passing
  - Translation coverage at 100%
  - Performance metrics meet requirements
  - Accessibility compliance maintained

## Maintenance & Operations

### Translation Workflow

1. **Developer Workflow:**

   ```bash
   # Add new translation key
   # 1. Add to en.json
   # 2. Add to vi.json
   # 3. Update TypeScript types if needed
   # 4. Use in component with useTranslations()
   ```

2. **Translation Management:**
   - Use translation management service (Crowdin, Lokalise) for future languages
   - Implement translation validation in CI/CD pipeline
   - Regular translation audits for consistency

3. **Performance Monitoring:**
   - Monitor bundle sizes for each locale
   - Track Core Web Vitals impact
   - Set up alerts for translation loading failures

### Future Enhancements

1. **Additional Languages:** Framework ready for Thai, Chinese, etc.
2. **Advanced Features:**
   - Right-to-left language support
   - Pluralization rules
   - Regional variations (en-US vs en-GB)
3. **Content Management:** Admin interface for translation management

## Risk Assessment & Mitigation

### Technical Risks

1. **Performance Impact**
   - **Risk:** Larger bundle sizes with multiple locales
   - **Mitigation:** Lazy loading, code splitting, translation caching

2. **SEO Implications**
   - **Risk:** Duplicate content issues
   - **Mitigation:** Proper hreflang implementation, canonical URLs

3. **Maintenance Overhead**
   - **Risk:** Translation consistency across features
   - **Mitigation:** Automated validation, clear documentation

### Operational Risks

1. **Translation Quality**
   - **Risk:** Poor Vietnamese translations affecting UX
   - **Mitigation:** Native speaker review, user testing

2. **Content Management**
   - **Risk:** Difficulty managing translations at scale
   - **Mitigation:** Translation management system integration

## Cookie-Based Approach Benefits

### Why No URL Routing for Admin Applications

1. **Clean URLs**:
   - `/dashboard` instead of `/en/dashboard` or `/vi/dashboard`
   - Simpler URL structure for internal tools
   - No need to handle locale in every link

2. **User Experience**:
   - Language preference persists across sessions
   - No URL changes when switching languages
   - Bookmarks work regardless of language preference

3. **Developer Experience**:
   - Simpler routing configuration
   - No need for locale-aware navigation components
   - Standard Next.js Link component works as-is

4. **SEO Considerations**:
   - Admin apps don't need SEO optimization
   - No duplicate content concerns
   - No need for hreflang tags

5. **Authentication Integration**:
   - Language preference tied to user account
   - Automatic language selection on login
   - Consistent experience across devices

## Conclusion

This implementation plan provides a robust foundation for English/Vietnamese internationalization using next-intl with a **cookie-based approach** that avoids URL routing complexity. The solution is ideal for the Library Management System as an authenticated admin application.

Key success factors:

- **Clean URLs:** No locale prefixes cluttering the URL structure
- **Type Safety:** Full TypeScript integration prevents runtime errors
- **User Preference:** Language choice persists via cookies and database
- **Performance:** Optimized with caching and lazy loading
- **Maintainability:** Clear structure and testing ensure long-term success
- **User Experience:** Seamless language switching without URL changes

The plan positions the Library Management System for future international expansion while providing immediate value for English and Vietnamese-speaking library staff, maintaining clean URLs throughout the application.
