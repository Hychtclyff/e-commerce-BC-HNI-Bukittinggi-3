# Custom Components - Tijarah UI System

## Pengenalan

Tijarah menggunakan **custom component wrapper** di atas **NextUI (HeroUI)** untuk memastikan konsistensi desain, dark mode support, dan semantic token usage. Setiap Tijarah component adalah abstraksi dari NextUI component yang:

1. **Enforces Design Tokens** - Semua warna menggunakan CSS variables (`--primary-sage`, `--status-danger`, etc.)
2. **Provides Semantic Variants** - Built-in variants untuk berbagai use case (primary, secondary, danger, success, warning, etc.)
3. **Supports Dark Mode** - Otomatis responsive terhadap `.dark` class
4. **Type-Safe** - Full TypeScript support dengan proper prop types

---

## 1. Atom Components (Reusable Primitives)

### 1.1 TijarahButton

**Base:** NextUI `Button` component

**File:** `components/atom/TijarahButton.tsx`

#### Variants

| Variant | Kegunaan |
|---------|----------|
| `primary` | Aksi utama (konfirmasi, simpan, kirim) |
| `secondary` | Aksi sekunder / state non-aktif filter tab |
| `outline` | Aksi sekunder dengan border tipis |
| `ghost` | Aksi tersembunyi / tab navigasi non-aktif |
| `success` | Persetujuan / acc |
| `warning` | Peringatan stok / status menunggu |
| `danger` | Penolakan / hapus |
| `gold` | Aksi premium / poin hadiah |

#### Props

```typescript
interface TijarahButtonProps extends Omit<ButtonProps, "variant"> {
  tijarahVariant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "success" | "warning" | "danger";
  heroVariant?: ButtonProps["variant"];
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}
```
- `tijarahVariant` — preset warna Tijarah (lihat tabel di atas)
- `heroVariant` — meneruskan ke HeroUI `variant` (flat, ghost, shadow, etc.) untuk layout; gunakan `ghost` untuk tab navigasi non-aktif
  gold: "bg-[var(--accent-gold)] hover:brightness-95 active:brightness-90 text-white dark:text-white shadow-sm border border-transparent",
  success: "bg-[var(--status-success)] hover:brightness-95 active:brightness-90 text-white dark:text-white shadow-sm border border-transparent",
  warning: "bg-[var(--status-warning)] hover:brightness-95 active:brightness-90 text-slate-900 font-semibold shadow-sm border border-transparent",
  danger: "bg-[var(--status-danger)] hover:brightness-95 active:brightness-90 text-white dark:text-white shadow-sm border border-transparent",
  ghost: "bg-transparent hover:bg-[var(--canvas)] active:bg-[var(--border-subtle)]/50 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent",
};
```

#### Props

```typescript
interface TijarahButtonProps extends Omit<ButtonProps, "variant"> {
  tijarahVariant?: "primary" | "secondary" | "outline" | "gold" | "success" | "warning" | "danger" | "ghost";
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}
```

#### Usage

```tsx
// Primary action
<TijarahButton tijarahVariant="primary" onClick={handleSubmit}>
  Submit
</TijarahButton>

// Tab navigasi: primary saat aktif, ghost saat tidak aktif
<TijarahButton
  heroVariant="ghost"
  tijarahVariant={isActive ? "primary" : "secondary"}
  onClick={() => setActive(true)}
>
  Overview
</TijarahButton>

// Loading state
<TijarahButton tijarahVariant="primary" isLoading={isSubmitting}>
  Processing...
</TijarahButton>

// With icons
<TijarahButton
  tijarahVariant="secondary"
  startContent={<SaveIcon />}
>
  Save Changes
</TijarahButton>
```

---

### 1.2 TijarahInput

**Base:** NextUI `Input` component

**File:** `components/atom/TijarahInput.tsx`

#### Features

- Design token border colors (`--border-subtle` default, `--status-danger` on error)
- Focus state dengan `--primary-sage` ring
- Dark mode auto-support
- Validation error state
- Disabled state with proper styling

#### Props

```typescript
interface TijarahInputProps extends Omit<InputProps, "variant"> {
  label?: string;
  description?: string;
  isInvalid?: boolean;
  errorMessage?: string;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}
```

#### Usage

```tsx
// Basic input
<TijarahInput
  label="Email"
  type="email"
  placeholder="user@example.com"
