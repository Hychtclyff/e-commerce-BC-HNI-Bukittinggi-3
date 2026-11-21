# Matpock Skills - Tijarah Project

## Pengenalan

Matpock Skills adalah collection command-line tools dan agent skills yang dirancang untuk mempercepat development dan menjaga konsistensi codebase Tijarah. Skill ini terintegrasi dengan dokumentasi arsitektur, environment variables, dan project conventions.

---

## 1. Skill Architecture Overview

### 1.1 Skill Structure

```
.matpock/
├── skills/                          # Skill definitions
│   ├── backend-scaffold.yaml        # Backend module generator
│   ├── frontend-component.yaml     # Frontend component generator
│   ├── design-token-validator.yaml # Design token enforcement
│   ├── naming-convention-checker   # Naming convention validation
│   └── git-commit-validator.yaml   # Git commit message validator
│
├── templates/                       # Template files
│   ├── backend/
│   │   ├── controller.template.ts
│   │   ├── service.template.ts
│   │   ├── routes.template.ts
│   │   ├── schema.template.ts
│   │   └── type.template.ts
│   └── frontend/
│       └── atom-component.template.tsx
│
└── rules.json                       # Global rules from docs
```

### 1.2 Skill Interdependency

```
Git Pre-Commit → [Naming Checker, Commit Validator, Design Token Validator]
Pre-Frontend Dev → [Component Generator, Type Inference]
Pre-Backend Dev → [Module Scaffold Generator]
All → [Backend & Frontend Linting]
```

---

## 2. Backend Module Scaffold Generator

### 2.1 Skill Configuration

File: `.matpock/skills/backend-scaffold.yaml`

```yaml
name: backend-scaffold
version: 1.0.0
author: Tijarah Team
description: Scaffold REST API module with Controller, Service, Routes, Schemas

trigger:
  pattern: /{module}/
  conditions:
    - module: /^[a-z]+$/i                    # kebab-case lowercase
    - folder_not_exists: true                # Pastikan folder belum ada
    - optional: prefix "create-module"     # Optional alias

variables:
  - name: module
    description: Module name (kebab-case)
    example: "product", "cart"
    required: true

  - name: features
    description: Features to include (CRUD, VALIDATION, EAGER_LOADING)
    example: ["CRUD"]
    default: ["CRUD"]
    options:
      - CRUD
      - EAGER_LOADING
      - VALIDATION

  - name: crud_actions
    description: CRUD actions to generate
    default:
      - create
      - read
      - readAll
      - update
      - delete
    options:
      - create
      - read
      - readAll
      - update
      - delete

steps:
  # Step 1: Validate naming convention
  - name: Validate naming
    condition: module matches /^[a-z]+$/i
    if_not_match:
      error: "Module name must be lowercase kebab-case (e.g., 'address' not 'Address', not 'address-book')"
      exit_code: 1

  # Step 2: Generate folder structure
  - name: Create module structure
    source: templates/backend
    destination: src/modules/{module}
    files:
      - controller.ts → {module}.controller.ts
      - service.ts → {module}.service.ts
      - routes.ts → {module}.routes.ts
      - schema.ts → {module}.schema.ts
      - type.ts → {module}.type.ts

  # Step 3: Auto-fill templates based on backend architecture
  - name: Inject step-specific templates
    operation: replace
    from_templates:
      - folder: templates/backend
        files:
          - controller.template.ts
          - service.template.ts
          - routes.template.ts
          - schema.template.ts
          - type.template.ts
    to_destination: src/modules/{module}
    # Note: Templates contain placeholders like {{module}}, {{actions}}

  # Step 4: Infer TypeScript types from Zod schemas
  - name: Generate type definitions
    from_schema: src/modules/{module}/{module}.schema.ts
    to_type: src/modules/{module}/{module}.type.ts
    operation: extract-types
    # Uses `z.infer<typeof schema>`

  # Step 5: Generate basic unit test stubs (optional)
  - name: Create test stubs
    source: templates/backend/controller.test.ts
    destination: src/modules/{module}/{module}.controller.test.ts
    condition: features.includes('TEST')

  # Step 6: Update global routes index
  - name: Register route
    condition: existing src/routes/api.routes.ts
    operation: append
    content: "app.register({module}Routes);"
    to_file: src/routes/api.routes.ts

  # Step 7: Create local Prisma reference file
  - name: Create local Prisma model reference
    source: templates/backend/prisma-model.ts
    destination: src/modules/{module}/{module}.prisma
    condition: optional

output:
  - "✅ Created module: src/modules/{module}/{module}.controller.ts"
  - "✅ Created module: src/modules/{module}/{module}.service.ts"
  - "✅ Created module: src/modules/{module}/{module}.routes.ts"
  - "✅ Created module: src/modules/{module}/{module}.schema.ts"
  - "✅ Created module: src/modules/{module}/{module}.type.ts"
  - "ℹ️  Types inferred from Zod schemas"
  - "⚠️  TODO: Implement business logic in service layer"

usage_examples:
  # Create simple CRUD module
  - command: matpock run backend-scaffold module=transaction
  - command: matpock run backend-scaffold module=wallet features=[CRUD,EAGER_LOADING]

expected_output:
  success: Module structure created in src/modules/{module}/
  partials: Template placeholders ready for manual editing
  architecture: Follows BACKEND_ARCHITECTURE.md patterns
```

