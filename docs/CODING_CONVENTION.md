# Coding Convention - Tijarah Project

## Pengenalan

Panduan ini mendefinisikan standar coding yang konsisten untuk seluruh tim developer di proyek Tijarah. Kepatuhan terhadap convention ini membantu menjaga code quality, menjalankan CI/CD pipeline, dan memudahkan collaboration antar tim.

---

## 1. File & Folder Naming Convention

### 1.1 Frontend Structure

```
front-end/
├── components/              # Reusable UI components
│   ├── atom/              # ← Atomic components (reusable)
│   │   ├── TijarahButton.tsx
│   │   ├── TijarahInput.tsx
│   │   ├── TijarahCard.tsx
│   │   └── ...
│   ├── molecule/          # ← Compound components
│   │   ├── AuthCard.tsx
│   │   ├── OrderSummary.tsx
│   │   └── ...
│   ├── organic/           # ← Page-level (future usage)
│   └── data/              # ← Data-heavy components
│
├── app/                   # Next.js App Router pages
│   ├── [lang]/           # ← Internationalization routes
│   │   ├── auth/
│   │   ├── main/
│   │   └── checkout/
│   ├── common/           # ← Shared page components
│
├── lib/                   # ← Utility libraries
│   ├── i18n/
│   └── axios/
│
├── config/                # ← Configuration files
│   ├── site.ts
│   └── fonts.ts
│
└── types/                 # ← TypeScript type definitions
```

### 1.2 Backend Structure

```
back-end/
├── src/
│   ├── modules/          # ← Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.type.ts
│   │   └── addresses/
│   ├── configs/          # ← Configuration files
│   ├── plugins/          # ← Shared plugins
│   ├── schemas/          # ← Shared schemas
│   ├── utils/            # ← Utility functions
│   └── routes/           # ← Route modules
│
└── migrations/           # ← Database migrations
```

### 1.3 Naming Rules

| Type | Format | Example |
|------|--------|---------|
| **Backend Modules** | `kebab-case` | `auth`, `checkout`, `wallet` |
| **Backend Controller** | `{module}Controller` | `authController`, `addressController` |
| **Backend Service** | `{module}Service` | `authService`, `walletService` |
| **Backend Schema** | `{module}Schema` | `authSchema`, `checkoutSchema` |
| **Frontend Components (Atomic)** | `Tijarah{Component}` | `TijarahButton`, `TijarahInput` |
| **Frontend Components (Molecule)** | `{UpperCamelCase}` | `ProfileCard`, `OrderSummary` |
| **Functions** | `camelCase` | `getUserData`, `calculateTotal` |
| **Constants** | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRY` |
| **Type/Mutation/Variable** | `PascalCase` | `UserProfile`, `OrderItem` |
| **Interfaces** | `I{Component}Props` | `ITijarahButtonProps`, `ICheckoutRequest` |
| **Test Files** | `*.test.ts`, `*.spec.ts` | `auth.service.test.ts` |
| **Mock Files** | `*.mock.ts` | `products.mock.ts` |

---

## 2. TypeScript Conventions

### 2.1 File Type Annotations

```typescript
// ✅ Main file (.ts/.tsx)
// Export named function/component
export function getUserById(id: string) { }

// ✅ Type definition file (.type.ts)
export type UserName = string;
export interface UserProfile {
  id: string;
  name: string;
}

// ✅ Schema file (.schema.ts) - refer official Zod docs
export const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});
```

### 2.2 Interface Naming

```typescript
// ✅ PascalCase untuk interface (dependensi external)
interface UserProfile {
  id: string;
  name: string;
}

