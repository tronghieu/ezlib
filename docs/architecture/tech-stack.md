# EzLib Technology Stack

## Overview

This document provides detailed specifications, configurations, and implementation guidelines for all technologies used in the EzLib platform.

---

## Frontend Stack

### Next.js 14+ (App Router)

**Version**: 14.2+  
**Purpose**: React framework for both reader social app and library management app

**Configuration**:
```json
// package.json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "@next/font": "14.2.0"
  }
}
```

**Key Features Used**:
- App Router for file-based routing
- Server Components for performance
- API Routes for backend endpoints
- Built-in TypeScript support
- Image optimization
- Automatic code splitting

**Environment Variables**:
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://ezlib.com
```

### TypeScript 5.0+

**Version**: 5.4+  
**Purpose**: Type safety across all frontend code

**Configuration**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

### Tailwind CSS 3.4+

**Version**: 3.4+  
**Purpose**: Utility-first CSS framework

**Configuration**:
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

### shadcn/ui + Radix UI

**Purpose**: Professional UI component library built on Radix primitives

**Installation**:
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input dialog
```

**Key Components**:
- Button, Card, Input, Dialog, Table
- Form components with validation
- Navigation components
- Data display components

### Zustand (State Management)

**Version**: 4.5+  
**Purpose**: Lightweight state management

**Configuration**:
```typescript
// lib/stores/book-store.ts
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface BookState {
  books: Book[]
  currentBook: Book | null
  isLoading: boolean
  // actions
  setBooks: (books: Book[]) => void
  setCurrentBook: (book: Book | null) => void
  setLoading: (loading: boolean) => void
}

export const useBookStore = create<BookState>()(
  devtools(
    persist(
      (set) => ({
        books: [],
        currentBook: null,
        isLoading: false,
        setBooks: (books) => set({ books }),
        setCurrentBook: (book) => set({ currentBook: book }),
        setLoading: (loading) => set({ isLoading: loading }),
      }),
      {
        name: 'book-storage',
        partialize: (state) => ({ currentBook: state.currentBook }),
      }
    )
  )
)
```

### TanStack Query (React Query)

**Version**: 5.0+  
**Purpose**: Server state management and data fetching

**Configuration**:
```typescript
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        if (error.status === 401) return false
        return failureCount < 3
      },
    },
  },
})
```

---

## Backend Stack

### Python 3.11+ (Book Crawler Service)

**Version**: 3.11+  
**Purpose**: Book metadata enrichment service

**Dependencies**:
```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.104.0"
uvicorn = {extras = ["standard"], version = "^0.24.0"}
httpx = "^0.25.0"
pydantic = "^2.4.0"
supabase = "^2.0.0"
structlog = "^23.1.0"
beautifulsoup4 = "^4.12.0"
lxml = "^4.9.0"
aioredis = "^2.0.0"
asyncpg = "^0.28.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.0"
pytest-asyncio = "^0.21.0"
black = "^23.9.0"
ruff = "^0.0.292"
mypy = "^1.6.0"
```

**Configuration**:
```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_service_key: str
    
    # External APIs
    google_books_api_key: str = ""
    worldcat_api_key: str = ""
    isbn_db_api_key: str = ""
    
    # Rate limiting
    default_rate_limit_per_minute: int = 60
    openlibrary_rate_limit_per_minute: int = 100
    goodreads_rate_limit_per_minute: int = 30
    
    # Caching
    redis_url: str = "redis://localhost:6379"
    cache_expiry_hours: int = 24
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### FastAPI

**Version**: 0.104+  
**Purpose**: High-performance async web framework

**Main Application**:
```python
# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import structlog

from .config import settings
from .api import crawler_router

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting EzLib Book Crawler Service")
    yield
    logger.info("Shutting down EzLib Book Crawler Service")