/>

// With validation
<TijarahInput
  label="Password"
  type="password"
  isInvalid={!!errors.password}
  errorMessage={errors.password?.message}
  description="Minimum 8 characters"
/>

// With icons
<TijarahInput
  label="Search"
  startContent={<SearchIcon />}
  endContent={<ClearIcon />}
  placeholder="Search products..."
/>
```

---

### 1.3 TijarahCard

**Base:** NextUI `Card` component

**File:** `components/atom/TijarahCard.tsx`

#### Features

- Background: `--surface` (white in light mode, dark gray in dark mode)
- Border: `--border-subtle` with subtle shadow
- Padding: Consistent `p-4` or `p-6`
- Support for header, body, footer sections

#### Props

```typescript
interface TijarahCardProps extends CardProps {
  header?: React.ReactNode;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  isPressable?: boolean;
  onPress?: () => void;
}
```

#### Usage

```tsx
// Basic card
<TijarahCard>
  <div className="p-4">
    <h3 className="font-semibold">Card Title</h3>
    <p className="text-sm text-[var(--text-muted)]">Card content here</p>
  </div>
</TijarahCard>

// Card with sections
<TijarahCard
  header={<div className="px-4 py-3 border-b border-[var(--border-subtle)]">Header</div>}
  body={<div className="p-4">Body content</div>}
  footer={<div className="px-4 py-3 border-t border-[var(--border-subtle)]">Footer</div>}
/>

// Pressable card (like product listing)
<TijarahCard isPressable onPress={() => navigate(`/products/${id}`)}>
  <img src={image} alt="product" className="w-full h-48 object-cover rounded-t-lg" />
  <div className="p-4">
    <h4 className="font-semibold">{name}</h4>
    <p className="text-[var(--accent-gold)]">Rp {price.toLocaleString('id-ID')}</p>
  </div>
</TijarahCard>
```

---

### 1.4 TijarahAlert

**Base:** Custom DIV (not NextUI Alert - for more flexibility)

**File:** `components/atom/TijarahAlert.tsx`

#### Variants

```typescript
export const TijarahAlertVariants = {
  success: "bg-[var(--status-success)]/10 border-[var(--status-success)] text-[var(--status-success)]",
  warning: "bg-[var(--status-warning)]/10 border-[var(--status-warning)] text-[var(--status-warning)]",
  danger: "bg-[var(--status-danger)]/10 border-[var(--status-danger)] text-[var(--status-danger)]",
  info: "bg-[var(--primary-sage)]/10 border-[var(--primary-sage)] text-[var(--primary-sage)]",
};
```

#### Props

```typescript
interface TijarahAlertProps {
  tijarahVariant?: "success" | "warning" | "danger" | "info";
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}
```

#### Usage

```tsx
// Success alert
<TijarahAlert
  tijarahVariant="success"
  title="Success"
  description="Your changes have been saved"
/>

// Warning alert with action
<TijarahAlert
  tijarahVariant="warning"
  title="Warning"
  description="This action cannot be undone"
  icon={<AlertIcon />}
  onClose={() => setShowAlert(false)}
/>

// Error alert inline
<TijarahAlert tijarahVariant="danger">
  {error?.message || "An error occurred"}
</TijarahAlert>
```

---

### 1.5 TijarahChip / TijarahBadge

**Base:** NextUI `Chip` component

**File:** `components/atom/TijarahChip.tsx`

#### Variants

```typescript
export const TijarahChipVariants = {
  default: "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]",
  success: "bg-[var(--status-success)]/20 text-[var(--status-success)] border border-[var(--status-success)]",
  warning: "bg-[var(--status-warning)]/20 text-[var(--status-warning)] border border-[var(--status-warning)]",
  danger: "bg-[var(--status-danger)]/20 text-[var(--status-danger)] border border-[var(--status-danger)]",
  primary: "bg-[var(--primary-sage)]/20 text-[var(--primary-sage)] border border-[var(--primary-sage)]",
};
```

#### Usage

```tsx
// Status badges
<div className="flex gap-2">
  <TijarahChip tijarahVariant="success">Active</TijarahChip>
  <TijarahChip tijarahVariant="warning">Pending</TijarahChip>
  <TijarahChip tijarahVariant="danger">Cancelled</TijarahChip>
</div>

