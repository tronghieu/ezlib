# Library Management System - Coding Standards

<!-- Powered by BMAD™ Core -->

## Overview

This document defines the **mandatory coding standards** for the **Library Management System**, a monolithic Next.js application with Supabase authentication. These standards are enforced by automated tools and must be followed by all developers and AI agents.

## Core Technologies & Versions

### Language & Runtime

- **TypeScript**: 5+ with strict mode enabled
- **Node.js**: 18+ (LTS version)
- **React**: 19.1.0 with concurrent features
- **Next.js**: 15.5.2 with App Router

### Package Management

- **Package Manager**: PNPM (required)
- **Lock File**: pnpm-lock.yaml (commit to repository)
- **Node Version**: Use .nvmrc for version consistency

## Code Style & Formatting

### Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

**Formatting Rules:**

- **Semicolons**: Required
- **Quotes**: Double quotes for strings
- **Trailing Commas**: ES5 style (objects, arrays)
- **Indentation**: 2 spaces (no tabs)
- **Line Length**: 80 characters

### ESLint Configuration

**Current Setup:**

```javascript
// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
```

## TypeScript Standards

### Strict Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true, // MANDATORY
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"] // MANDATORY alias
    }
  }
}
```

### Type Safety Rules

**MANDATORY Requirements:**

- **Strict Mode**: Always enabled
- **No Any Types**: Never use `any`, use `unknown` or use proper types
- **Explicit Return Types**: For public functions
- **Interface Definitions**: For all component props
- **Type Imports**: Use `import type` for type-only imports

```typescript
// ✅ Good: Proper typing
interface BookFormProps {
  onSubmit: (data: BookData) => Promise<void>;
  initialData?: BookData;
  isLoading: boolean;
}

export function BookForm({
  onSubmit,
  initialData,
  isLoading,
}: BookFormProps): JSX.Element {
  // Implementation
}

// ✅ Good: Type-only imports
import type { Database } from "@/lib/types/database.ts";
import type { User } from "@supabase/supabase-js";

// ❌ Bad: Any types
function handleSubmit(data: any) {}

// ❌ Bad: Missing prop types
export function BookForm({ onSubmit, initialData }) {
  // Implementation
}
```

## File Naming Conventions

### Components & Pages

```plaintext
# Next.js App Router (MANDATORY)
page.tsx                # Page components
layout.tsx              # Layout components
loading.tsx             # Loading states
error.tsx               # Error boundaries
not-found.tsx           # 404 pages

# Regular Components (kebab-case)
book-form.tsx           # Form components
member-table.tsx        # Table components
search-input.tsx        # Input components

```

### Types defination file with suffix .d.ts
user.d.ts            # User types
book.d.ts            # Book types

### Utility Files

```plaintext
# Hooks (use- prefix)
use-auth.ts             # Authentication hooks
use-books.ts            # Book management hooks
use-local-storage.ts    # Utility hooks

# Services & Utils (kebab-case)
supabase-client.ts      # Service clients
form-validation.ts      # Validation utilities
date-utils.ts           # Date utilities
```

### Directory Structure

```plaintext
# All directories: kebab-case
src/
├── app/                        # Next.js App Router
├── components/
 |   ├── auth/                   # Authentication components
 |   ├── ui/                    # UI primitives
 |   ├── books/                 # Book components
 |   ├── library/               # Library components
 |   └── ... (feature)/         # 
├── lib/
 │   ├── supabase/             # Database integration
 │   ├── validation/           # Form schemas
 │   ├── hooks/                # Custom hooks
 │   └── utils/                # Utility functions
├── types/                      # Types definations
├── messages/                   # i18 messages
```

### Export Standards

```typescript
// ✅ Good: Named exports for components
export function BookForm() {}
export function BookTable() {}

// ✅ Good: Default export for pages
export default function BooksPage() {}

// ✅ Good: Consistent utility exports
export const formatDate = (date: Date) => {};
export const validateISBN = (isbn: string) => {};

// ❌ Bad: Mixed export styles in same file
export function Component1() {}
export default Component2;
```

### Absolute Imports (MANDATORY)

```typescript
// ✅ MANDATORY: Use @ alias for internal imports
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";

// ❌ FORBIDDEN: Relative imports
import { Button } from "../../../components/ui/button";
import { useAuth } from "../../hooks/use-auth";
```

## Component Standards

### React Component Patterns

```typescript
// ✅ Good: Functional component with proper typing
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  children,
  variant = 'primary',
  disabled = false,
  onClick
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`btn btn-${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Component File Structure

```typescript
// component-name.tsx
"use client"; // Only if client component

import React from "react";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "./types";

// Component interface
interface ComponentNameProps {
  // Props definition
}

// Main component
export function ComponentName(props: ComponentNameProps) {
  // Implementation
}

// Helper functions (if needed)
function helperFunction() {
  // Implementation
}
```

## State Management Standards

### Zustand Store Pattern

```typescript
// lib/stores/store-name.ts
import { create } from "zustand";

interface StoreState {
  // State properties
  data: DataType[];
  isLoading: boolean;

  // Actions
  fetchData: () => Promise<void>;
  updateData: (item: DataType) => void;
  clearData: () => void;
}