---

### 2.2 Controller Template

File: `.matpock/templates/backend/controller.template.ts`

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { responseUtil } from "@/utils/response";
import { AppError } from "@/utils/AppError";
import { {module}Service } from "./{module}.service";
import { typePayload } from "./{module}.type";
import { getLanguageFromRequest, t } from "@/i18n";

/**
 * Controller for {module} module
 * Handles HTTP requests and calls service layer
 */
export const {module}Controller = {
  /**
   * Create new {module}
   */
  {action}: async (req: FastifyRequest<{ Body: typeof {actionCapital}BodySchema }>, res: FastifyReply) => {
    const lang = getLanguageFromRequest(req);
    const userId = req.user?.id;

    try {
      const payload = req.body as typePayload;

      const data = await {module}Service.{action}(
        { ...payload, userId },
        lang
      );

      return responseUtil.created({
        reply: res,
        message: t('{module}.{action}_success', {}, lang),
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
      throw error;
    }
  },

  /**
   * Get single {module} by ID
   */
  {readOnly}: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
    const lang = getLanguageFromRequest(req);

    try {
      const { id } = req.params;
      const data = await {module}Service.{readOnly}(id, lang);

      return responseUtil.success({
        reply: res,
        message: t('{module}.{action}_success', {}, lang),
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
      throw error;
    }
  },

  /**
   * Get all {module}s for user
   */
  {list}: async (req: FastifyRequest<{ Querystring: { page?: string; limit?: string } }>, res: FastifyReply) => {
    const lang = getLanguageFromRequest(req);

    try {
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '10');
      const userId = req.user?.id;

      const data = await {module}Service.{list}({ userId, page, limit }, lang);

      return responseUtil.success({
        reply: res,
        message: t('{module}.list_success', {}, lang),
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
      throw error;
    }
  },

  /**
   * Update existing {module}
   */
  {update}: async (req: FastifyRequest<{ Params: { id: string }; Body: typeof {updateCapital}BodySchema }>, res: FastifyReply) => {
    const lang = getLanguageFromRequest(req);

    try {
      const { id } = req.params;
      const data = await {module}Service.{update}(id, req.body, lang);

      return responseUtil.success({
        reply: res,
        message: t('{module}.{action}_success', {}, lang),
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
      throw error;
    }
  },

  /**
   * Delete {module}
   */
  {delete}: async (req: FastifyRequest<{ Params: { id: string } }>, res: FastifyReply) => {
    const lang = getLanguageFromRequest(req);

    try {
      const { id } = req.params;
      await {module}Service.{delete}(id, lang);

      return responseUtil.success({
        reply: res,
        message: t('{module}.{action}_success', {}, lang),
      });
    } catch (error: any) {
      if (error instanceof AppError) {
        return res.code(error.statusCode).send({
          status: 'error',
          message: error.message,
          ...(error.details ? { details: error.details } : {})
        });
      }
      throw error;
    }
  }
};
```

---

### 2.3 Service Template

File: `.matpock/templates/backend/service.template.ts`

```typescript
import { db } from "@/prisma/db";
import { AppError } from "@/utils/AppError";
import { SupportedLanguage, t } from "@/i18n";

/**
 * Service business logic for {module}
 * Handles database operations and data transformation
 */
export const {module}Service = {
  /**
   * Create new {module}
   */
  async {action}(params: { typePayload }, lang: SupportedLanguage = 'id') {
    try {
      // 1. Validation/Check existence
      const existing = await db.orm.{table}.where({ condition: params.data.condition }).first();
      if (existing) {
        throw new AppError(t('{module}.{field}_already_exists', { field: params.data.name }, lang), 400);
      }

      // 2. Database operation
      const data = await db.orm.{table}.create({
        create: {
          ...params.data,
          userId: params.userId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // 3. Transform response
      const { sensitiveField, ...response } = data;
      return response;

    } catch (error: any) {
      if (error instanceof AppError) throw error;

      // Handle known errors
      if (error.message.includes('already_exists')) {
        throw new AppError(
          t('{module}.{field}_already_exists', { field: params.data.name }, lang),
          400
        );
      }

      // Unknown error - log & rethrow
      const message = t('{module}.{action_name}_failed', {}, lang);
      throw new AppError(message, 500, {
        originalError: error.message
      });
    }
  },

  /**
   * Get single {module} by ID
   */
  async {readOnly}(id: string, lang: SupportedLanguage = 'id') {
    try {
      const data = await db.orm.{table}.where({ id }).first();

      if (!data) {
        throw new AppError(t('{module}.not_found', {}, lang), 404);
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('{module}.{action_name}_failed', {}, lang), 500);
    }
  },

  /**
   * Get list of {module}s
   */
  async {list}(params: { userId: string; page: number; limit: number }, lang: SupportedLanguage = 'id') {
    try {
      // 1. Pagination
      const skip = (params.page - 1) * params.limit;
      const take = params.limit;

      // 2. Query with ordering
      const data = await db.orm.{table}.where({
        userId: params.userId
      }).orderBy({ createdAt: 'desc' }).limit(take).skip(skip);

      // 3. Get total count for pagination info
      const totalItems = await db.orm.{table}.where({ userId: params.userId }).count();

      return {
        data,
        pagination: {
          page: params.page,
          limit: params.limit,
          totalItems,
          totalPages: Math.ceil(totalItems / params.limit)
        }
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('{module}.{action_name}_failed', {}, lang), 500);
    }
  },

  /**
   * Update {module}
   */
  async {update}(id: string, params: { Partial<typePayload> }, lang: SupportedLanguage = 'id') {
    try {
      // 1. Verify exists
      const existing = await db.orm.{table}.where({ id }).first();
      if (!existing) {
        throw new AppError(t('{module}.not_found', {}, lang), 404);
      }

      // 2. Update
      const data = await db.orm.{table}.update({
        where: { id },
        {
          ...params.data,
          updatedAt: new Date()
        }
      });

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('{module}.{action_name}_failed', {}, lang), 500);
    }
  },

  /**
   * Delete {module}
   */
  async {delete}(id: string, lang: SupportedLanguage = 'id') {
    try {
      // 1. Verify exists
      const existing = await db.orm.{table}.where({ id }).first();
      if (!existing) {
        throw new AppError(t('{module}.not_found', {}, lang), 404);
      }

      // 2. Delete (soft delete or hard delete based on design)
      await db.orm.{table}.delete({
        where: { id }
      });

      return { success: true };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(t('{module}.{action_name}_failed', {}, lang), 500);
    }
  }
};
```

---

### 2.4 Schema Template

File: `.matpock/templates/backend/schema.template.ts`

```typescript
import { z } from 'zod';
import { validateSchema } from '../../schemas/common.schema';

/**
 * Validation schemas for {module}
 * Defines request body and route validation
 */

// 1. Body Validation Schemas
// Define all body schemas with i18n error messages

export const {create}BodySchema = z.object({
  [{field}]: z.{type}(
    params.validation_constraints,
    "{module}.validation.{field}_rules"
  ),
  // ... other fields
});

export const {update}BodySchema = z.object({
  [{field}]: z.{type}(
    params.validation_constraints,
    "{module}.validation.{field}_rules"
  ).optional(),
  // ... other optional fields
});

// 2. Query Validation Schemas
export const {list}QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  [{optional_field}]: z.{type}().optional(),
});

// 3. Parameter Validation Schemas
export const {read}ParamsSchema = z.object({
  id: z.UUID,
});

export const {delete}ParamsSchema = z.object({
  id: z.UUID,
});

// 4. Route Schemas
export const {create}Schema = validateSchema({
  body: {create}BodySchema,
  headers: z.object({
    'x-user-id': z.string().uuid(), // Optional: Infer from JWT
  }).optional(),
});

export const {read}Schema = validateSchema({
  params: {read}ParamsSchema,
});

export const {list}Schema = validateSchema({
  querystring: {list}QuerySchema,
  headers: z.object({
    'x-user-id': z.string().uuid(),
  }).optional(),
});
```

---

### 2.5 Usage Example

```bash
# Generate new module
matpock run backend-scaffold module=order
# ✅ Created: src/modules/order/order.controller.ts
# ✅ Created: src/modules/order/order.service.ts
# ✅ Created: src/modules/order/order.routes.ts
# ✅ Created: src/modules/order/order.schema.ts
# ✅ Created: src/modules/order/order.type.ts

# Generate module with eager loading
matpock run backend-scaffold module=cart features=[EAGER_LOADING]
```

---

## 3. Frontend Component Generator

### 3.1 Skill Configuration

File: `.matpock/skills/frontend-component.yaml`

```yaml
name: frontend-component
version: 1.0.0
author: Tijarah Team
description: Scaffold atomic component following CA Pattern

trigger:
  pattern: /{component}/
  conditions:
    - component: /^Tijarah[A-Z][A-Za-z]+$/
    - condition: components/atom/{component}.tsx does not exist

variables:
  - name: component
    description: Component name (PascalCase)
    example: "TijarahButton", "TijarahInput"
    required: true
    constraint: /^Tijarah[A-Z][A-Za-z]+$

  - name: category
    description: Component category
    options:
      - atom
      - molecule
    default: atom

  - name: variants
    description: List of variants to generate
    default:
      - primary
      - secondary
      - outline
      - danger
    options: all variants from DESIGN_SYSTEM.md

  - name: features
    description: Additional features
    options:
      - ADA
      - LOADING
      - ICON

steps:
  # Step 1: Validate naming
  - name: Validate component name
    condition: component matches /^Tijarah[A-Z][A-Za-z]+$/
    if_not_match:
      error: "Component name must follow Tijarah{ComponentName} pattern"

  # Step 2: Choose output directory
  - name: Determine output path
    output: components/{category}/{component}.tsx

  # Step 3: Generate component structure
  - name: Create component
    operation: write_from_template
    source: templates/frontend/atom-component.template.tsx
    variables:
      COMPONENT_NAME: "{{component}}"
      VARIANTS: "{{variants}}"

  # Step 4: Add TypeScript types
  - name: Extract types
    operation: infer_types_from_props
    source: components/{category}/{component}.tsx
    output: components/types/{component}.types.ts

  # Step 5: Update programmatic registry
  - name: Update registry (optional)
    condition: exists .matpock/registry/components.ts
    operation: append_registry
    content:
      export { {component} } from './components/{category}/{component}';
      export type { {component}Props } from './components/{category}/{component}';

output:
  - "✅ Created component: components/{category}/{component}.tsx"
  - "✅ Created types: components/types/{component}.types.ts"
  - "ℹ️  Variants defined: {{variants}}"
  - "⚠️  TODO: Configure variants in DESIGN_SYSTEM.md"
```

---

### 3.2 Component Template

File: `.matpock/templates/frontend/atom-component-template.tsx`

```typescript
import React from "react";
import { /* Component */ } from "@heroui/react";
import clsx from "clsx";

// 1. Variants Configuration
export const {COMPONENT_NAME}Variants = {
  {variants_map} as const satisfies Record<string, string>;

// 2. Type Definitions
export type {COMPONENT_NAME}Variant = keyof typeof {COMPONENT_NAME}Variants;
export interface {COMPONENT_NAME}Props extends Omit<ComponentProps, "variant"> {
  ijaraVariant?: {COMPONENT_NAME}Variant;
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  [key: string]: any; // Allow additional props
}

// 3. Component Implementation
export const {COMPONENT_NAME}: React.FC<{COMPONENT_NAME}Props> = ({
  ijaraVariant = "{default_variant}",
  className,
  isLoading,
  startContent,
  endContent,
  children,
  disabled,
  size = "md",
  variant: heroVariant,
  ...props
}) => {
  const preset = {COMPONENT_NAME}Variants[ijaraVariant];

  // Handle disabled state
  const isDisabled = disabled || isLoading;

  return (
    </* Main Component */
      disabled={isDisabled}
      size={size}
      variant={heroVariant}
      className={clsx(
        "base-classes with-variants-classes",
        preset,
        className
      )}
      {...props}
      aria-disabled={isDisabled}
    >
      {isLoading ? (
        <Spinner size={size === 'sm' ? 'default' : 'lg'} />
      ) : (
        <>
          {startContent}
          {children}
          {endContent}
        </>
      )}
    <//* Component */
  );
};
```

---

### 3.3 Usage Example

```bash
# Generate atomic button component
matpock run frontend-component component=TijarahTable component=TijarahModal

# Generate button with specific variants
matpock run frontend-component component=TijerahButton variants=[primary,danger,success,warning,ghost,outline,gold]
```

---

## 4. Design Token Validator

### 4.1 Skill Configuration

File: `.matpock/skills/design-token-validator.yaml`

```yaml
name: design-token-validator
version: 1.0.0
author: Tijarah Team
description: Validate hardcoded design tokens against DESIGN_SYSTEM.md

trigger:
  on: ["pre-commit", "pre-push", "manual"]

conditions:
  - file_matches: ["*.tsx", "*.ts", "*.css"]
  - patterns:
    - hard-coded-colors
    - hard-coded-spacing
    - hard-coded-font-size

rules:
  color_rules:
    forbidden_non_design_token: [
      "bg-\\w+-\\d+",              # Tailwind color classes like bg-red-500
      "text-\\w+-\\d+",
      "border-\\w+-\\d+",
      /bg-[a-z]+-[0-9]+/           # Any hex color class
    ]

    required_design_tokens: [
      "bg-[var(--canvas)]",
      "bg-[var(--surface)]",
      "bg-[var(--primary-sage)]",
      "text-[var(--text-primary)]",
      "border-[var(--border-subtle)]"
    ]

  spacing_rules:
    forbidden_hardcoded_spacing: [
      /padding:\\s*\\d+px/,
      /margin:\\s*\\d+px/,
      /gap:\\s*\\d+px/,
      /style={{\\s*padding:\\s*\\d+px/
    ]

implementation:
  - name: Scan for hard-coded colors
    pattern: hard-coded-colors
    action: replace_with_token
    tokens: DESIGN_SYSTEM.md defined tokens

  - name: Flag invalid spacing
    pattern: forbidden_hardcoded_spacing
    action: suggest_tailwind_usage

output_format:
  markdown:
    header: "🎨 Design Token Validation Report"
    columns:
      - File
      - Line
      - Found
      - Suggestion
    examples:
      - | File | Line | Found | Suggestion |
      - |------|------|-------|------------|
      - | auth/.tsx | 15 | `bg-red-500` | `bg-[var(--status-danger)]` |

usage:
  manual:
    - command: matpock run design-token-validator
    - flags: --fix  # Apply auto-fixes

  precommit:
    - command: matpock run design-token-validator lint

  prepush:
    - command: matpock run design-token-validator validate
```

---

### 4.2 Validation Example

```bash
# Run validation manually
matpock run design-token-validator
```

**Output:**
```
🎨 Design Token Validation Report
================================================================================
⚠️  Potential non-design-token values found:

File: auth/LoginForm.tsx
  Line 24: ⚠️  bg-red-500
  Suggestion: bg-[var(--status-danger)]

  Line 145: ⚠️  mt-12px (inline style)
  Suggestion: mt-3

File: components/molecules/BadgeCard.tsx
  Line 8: ⚠️  text-green-600
  Suggestion: text-[var(--status-success)]

================================================================================
✅ 245 tokens validated as design tokens
❌ 4 tokens have suggestions
```

---

## 5. Naming Convention Checker

### 5.1 Skill Configuration

File: `.matpock/skills/naming-convention-checker.yaml`

```yaml
name: naming-convention-checker
version: 1.0.0
author: Tijarah Team
description: Validate naming conventions across frontend and backend

trigger:
  on: ["pre-commit", "pre-push"]

rules:
  backend:
    files:
      - /{module}.{controller|service|routes|schema}.ts/
    patterns:
      - export const {module}Controller = ...
      - export const {module}Service = ...

    rejection:
      illegal_naming_patterns: [
        "{module}CONTROLLER",        # Uppercase
        "controller_{module}",        # Underscore
        "{Module}Controller"          # PascalCase
      ]
      requirements:
        - module name all lowercase (kebab-case)
        - exported as object with suffix (Controller, Service)

  frontend:
    files:
      - components/**/*.{tsx,ts}
      - app/**/*.{tsx,ts}

    patterns:
      - /atom/Tijarah[A-Z].*\.tsx/
      - /molecule/[A-Z].+\.tsx/
      - export const [a-z]+ = ...

    rejection:
      illegal_naming_patterns: [
        "Component",                   # Tidak harus ada prefix
        "component",                   # lowercase
        "MY_COMPONENT"                 # UPPERCASE
      ]

  tests:
    files: "*.{test.ts,spec.ts}"
    patterns:
      - describe('[a-z ', () => {'
      - it('[a-z ', async () => {'

    rejection:
      illegal_naming_patterns: [
        "TEST",                         # Uppercase
        "TESTING",                      # All uppercase
        "Testing"                       # PascalCase
      ]

execution:
  - name: Scan backend files
    source_back_end: back-end/src/
    patterns: backend patterns

  - name: Scan frontend files
    source_front_end: front-end/src/
    patterns: frontend patterns

  - name: Scan test files
    source_packages: ./
    patterns: test patterns

format:
  json:
    structure:
      files: []
      violations: []
      severity: "error" | "warn"
```

---

### 5.2 Checker Output Example

```bash
matpock run naming-convention-checker
```

**Output:**
```json
{
  "timestamp": "2026-10-15T10:15:30Z",
  "files_scanned": 124,
  "violations": [
    {
      "file": "back-end/src/modules/user/user.controller.ts",
      "line": 10,
      "rule": "backend_naming",
      "offense": "export const UserController = {...}",
      "resolution": "Export as userController (lowercase)"
    },
    {
      "file": "front-end/src/components/atom/Button.tsx",
      "line": 15,
      "rule": "frontend_naming",
      "offense": "export const Button = {...}",
      "resolution": "Export as TijarahButton"
    }
  ],
  "summary": {
    "error_count": 2,
    "warning_count": 0,
    "pass_count": 122
  }
}
```

---

## 6. Git Commit Message Validator

### 6.1 Skill Configuration

File: `.matpock/skills/git-commit-validator.yaml`

```yaml
name: git-commit-validator
version: 1.0.0
author: Tijarah Team
description: Validate git commit messages against Conventional Commits

trigger:
  on: ["pre-commit"]

rules:
  type_patterns:
    - type: (feat|fix|merge|ci|docs|refactor|test|chore|style|perf)
      description: Must start with type
    - scope: ^([A-Za-z]+)(\/[A-Za-z]+)*$
      description: Scope (optional) in format "module" or "module/feature"

  description_rules:
    - pattern: /^[a-z][a-zA-Z0-9-]+.*$/
      description: Must start with lowercase
    - min_length: 10
    - max_length: 120

implementation:
  - name: Read staged files
    operation: get-staged-files

  - name: Extract commit message
    operation: read-msg-from-git

  - name: Parse commit message
    operation: regex-match type + scope + description

  - name: Validate with rules
    operations: apply-rules-from-criteria

  - name: Generate report
    operation: generate-html-report
```

---

### 6.2 Validation Example

```bash
matpock run git-commit-validator
```

**Output (HTML Report):**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Git Commit Message Validation</title>
    <style>
        .error { color: red; font-weight: bold; }
        .success { color: green; }
    </style>
</head>
<body>
    <h3>Commit Message: feat(auth): add OTP verification</h3>
    <table>
        <tr><th>Rule</th><th>Status</th><th>Message</th></tr>
        <tr><td>Conventional Commits format</td>
            <td class="error">❌</td>
            <td>Structure missing: type(scope): description</td>
        </tr>
        <tr><td>Valid type 'feat'</td>
            <td class="success">✅</td>
            <td>'feat' matches pattern (feat|fix|merge|...)</td>
        </tr>
        <tr><td>Valid scope 'auth'</td>
            <td class="success">✅</td>
            <td>'auth' matches scope pattern</td>
        </tr>
        <tr><td>Description starts lowercase</td>
            <td class="success">✅</td>
            <td>'add OTP verification' starts with lowercase 'a'</td>
        </tr>
        <tr><td>Description length</td>
            <td class="success">✅</td>
            <td>23 characters (within 10-120)</td>
        </tr>
    </table>
</body>
</html>
```

---

## 7. Integration & Execution

### 7.1 Pre-Commit Hook Setup

**File: `.husky/pre-commit` (if using Husky)**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run Matpock linting skills
matpock run design-token-validator lint
matpock run naming-convention-checker
matpock run git-commit-validator
```

### 7.2 Pre-Push Hook Setup

**File: `.husky/pre-push`**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run comprehensive validation before push
matpock run design-token-validator validate
matpock run naming-convention-checker (optional)
```

---

## 8. Global Rules Configuration

File: `.matpock/rules.json`

```json
{
  "backend": {
    "typeScriptVersion": "5.6.3",
    "minimumNodeJS": "22.0.0",
    "folderStructure": "/src/modules/{module}",
    "exportPattern": "{module}Controller, {module}Service",
    "errorHandling": "AppError pattern"
  },

  "frontend": {
    "appFramework": "Next.js 16",
    "uiLibrary": "NextUI v3",
    "atomicArchitecture": "components/atom/, components/molecule/",
    "variantSystem": "ComponentVariants object+type",
    "designTokens": "globals.css CSS variables"
  },

  "database": {
    "orm": "Prisma ORM",
    "database": "PostgreSQL",
    "migrationTool": "prisma migrate"
  }
}
```

---

## 9. Creating New Skills

### 9.1 Skill Template

```yaml
name: skill-name
version: x.x.x
author: Tijarah Team
description: Brief description

trigger:
  on: ["pre-commit", "pre-push", "manual"]
  pattern: /{variable}/

variables:
  - name: variable_name
    description: Description
    constraints: your_constraint

steps:
  # Define your steps here
```

### 9.2 Rules for Skill Implementation

1. **Always validate input first**
2. **Provide clear error messages**
3. **Maintain backward compatibility**
4. **Support optional features (flags)**
5. **Generate comprehensive output reports**
6. **Integrate with existing Matpock infrastructure**
7. **Document usage with examples**

---

## 10. Skill Testing

### 10.1 Testing Matrix

| Skill | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| backend-scaffold | ✅ | ✅ | ✅ |
| frontend-component | ✅ | ✅ | ✅ |
| design-token-validator | ✅ | ⚠️ | - |
| naming-convention-checker | ✅ | ✅ | - |
| git-commit-validator | ✅ | ✅ | - |

### 10.2 Test Functionality Checklist

- [ ] Generate correct file structure
- [ ] Validate naming conventions
- [ ] Generate proper TypeScript types
- [ ] Use design tokens correctly
- [ ] Pass all ESLint checks
- [ ] Match architecture patterns
- [ ] Generate helpful error messages
- [ ] Support manual overrides
- [ ] Provide comprehensive documentation

---

## 11. FAQ

**Q: Can I add custom skills?**
A: Yes! Simply create a new YAML file in `.matpock/skills/` following the template.

**Q: Do skills replace manual coding?**
A: No, skills are for scaffolding, validation, and enforcement. Manual coding is always required.

**Q: What happens if a skill fails?**
A: Skills will output detailed error messages with suggestions. CI/CD will fail with clear explanations.

**Q: Can I disable specific skills?**
A: Yes, by commenting the skills in `.husky/pre-commit` or using flags.

**Q: Do skills work with monorepos?**
A: Yes, skills support workspace/project-relative paths with proper configuration.

**Q: How do I update existing modules with skills?**
A: Skill supports "update" operations for existing modules (see `update` property).

---

**Last Updated:** 2026-10-15
**Version:** 1.0.0
**Maintained by:** Tijarah Team