// Removable chips
<TijarahChip 
  tijarahVariant="primary"
  onClose={() => removeTag(tag)}
>
  {tag}
</TijarahChip>
```

---

### 1.6 TijarahCheckbox

**Base:** NextUI `Checkbox` component

**File:** `components/atom/TijarahCheckbox.tsx`

#### Features

- Checked state: `--primary-sage` color
- Focus ring: `--primary-sage` outline
- Dark mode support
- Label support
- Indeterminate state

#### Usage

```tsx
// Basic checkbox
<TijarahCheckbox label="Accept terms and conditions" />

// With React Hook Form
<Controller
  control={control}
  name="agree"
  render={({ field }) => (
    <TijarahCheckbox
      {...field}
      label="I agree to the privacy policy"
      isInvalid={!!errors.agree}
    />
  )}
/>
```

---

### 1.7 TijarahModal

**Base:** NextUI `Modal` component

**File:** `components/atom/TijarahModal.tsx`

#### Features

- Background: `--canvas` with overlay
- Header/Body/Footer sections
- Close button support
- Keyboard escape support
- Customizable footer actions

#### Props

```typescript
interface TijarahModalProps extends ModalProps {
  title?: string;
  body?: React.ReactNode;
  footer?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void; isLoading?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
}
```

#### Usage

```tsx
// Confirmation modal
<TijarahModal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Delete"
  body="Are you sure you want to delete this item?"
  primaryAction={{
    label: "Delete",
    onClick: handleDelete,
    isLoading: isDeleting,
  }}
  secondaryAction={{
    label: "Cancel",
    onClick: onClose,
  }}
/>
```

---

### 1.8 TijarahDropdown

**Base:** NextUI `Select` or `Dropdown` component

**File:** `components/atom/TijarahDropdown.tsx`

#### Usage

```tsx
// Select dropdown
<TijarahDropdown
  label="Select Category"
  items={categories}
  value={selectedCategory}
  onChange={setSelectedCategory}
/>

// Multi-select
<TijarahDropdown
  label="Select Tags"
  items={availableTags}
  selectedKeys={selectedTags}
  onSelectionChange={setSelectedTags}
  selectionMode="multiple"
/>
```

---

### 1.9 TijarahLabel

**Base:** HTML `<label>` with custom styling

**File:** `components/atom/TijarahLabel.tsx`

#### Usage

```tsx
// Form label
<TijarahLabel htmlFor="email" isRequired>
  Email Address
</TijarahLabel>
<TijarahInput id="email" type="email" />
```

---

## 2. Molecule Components (Compound)

### 2.1 AuthCard

**Purpose:** Wrapper untuk form login/register

**File:** `components/molecule/AuthCard.tsx`

```tsx
export const AuthCard: React.FC<AuthCardProps> = ({
  title,
  subtitle,
  children,
  footer,
}) => {
  return (
    <TijarahCard className="w-full max-w-md">
      <div className="p-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-[var(--text-muted)]">{subtitle}</p>}
        </div>

        {children}

        {footer && <div className="text-center text-sm text-[var(--text-muted)]">{footer}</div>}
      </div>
    </TijarahCard>
  );
};
```

---

### 2.2 OrderSummary

**Purpose:** Display order items, subtotal, tax, total

**File:** `components/molecule/OrderSummary.tsx`

```tsx
export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  tax,
  discount,
  total,
  onCheckout,
  isLoading,
}) => {
  return (
    <TijarahCard>
      <div className="p-6 space-y-4">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span className="font-medium">Rp {item.total.toLocaleString('id-ID')}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-subtle)]" />

        {/* Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Subtotal</span>
            <span>Rp {subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--text-muted)]">Tax</span>
            <span>Rp {tax.toLocaleString('id-ID')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[var(--status-success)]">
              <span>Discount</span>
              <span>-Rp {discount.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="border-t border-[var(--border-subtle)] pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span className="text-[var(--accent-gold)]">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>

        {/* Action */}
        <TijarahButton
          tijarahVariant="primary"
          onClick={onCheckout}
          isLoading={isLoading}
          className="w-full"
        >
          Proceed to Checkout
        </TijarahButton>
      </div>
    </TijarahCard>
  );
};
```

---

### 2.3 ProductCard

**Purpose:** Display product with image, price, and actions

**File:** `components/molecule/ProductCard.tsx`

```tsx
export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  image,
  price,
  rating,
  onAddToCart,
  onViewDetails,
  isLoading,
}) => {
  return (
    <TijarahCard
      isPressable
      onPress={() => onViewDetails?.(id)}
      className="hover:shadow-lg transition-shadow"
    >
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden rounded-t-lg">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h4 className="font-semibold text-sm truncate">{name}</h4>

        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[var(--accent-gold)]">★ {rating.toFixed(1)}</span>
          </div>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-[var(--accent-gold)]">
          Rp {price.toLocaleString('id-ID')}
        </p>

        {/* Action */}
        <TijarahButton
          tijarahVariant="primary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart?.(id);
          }}
          isLoading={isLoading}
          className="w-full"
        >
          Add to Cart
        </TijarahButton>
      </div>
    </TijarahCard>
  );
};
```

---

## 3. Customization Guide

### 3.1 Modifying Component Styling

**Scenario:** Ingin mengubah border radius dari `rounded-lg` ke `rounded-xl`

**Option 1:** Update di template component
```tsx
// Before
className={clsx("rounded-lg ...", preset, className)}