// ✅ I{Component}Props untuk React components
interface ITijarahButtonProps {
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

// ✅ CamelCase untuk type (di dalam komponen)
type AuthError = {
  message: string;
  code: number;
};
```

### 2.3 Type Avoidance

```typescript
// ✅ Gunakan interface jika bisa
export interface UserProfile {
  id: string;
  name: string;
}

// ❌ Reduce usage of type alias untuk object
type UserProfile = {
  id: string;
  name: string;
};

// ✅ Tetap gunakan type alias untuk union, primitives, tuples
type Status = 'active' | 'inactive' | 'deleted';
type Coordinates = [number, number];
```

### 2.4 Any/Unknown/Unknown Primitives

```typescript
// ✅ Gunakan type annotation untuk semua data
const data = {
  id: 'uuid',
  name: 'John',
};

// ✅ Ketika tidak tipe exact - gunakan known b/w types
interface ApiResponse<T> {
  T;
  status: 'success' | 'error';
}

// ❌ Jangan gunakan any
const any = getData();

// ✅ Gunakan unknown saat tidak tipe (biasanya raw JSON)
const result: unknown = await fetchData();
```

### 2.5 Improvement Rule (ESLint `@typescript-eslint/no-explicit-any` disabled for explicit reasons)

```typescript
// ✅ Explicit any dengan justification comment
interface ApiResponse {
  any; // Server response structure unknown
  status: string;
}

// ✅ Use known error types atau generic Any
type ErrorContainer = Record<string, unknown>;
```

---

## 3. Naming Functions & Variables

### 3.1 Function Naming

```typescript
// ✅ Verb + object (camelCase)
export function getUserById(id: string) { }

export function calculateTotal(items: CartItem[]): number { }

export function validateOAuthToken(token: string): boolean { }

// ✅ Async functions sebaiknya gunakan prefix "async" untuk clarity
export async function fetchUserData(userId: string): Promise<User> { }

// ✅ Event handler sebaiknya handle prefix "handle" atau "on"
export function handleClick() { }
const onHover = () => { }
```

### 3.2 Variable Naming

```typescript
// ✅ Dapatkan, Hasil, Blob (camelCase)
const userData = await fetchUser(id);
const totalPrice = calculateTotal();
const responseStatus = response.status;

// ✅ Boolean flag with prefix "is"
const isLoading = true;
const isValid = false;
const isVisible = false;

// ✅ Constants (UPPER_SNAKE_CASE)
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 5000;

// ✅ Class names / Types (PascalCase)
class UserService { }
export type OrderStatus = 'completed' | 'pending';
```

---

## 4. Code Style (Formatting)

### 4.1 Prettier Configuration

File: `.prettierrc` (extensible)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### 4.2 Post-Import Sorting (ESLint `eslint-plugin-import`)

```typescript
// ✅ Sorted alphabetically by module
import { db } from "@/prisma/db";
import { FastifyReply } from "fastify";
import { z } from "zod";

import { responseUtil } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import { authService } from "./auth.service";
import { typePayload } from "./auth.type";
import { getLanguageFromRequest, t } from "@/i18n";
```

### 4.3 Indentation

- **Tabs** untuk workflow (VSCode), **Spaces** untuk file Publishing (GitHub Pages)
- Standard: **2 spaces**

```typescript
// ✅ Indented with 2 spaces
export const authService = {
  async register(payload: typePayloadReg, lang: SupportedLanguage = 'id') {
    // Business logic here
    const user = await db.orm.core_auth.User.create({
      { email: payload.email, fullName: payload.fullName }
    });

    return user;
  }
};
```

### 4.4 Line Length

Maximum: **100 characters** (with `printWidth: 100` in Prettier)

```typescript
// ✅ Wrap long lines
export const createOrder = async (
  userId: string,
  items: OrderItem[],
  addressId: string
) => { };

// ❌ Line too long (> 100 chars)
export const createOrder = async (userId: string, items: OrderItem[], addressId: string) => { };
```

---

## 5. JSDoc & Documentation

### 5.1 Class/File Documentation

```typescript
/**
 * Authentication Service
 *
 * Manages user registration, login, OTP verification,
 * and Supabase OAuth integration.
 *
 * @module auth.service
 * @author Tijarah Team
 * @version 1.0.0
 */

export const authService = {
  /**
   * Register new user
   *
   * Creates user in Supabase Auth and local database.
   *
   * @param payload - User registration data
   * @param lang - Language for error messages (default: 'id')
   * @returns User data with status
   * @throws {AppError} If email/phone already exists or Supabase fails
   *
   * @example
   * const result = await authService.register({
   *   email: 'user@example.com',
   *   password: 'password123',
   *   fullName: 'John Doe'
   * }, 'id');
   */
  async register(payload: typePayloadReg, lang: SupportedLanguage = 'id') {
    // Implementation
  }
};
```

### 5.2 Function Documentation

```typescript
/**
 * Retrieves address data for a user
 *
 * @param params.id - User UUID (from JWT or query param)
 * @param lang - Language for i18n messages
 * @returns Array of user addresses
 * @throws {AppError} If user or address not found
 */
async getAddresses(params, lang: SupportedLanguage = 'id') { }
```

### 5.3 Inline Comment Convention

```typescript
// ✅ Use for blocking comments
// TODO: Refactor this function - too complex
// NOTE: This is cached data - manual invalidation required

// ❌ Use /* */ hanya jika perlu multiline
// Multi-line comment would go here

// ✅ Inline - untuk satu baris penjelasan
const user = await db.orm.core_auth.User.where({ id }).first(); // Cached query
```

---

## 6. Error Handling

### 6.1 Using AppError

```typescript
import { AppError } from "@/utils/AppError";

// ✅ Basic error
throw new AppError('User not found', 404);

// ✅ Error with details
throw new AppError('Invalid credentials', 401, {
  hint: 'Please verify your email'
});

// ✅ Error with Supabase mapping
const { data, error } = await supabase.auth.signInWithPassword({...});
if (error) {
  throw new AppError(
    'Login failed', 0, // Status code injected later
    { supabaseError: error, code: error.code }
  );
}
```

### 6.2 Service Layer Error Handling

```typescript
export const authService = {
  async register(payload: typePayloadReg, lang: SupportedLanguage = 'id') {
    try {
      // Business logic

    } catch (error: any) {
      if (error instanceof AppError) throw error; // Known error - rethrow

      // Unknown error - log & rethrow as 500
      const message = t('auth.register_failed', {}, lang);
      throw new AppError(message, 500, { originalError: error.message });
    }
  }
};
```

### 6.3 Controller Layer Error Handling

```typescript
export const authController = {
  async register(req, res) {
    try {
      const data = await authService.register(payload, lang);

      return responseUtil.created({
        reply: res,
        message: t('auth.register_success', {}, lang),
        data,
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.code(error.statusCode).send({
          status: 'error',
          message: error.message,
          ...(error.details ? { details: error.details } : {})
        });
      }
      throw error; // Unknown error - middleware will handle
    }
  }
};
```

---

## 7. i18n (Internationalization)

### 7.1 Translation Keys Pattern

```typescript
// ✅ Format: `{module}.{action}_{status}`

// Auth module
t('auth.register_success')        // User registration success
t('auth.login_failed')             // Login failed message
t('auth.validation.email_invalid') // Email validation error
t('auth.email_already_exists')     // Email already registered

// Addresses module
t('addresses.create_address_success')  // Address creation success
t('addresses.get_addresses_success')  // Addresses retrieval success
t('addresses.delete_address_success')  // Address deletion success

// Common errors
t('common.bad_request')         // General bad request
t('common.validation.field_min') // Validation: field minimum

// Pattern alternatives (optional)
t('{module}.{action}_success')  // Same as above
t('{module}.{action}_error')    // Similar pattern
```

### 7.2 Supabase Error Translation

```typescript
import { translateSupabaseError } from '@/i18n';

const { data, error } = await supabase.auth.signUp({...});
if (error) {
  const translatedMsg = translateSupabaseError(error.message, lang);
  throw new AppError(
    t('auth.register_supabase_failed', { message: translatedMsg }, lang),
    400
  );
}
```

---

## 8. Frontend Conventions

### 8.1 React Component Structure

```typescript
import React from "react";
import { Button, ButtonProps, Spinner } from "@heroui/react";
import clsx from "clsx";

// 1. Define Variants
export const TijarahButtonVariants = {
  primary: "bg-[var(--primary-sage)] hover:bg-[var(--primary-dark)] ...",
  secondary: "bg-[var(--surface)] ...",
  // ...
} as const satisfies Record<string, string>;

// 2. Type Definitions
export type TijarahButtonVariant = keyof typeof TijarahButtonVariants;
export interface TijarahButtonProps extends Omit<ButtonProps, "variant"> {
  tijarahVariant?: TijarahButtonVariant;
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}

// 3. Component Implementation
export const TijarahButton: React.FC<TijarahButtonProps> = ({
  tijarahVariant = "primary",
  className,
  isLoading,
  startContent,
  endContent,
  children,
  ...props
}) => {
  const preset = TijarahButtonVariants[tijarahVariant];

  return (
    <Button
      {...props}
      className={clsx("font-medium transition-all duration-200 ...", preset, className)}
    >
      {isLoading ? <Spinner /> : (
        <>
          {startContent}
          {children}
          {endContent}
        </>
      )}
    </Button>
  );
};
```

### 8.2 Form Handling with React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm = () => {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (RegisterFormData) => {
    // Handle submission
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input
        label="Email"
        type="email"
        {...form.register('email')}
        isInvalid={!!form.formState.errors.email}
        errorMessage={form.formState.errors.email?.message}
      />
      {/* Other fields */}
    </form>
  );
};
```

### 8.3 Tailwind CSS Usage

```typescript
// ✅ Use design tokens
<div className="bg-[var(--canvas)] text-[var(--text-primary)]">
  Primary Text
</div>

// ✅ Use prettier-types
<button className="bg-[var(--primary-sage)]">
  Primary Button
</button>

// ✅ Consistent spacing
<div className="p-4 gap-6 flex">
  Child 1 → gap-6 → Child 2
</div>

// ✅ Components variants used
<TijarahButton tijarahVariant="primary">
  Primary Button
</TijarahButton>

// ❌ Jangan gunakan inline style untuk color/layout
<div style={{ backgroundColor: 'red' }}>
```

---

## 9. GraphQL/REST API Response Standard

### 9.1 Response Format

```typescript
// Success Response
{
  status: 'success',  // 'success' | 'error'
  message: 'Operation successful',
  { ... }       // Optional
}

// Error Response
{
  status: 'error',
  message: 'Error message',
  errors?: [{         // Optional
    field?: string,
    message: string
  }],
  details?: any        // Optional debugging info
}
```

### 9.2 HTTP Status Codes

| Code | Meaning | Success/Error |
|------|---------|---------------|
| 200 | OK | Success |
| 201 | Created | Success |
| 400 | Bad Request | Error |
| 401 | Unauthorized | Error |
| 403 | Forbidden | Error |
| 404 | Not Found | Error |
| 429 | Too Many Requests | Error |
| 500 | Internal Server Error | Error |

---

## 10. Git Commit Message Convention

### 10.1 Format (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]
```

### 10.2 Type Prefixes

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add email verification` |
| `fix` | Bug fix | `fix(auth): correct JWT secret validation` |
| `refactor` | Code changes without feature changes | `refactor(address): standardize schema validation` |
| `docs` | Documentation changes | `docs(API): add endpoint documentation` |
| `test` | Add or update tests | `test(address): add unit tests for service` |
| `chore` | Maintenance tasks | `chore(deps): update nextui to v3` |
| `style` | Code style/format changes | `style(auth): apply prettier formatting` |
| `perf` | Performance improvements | `perf(auth): optimize user query with index` |

### 10.3 Scope Examples

```
feat(auth): add Google OAuth
fix(address): handle invalid UUID format
refactor(backend): standardize error handling pattern
docs(frontend): document design token usage
test(back-end): add integration tests
```

### 10.4 Commit Examples

```bash
# ✅ Feature commit
git commit -m "feat(auth): implement OTP verification via email"

# ✅ Bug fix commit
git commit -m "fix(backend): resolve database connection timeout issue"

# ✅ Refactor commit
git commit -m "refactor(billing): replace raw SQL with Prisma ORM"

# ✅ Documentation commit
git commit -m "docs(API): add admin endpoints documentation"

# ✅ Test commit
git commit -m "test(backend): add unit tests for address service"

# ✅ Dependencies update
git commit -m "chore(deps): update zod to v4.6.5"
```

---

## 11. ESLint & Prettier Rules

### 11.1 ESLint Configuration

File: `.eslintrc.js`

```javascript
module.exports = {
  extends: [
    'next',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // Explicit ANY for known types
    '@typescript-eslint/no-unused-vars': ['warn', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
    }]
  }
};
```

### 11.2 Prettier Configuration

File: `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowFunctionParentheses": "avoid"
}
```

---

## 12. Pre-Commit & Pre-Push Hooks

### 12.1 Husky + lint-staged

Setup in `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run ESLint store changes
npx lint-staged
```

**File `.lint-stagedrc.js`:**

```javascript
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,jsx}': ['prettier --write']
};
```

---

## 13. Code Review Checklist

### 13.1 For Pull Requests

**Functional Changes:**
- [ ] Code follows architecture patterns (Controller → Service → DB)
- [ ] All errors are handled properly with `AppError`
- [ ] i18n used for error messages
- [ ] Validation tested via Zod schemas
- [ ] Documentation updated (JSDoc if needed)

**Frontend PR:**
- [ ] Design tokens used (no hardcoded colors)
- [ ] Responsive layout verified (mobile, tablet, desktop)
- [ ] Dark mode compatibility
- [ ] Accessibility (ARIA attributes, keyboard nav)
- [ ] TypeScript types properly defined

**Code Quality:**
- [ ] ESLint passing (no new warnings)
- [ ] File naming follows conventions
- [ ] No inline functions / hard strings (except i18n keys)
- [ ] Comments where necessary
- [ ] Import sorting correct

**Testing:**
- [ ] Unit tests added for new logic
- [ ] Integration tests pass
- [ ] No new test failures

---

## 14. Security Checklists

### 14.1 Backend API Security

- [ ] Password hashing with bcrypt (cost: 10)
- [ ] JWT verified before executing private routes
- [ ] Rate limiting applied (per endpoint)
- [ ] CORS configured (allow only frontend origin)
- [ ] Helmet security headers enabled
- [ ] Sanitized inputs (Zod validation)
- [ ] No SQL injection (use Prisma ORM)
- [ ] No localStorage injection (use session state)

### 14.2 Frontend Security

- [ ] API keys not exposed in client-side code
- [ ] CSRF tokens for sensitive actions
- [ ] Input sanitization before rendering
- [ ] XSS prevention (NextJS auto-protection)
- [ ] HTTPS enforced in production
- [ ] Sensitive cookies (httpOnly, secure)

---

## 15. Performance Best Practices

### 15.1 Backend

```typescript
// ✅ Use pagination for large datasets
const users = await db.orm.User.where({ ... }).limit(20).skip((page - 1) * 20);

// ✅ Use Prisma select to avoid fetching extra fields
const user = await db.orm.User.where({ id }).select({ id, name, email }).first();

// ❌ Bad: fetch all fields including passwords
const user = await db.orm.User.where({ id }).first();

// ✅ Use database indexes
model: {
  @@index([email])
  @@index([parseInt(createdAt)])
}
```

### 15.2 Frontend

```typescript
// ✅ Use React.memo untuk optimized re-renders
export const MyComponent = React.memo(({ data }) => { ... });

// ✅ Use Suspense untuk data fetching
export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DataComponent />
    </Suspense>
  );
}

// ❌ Bad: data fetching di component sendiri
export const Component = () => {
  const data = await fetchData(); // ❌ triggers re-render on every render
  return <div>{data}</div>
}
```

---

## 16. Debugging & Logging

### 16.1 Backend Logging

```typescript
// ✅ Use Pino structured logging
app.log.info({ userId, action: 'login' }, 'User logged in successfully');

// ✅ Log errors with context
try {
  // Operation
} catch (error) {
  app.log.error(
    { error, userId, context: 'checkout' },
    'Failed to create order'
  );
  throw error;
}
```

### 16.2 Frontend Console Logs

```typescript
// ✅ Use development feature flags
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', variable);
}

// ✅ Use React DevTools Profiler
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);
```

---

## 17. Conflict Resolution

### 17.1 When branch name conflict

| Scenario | Recommendation |
|----------|----------------|
| Same feature in different branch | Add prefix: `feat(shop): add product rating` instead of `feat: add rating` |
| Same file conflicted | Resolve conflict manually, ensure contribution preserved |
| Same module core, different endpoints | Use proper scope: `feat(cart): add additive items`, `feat(cart): remove cart items` |

### 17.2 Pull Request Merging

- Use "Squash and merge" for feature branches
- Use "Create a merge commit" for hotfixes
- Always add meaningful PR description:
  - Problem statement
  - Proposed solution
  - Testing approach
  - Related issues

---

## 18. Documentation Requirements

### 18.1 Required Documentation

**Backend:**
- [ ] Implementation documentation for new APIs
- [ ] Database schema documentation (optional)
- [ ] Deployment documentation

**Frontend:**
- [ ] Component documentation (when reusable)
- [ ] Page layout documentation
- [ ] Design tokens documentation (in DESIGN_SYSTEM.md)

### 18.2 Documentation Style Guide

```markdown
# Module Name

## Overview
Brief description of module purpose and main responsibilities.

## API Endpoints
List of available endpoints with description and request/response examples.

## Usage Example
```typescript
// Example usage with explanations
```

## Error Handling
List of possible errors and how to handle them.

## Related Files
`src/modules/{module}/`
```

---

**Last Updated:** 2026-10-15
**Version:** 1.0.0
**Maintained by:** Tijarah Team