app = FastAPI(
    title="EzLib Book Crawler API",
    description="Book metadata enrichment service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ezlib.com", "https://manage.ezlib.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(crawler_router, prefix="/api/crawler", tags=["crawler"])
```

---

## Database Stack

### Supabase (PostgreSQL + Auth + Storage + Realtime)

**Version**: Latest  
**Purpose**: Backend-as-a-Service providing database, authentication, storage, and real-time features

**Database Configuration**:
```sql
-- Database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Custom functions for search
CREATE OR REPLACE FUNCTION search_books(search_term text)
RETURNS TABLE(book_id uuid, title text, authors text[], rank real)
LANGUAGE sql
AS $$
  SELECT 
    be.id as book_id,
    be.title,
    ARRAY_AGG(DISTINCT a.name) as authors,
    ts_rank(
      to_tsvector('english', be.title || ' ' || string_agg(a.name, ' ')),
      plainto_tsquery('english', search_term)
    ) as rank
  FROM book_editions be
  JOIN book_contributors bc ON bc.book_edition_id = be.id
  JOIN authors a ON a.id = bc.author_id
  WHERE to_tsvector('english', be.title || ' ' || string_agg(a.name, ' ')) 
        @@ plainto_tsquery('english', search_term)
  GROUP BY be.id, be.title
  ORDER BY rank DESC;
$$;
```

**Supabase Client Configuration**:
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Server-side client with service role
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

---

## Development Tools

### Build System

**Turbo (Monorepo)**:
```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.tsx", "src/**/*.ts", "test/**/*.ts", "test/**/*.tsx"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**Package.json Scripts**:
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  }
}
```

### Testing

**Frontend Testing**:
```json
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
  ],
}

module.exports = createJestConfig(customJestConfig)
```

**Python Testing**:
```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_functions = "test_*"
addopts = "-v --cov=src --cov-report=term-missing"
asyncio_mode = "auto"
```

### Code Quality

**ESLint Configuration**:
```json
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Python Code Quality**:
```toml
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py311']

[tool.ruff]
line-length = 88
target-version = "py311"
select = [
    "E",  # pycodestyle errors
    "W",  # pycodestyle warnings
    "F",  # pyflakes
    "I",  # isort
    "B",  # flake8-bugbear
    "C4", # flake8-comprehensions
    "UP", # pyupgrade
]
ignore = [
    "E501", # line too long, handled by black
]

[tool.mypy]
python_version = "3.11"
check_untyped_defs = true
disallow_any_generics = true
disallow_incomplete_defs = true
disallow_untyped_defs = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
```

---

## Deployment Configuration

### Vercel

**vercel.json**:
```json
{
  "buildCommand": "turbo run build",
  "outputDirectory": "apps/reader/.next",
  "devCommand": "turbo run dev --filter=reader",
  "installCommand": "npm install",
  "framework": "nextjs",
  "functions": {
    "apps/crawler/main.py": {
      "runtime": "python3.9"
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key"
  }
}
```

### Environment Management

**Production Environment Variables**:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# External APIs
GOOGLE_BOOKS_API_KEY=your-google-books-key
WORLDCAT_API_KEY=your-worldcat-key
ISBN_DB_API_KEY=your-isbn-db-key

# App URLs
NEXT_PUBLIC_READER_APP_URL=https://ezlib.com
NEXT_PUBLIC_LIBRARY_APP_URL=https://manage.ezlib.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id
```

---

## External API Integrations

### Rate Limiting Configuration

```python
# Rate limiting for external APIs
API_RATE_LIMITS = {
    "openlibrary": {
        "requests_per_minute": 100,
        "requests_per_hour": 5000,
        "timeout": 10
    },
    "google_books": {
        "requests_per_minute": 100,
        "requests_per_day": 1000,
        "timeout": 5
    },
    "worldcat": {
        "requests_per_minute": 50,
        "requests_per_day": 50000,
        "timeout": 15
    },
    "goodreads_scraping": {
        "requests_per_minute": 30,
        "delay_between_requests": 2,
        "timeout": 20
    }
}
```

### HTTP Client Configuration

```python
# External API client configuration
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

class ExternalAPIClient:
    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            headers={
                "User-Agent": "EzLib-Crawler/1.0 (contact@ezlib.com)"
            }
        )
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def fetch(self, url: str) -> dict:
        response = await self.client.get(url)
        response.raise_for_status()
        return response.json()
```

This technology stack provides a solid foundation for the EzLib platform with clear configurations and best practices for each component.