// After
className={clsx("rounded-xl ...", preset, className)}
```

**Option 2:** Override via Tailwind `className` prop
```tsx
<TijarahButton className="rounded-xl">
  Custom Button
</TijarahButton>
```

---

### 3.2 Adding New Variant

**Scenario:** Ingin menambah `secondary-gold` variant untuk TijarahButton

```typescript
export const TijarahButtonVariants = {
  // ... existing
  "secondary-gold": "bg-[var(--accent-gold)]/20 hover:bg-[var(--accent-gold)]/30 border border-[var(--accent-gold)] text-[var(--accent-gold)]",
};

export type TijarahButtonVariant = keyof typeof TijarahButtonVariants;

// Usage
<TijarahButton tijarahVariant="secondary-gold">
  Secondary Gold
</TijarahButton>
```

---

### 3.3 NextUI to Tijarah Component Mapping

| NextUI Component | Tijarah Wrapper | Location |
|---|---|---|
| `Button` | `TijarahButton` | `components/atom/TijarahButton.tsx` |
| `Input` | `TijarahInput` | `components/atom/TijarahInput.tsx` |
| `Card` | `TijarahCard` | `components/atom/TijarahCard.tsx` |
| `Chip` | `TijarahChip` | `components/atom/TijarahChip.tsx` |
| `Checkbox` | `TijarahCheckbox` | `components/atom/TijarahCheckbox.tsx` |
| `Modal` | `TijarahModal` | `components/atom/TijarahModal.tsx` |
| `Select` / `Dropdown` | `TijarahDropdown` | `components/atom/TijarahDropdown.tsx` |

---

## 4. Best Practices for Custom Components

### ✅ DO:

- Use design tokens consistently (`--primary-sage`, `--status-*`, etc.)
- Support dark mode via CSS variables
- Provide variant system for flexibility
- Type-safe props with TypeScript
- Include JSDoc documentation
- Test in both light and dark modes
- Use `clsx()` for conditional classnames

### ❌ DON'T:

- Hardcode colors (use design tokens)
- Inline styles for colors/layout
- Mix NextUI colors with Tijarah tokens
- Create new variants without design approval
- Skip dark mode support
- Leave components undocumented

---

## 5. Component Registry

All custom components should be exported from a central index for easy imports:

**File:** `components/index.ts`

```typescript
// Atoms
export { TijarahButton } from './atom/TijarahButton';
export { TijarahInput } from './atom/TijarahInput';
export { TijarahCard } from './atom/TijarahCard';
export { TijarahAlert } from './atom/TijarahAlert';
export { TijarahChip } from './atom/TijarahChip';
export { TijarahCheckbox } from './atom/TijarahCheckbox';
export { TijarahModal } from './atom/TijarahModal';
export { TijarahDropdown } from './atom/TijarahDropdown';
export { TijarahLabel } from './atom/TijarahLabel';

// Molecules
export { AuthCard } from './molecule/AuthCard';
export { OrderSummary } from './molecule/OrderSummary';
export { ProductCard } from './molecule/ProductCard';
```

**Usage:**

```tsx
import { TijarahButton, AuthCard, OrderSummary } from '@/components';
```

---

**Last Updated:** 2026-10-15
**Version:** 1.0.0