export const useStoreNameStore = create<StoreState>()((set, get) => ({
  data: [],
  isLoading: false,

  fetchData: async () => {
    set({ isLoading: true });
    try {
      // API call
      const data = await fetchFromAPI();
      set({ data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateData: (item) =>
    set((state) => ({
      data: state.data.map((d) => (d.id === item.id ? item : d)),
    })),

  clearData: () => set({ data: [] }),
}));
```

### Custom Hooks Pattern

```typescript
// lib/hooks/use-feature-name.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export function useFeatureName() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["feature-name"],
    queryFn: () => supabase.from("table").select("*"),
  });

  const mutation = useMutation({
    mutationFn: (data: InputType) => supabase.from("table").insert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-name"] });
    },
  });

  return {
    data,
    isLoading,
    error,
    create: mutation.mutate,
    isCreating: mutation.isLoading,
  };
}
```

## Form Standards

### React Hook Form + Zod Pattern

```typescript
// components/forms/feature-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  isbn: z.string().regex(/^[\d-]{10,17}$/, 'Invalid ISBN').optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FeatureFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: Partial<FormData>;
}

export function FeatureForm({ onSubmit, initialData }: FeatureFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          {...register('title')}
          id="title"
          type="text"
        />
        {errors.title && <span>{errors.title.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
```

## Database Integration Standards

### Supabase Client Usage

```typescript
// lib/supabase/client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

### Query Patterns

```typescript
// ✅ Good: Type-safe queries
const { data: books, error } = await supabase
  .from("books")
  .select("id, title, author, isbn")
  .eq("library_id", libraryId);

if (error) {
  throw new Error(`Failed to fetch books: ${error.message}`);
}

// ✅ Good: Proper error handling
try {
  const { data, error } = await supabase.from("books").insert(bookData);

  if (error) throw error;
  return data;
} catch (error) {
  console.error("Database error:", error);
  throw error;
}
```

## Error Handling Standards

### Error Boundary Pattern

```typescript
// components/error-boundary.tsx
'use client';

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}
```

## Performance Standards

### Component Optimization

```typescript
// ✅ Good: Memoized expensive components
import React from 'react';

interface ExpensiveComponentProps {
  data: DataType[];
  onSelect: (item: DataType) => void;
}

export const ExpensiveComponent = React.memo<ExpensiveComponentProps>(
  ({ data, onSelect }) => {
    // Expensive rendering logic
    return (
      <div>
        {data.map(item => (
          <ExpensiveItem key={item.id} item={item} onSelect={onSelect} />
        ))}
      </div>
    );
  }
);

ExpensiveComponent.displayName = 'ExpensiveComponent';
```

### Dynamic Imports

```typescript
// ✅ Good: Lazy load heavy components
import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <LoadingSpinner />,
  ssr: false,
});

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <HeavyChart />
    </div>
  );
}
```

## Git & Development Workflow

### Commit Standards

**Automated Quality Checks:**

- **Pre-commit**: ESLint + Prettier (via lint-staged)
- **Type Check**: TypeScript compilation check
- **Build Check**: Next.js build verification

### Branch Naming

```plaintext
# Feature branches
feature/add-book-management
feature/implement-auth

# Bug fixes
fix/form-validation-error
fix/table-pagination

# Documentation
docs/update-readme
docs/add-api-docs
```

## Critical Rules for AI Development

### MANDATORY Requirements

1. **Always use TypeScript strict mode**
2. **Never use `any` types - find proper types**
3. **Use absolute imports with @ alias**
4. **Follow Next.js App Router patterns**
5. **Implement proper error handling**
6. **Use Zod for all form validation**
7. **Follow component naming conventions**
8. **Include proper TypeScript interfaces**

### FORBIDDEN Patterns

```typescript
// ❌ FORBIDDEN: Any types
function handleData(data: any) {}

// ❌ FORBIDDEN: Relative imports
import { Button } from "../../../components/ui/button";

// ❌ FORBIDDEN: Missing error handling
const data = await supabase.from("books").select("*");

// ❌ FORBIDDEN: Untyped component props
export function Component({ data, onSubmit }) {}

// ❌ FORBIDDEN: console.log in production code
console.log("Debug info:", data);
```

## Development Commands

### Quality Assurance Workflow

```bash
# MANDATORY before every commit
pnpm lint:fix              # Fix ESLint issues
pnpm format               # Format with Prettier
pnpm type-check           # TypeScript checking
pnpm build                # Verify production build

# Development workflow
pnpm dev                  # Start development server
pnpm dev -- --turbo       # Start with Turbo optimization
```

### Environment Setup

```bash
# Package installation (MANDATORY: use PNPM)
pnpm install              # Install dependencies
pnpm add <package>        # Add production dependency
pnpm add -D <package>     # Add development dependency

# FORBIDDEN: Other package managers
npm install               # ❌ Don't use npm
yarn install             # ❌ Don't use yarn
```

These coding standards ensure **consistency**, **quality**, and **maintainability** across the Library Management System codebase. All automated tools enforce these standards, making compliance mandatory for successful development.
