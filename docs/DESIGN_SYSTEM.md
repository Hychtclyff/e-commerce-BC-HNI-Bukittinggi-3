# Design System - Tijarah Frontend

## Pengenalan

Design System Tijarah adalah panduan lengkap untuk membangun UI yang konsisten, accessible, dan scalable di frontend. Sistem ini menggunakan **Design Tokens** sebagai single source of truth untuk warna, spacing, typography, dan komponen.

---

## Related Documentation

| Topic | Documentation | Link |
|-------|--------------|------|
| **Custom Components** | Complete guide untuk all Tijarah components wrapper dengan NextUI | [CUSTOM_COMPONENTS.md](./CUSTOM_COMPONENTS.md) |
| **Code Graph** | Architecture diagram & dependency mapping | [CODE_GRAPH.md](./CODE_GRAPH.md) |
| **Backend Architecture** | Backend API patterns, database, authentication | [BACKEND_ARCHITECTURE.md](./BACKEND_ARCHITECTURE.md) |
| **Coding Convention** | Naming, TypeScript conventions, git commits | [CODING_CONVENTION.md](./CODING_CONVENTION.md) |
| **Matpock Skills** | Skills untuk automate development | [MATPOCK_SKILLS.md](./MATPOCK_SKILLS.md) |

**Quick Links:**
- 🎨 For building UI: [Custom Components docs](./CUSTOM_COMPONENTS.md)
- 📊 For understanding architecture: [Code Graph docs](./CODE_GRAPH.md)
- 🛠️ For backend development: [Backend Architecture](./BACKEND_ARCHITECTURE.md)

---

## 1. Design Tokens (Color, Spacing, Typography)

### 1.1 Warna - Design Tokens

Semua warna didefinisikan di `styles/globals.css` menggunakan CSS custom properties (variables). Ini memastikan konsistensi di light mode dan dark mode.

#### **Light Mode (Default)**
```css
:root {
  /* Surface & Base */
  --canvas: hsl(140 14% 97%);           /* Background utama aplikasi */
  --surface: hsl(0 0% 100%);            /* Surface untuk kartu, modal */
  
  /* Borders & Text */
  --border-subtle: hsl(140 10% 88%);    /* Border warna netral */
  --text-primary: hsl(146 14% 13%);     /* Text utama (dark green) */
  --text-muted: hsl(142 8% 44%);        /* Text secondary (abu-abu) */
  
  /* Brand Colors */
  --primary-sage: hsl(142 13% 42%);     /* Primary brand color (sage green) */
  --primary-dark: hsl(142 15% 34%);     /* Dark variant untuk hover */
  --accent-gold: hsl(44 67% 46%);       /* Accent color (gold) */
  
  /* Semantic Status */
  --status-success: hsl(142 70% 35%);   /* Success (hijau) */
  --status-warning: hsl(38 92% 50%);    /* Warning (kuning) */
  --status-danger: hsl(0 72% 51%);      /* Danger (merah) */
}
```

#### **Dark Mode**
```css
.dark {
  --canvas: hsl(146 15% 8%);
  --surface: hsl(146 14% 12%);
  --border-subtle: hsl(146 10% 20%);
  --text-primary: hsl(140 14% 95%);
  --text-muted: hsl(142 8% 65%);
  --primary-sage: hsl(142 15% 48%);
  --primary-dark: hsl(142 15% 58%);
  --accent-gold: hsl(44 67% 55%);
  --status-success: hsl(142 70% 45%);
  --status-warning: hsl(38 92% 60%);
  --status-danger: hsl(0 72% 60%);
}
```

### 1.2 Penggunaan Warna di Tailwind

Tailwind config sudah setup untuk mengakses tokens:

```tsx
// ✅ Menggunakan design token
<div className="bg-[var(--canvas)] text-[var(--text-primary)]">
  Primary Text
</div>

<button className="bg-[var(--primary-sage)] hover:bg-[var(--primary-dark)]">
  Action
</button>

// ❌ JANGAN: hardcoded color
<div className="bg-red-500 text-blue-600">
  Wrong
</div>
```

## 1.4 macOS / MacBook Style Aesthetics
Frontend Tijarah mengadopsi estetika **macOS / MacBook style** untuk menciptakan pengalaman visual yang bersih, elegan, dan profesional:
- **Typography & Smoothing**: Menggunakan `-webkit-font-smoothing: antialiased` agar teks tajam dan nyaman dibaca (San Francisco feel).
- **Frosted Glass (`.mac-glass`)**: Efek transparansi dengan backdrop blur untuk navbar, kartu elevated, dan modal.
  ```css
  .mac-glass {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
  .dark .mac-glass {
    background: rgba(20, 24, 22, 0.75);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
  }
  ```
- **Soft Layered Shadows (`.mac-shadow`)**: Bayangan lembut berlapis dan border tipis halus khas jendela macOS.
  ```css
  .mac-shadow {
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
  }
  .dark .mac-shadow {
    box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.08);
  }
  ```

#### 1.4.1 Status / Semantic Badge Tokens

Badge menggunakan CSS custom properties untuk konsistensi warna status, tersedia di light & dark mode:

| Token | Light | Dark |
|-------|-------|------|
| `--badge-primary-bg` / `--badge-primary-text` / `--badge-primary-border` | Sage hijau | Sage gelap |
| `--badge-secondary-bg` / `--badge-secondary-text` / `--badge-secondary-border` | Canvas netral | Canvas terang |
| `--badge-success-bg` / `--badge-success-text` | Hijau sukses | Hijau cerah |
| `--badge-warning-bg` / `--badge-warning-text` | Amber peringatan | Amber terang |
| `--badge-danger-bg` / `--badge-danger-text` | Merah bahaya | Merah cerah |

```css
:root {
  --badge-primary-bg: #e8f5e9;
  --badge-primary-text: #1b5e20;
  --badge-primary-border: #c8e6c9;
  --badge-secondary-bg: #f0f0f0;
  --badge-secondary-text: #333;
  --badge-secondary-border: #d0d0d0;
  --badge-success-bg: #dcfce7;
  --badge-success-text: #166534;
  --badge-success-border: #86efac;
  --badge-warning-bg: #fef3c7;
  --badge-warning-text: #92400e;
  --badge-warning-border: #fde68a;
  --badge-danger-bg: #fee2e2;
  --badge-danger-text: #991b1b;
  --badge-danger-border: #fca5a5;
}
.dark {
  --badge-primary-bg: #1a2e1a;
  --badge-primary-text: #a5d6a7;
  --badge-primary-border: #2e7d32;
  --badge-secondary-bg: #2a2a2a;
  --badge-secondary-text: #c0c0c0;
  --badge-secondary-border: #404040;
  --badge-success-bg: #064e35;
  --badge-success-text: #6ee7b7;
  --badge-success-border: #10b981;
  --badge-warning-bg: #78350f;
  --badge-warning-text: #fcd34d;
  --badge-warning-border: #f59e0b;
  --badge-danger-bg: #7f1d1d;
  --badge-danger-text: #fca5a5;
  --badge-danger-border: #ef4444;
}
```

#### 1.4.2 Corner Radius & Elevation Tokens

| Token | Value | macOS/iOS Equivalen |
|-------|-------|---------------------|
| `--radius-xs` | 2px | — |
| `--radius-sm` | 4px | — |
| `--radius-md` | 8px | Default corner |
| `--radius-lg` | 12px | Card / panel |
| `--radius-xl` | 16px | Sheet / popover |
| `--radius-full` | 9999px | Pills / badges |

**Contoh:** `<div className="rounded-[var(--radius-lg)] mac-glass mac-shadow">`

#### macOS / iOS Utility Guidelines

Semua permukaan (`Card`, `Table`, `Sidebar`, `Modal`, `Header`) wajib memakai `.mac-glass` dan `.mac-shadow` sebagai base styling, dengan border `border-[var(--border-subtle)]` dan `rounded-[var(--radius-lg)]` atau `rounded-2xl`. Semua warna/warna latar harus memakai CSS var token (`--canvas`, `--surface`, `--border-subtle`, `--status-*`, `--primary-sage`) agar dark mode bertransisi otomatis.

```css
@theme {
  --spacing-xs: 0.25rem;    /* 4px */
  --spacing-sm: 0.5rem;     /* 8px */
  --spacing-md: 1rem;       /* 16px */
  --spacing-lg: 1.5rem;     /* 24px */
  --spacing-xl: 2rem;       /* 32px */
  --spacing-2xl: 3rem;      /* 48px */
}
```

**Contoh Penggunaan:**
```tsx
// ✅ Baik: gunakan spacing utility
<div className="p-4 gap-6 rounded-lg">

// ❌ Jangan: hardcoded pixel values
<div style={{ padding: '16px', gap: '24px' }}>
```

### 1.4 Typography

Fonts sudah disetup di `config/fonts.ts`:

```typescript
export const fonts = {
  sans: ['var(--font-sans)', 'sans-serif'],
  mono: ['var(--font-mono)', 'monospace'],
};
```

**Font Scale:**
- **Text XS**: 12px, line-height 1.5
- **Text SM**: 14px, line-height 1.5
- **Text BASE**: 16px, line-height 1.6
- **Text LG**: 18px, line-height 1.6
- **Heading SM**: 20px, font-weight 600
- **Heading MD**: 24px, font-weight 600
- **Heading LG**: 32px, font-weight 700

```tsx
// ✅ Gunakan Tailwind typography
<h1 className="text-3xl font-bold">Heading</h1>
<p className="text-base text-[var(--text-muted)]">Body text</p>

// ❌ Jangan: inline font sizes
<h1 style={{ fontSize: '32px' }}>
```

---

## 2. Component Structure (Atomic Design)

Tijarah menggunakan **Atomic Design Pattern**:

### 2.1 Atom Components (`components/atom/`)

**Definisi:** UI primitif yang tidak bergantung pada sesamanya. Reusable di mana saja.

**Contoh:**
- `TijarahButton.tsx` - Button dengan variants (primary, secondary, outline, danger, etc.)
- `TijarahInput.tsx` - Form input dengan validation states
- `TijarahCard.tsx` - Card container
- `TijarahChip.tsx` - Badge/chip component
- `TijarahCheckbox.tsx` - Checkbox input
- `TijarahLabel.tsx` - Label untuk form fields
- `TijarahModal.tsx` - Modal dialog

**Pattern:**

```typescript
// 1. Define Variants
export const TijarahButtonVariants = {
  primary: "bg-[var(--primary-sage)] hover:bg-[var(--primary-dark)] ...",
  secondary: "bg-[var(--surface)] border border-[var(--border-subtle)] ...",
  outline: "border border-[var(--primary-sage)] bg-transparent ...",
  danger: "bg-[var(--status-danger)] hover:brightness-95 ...",
  success: "bg-[var(--status-success)] hover:brightness-95 ...",
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
      className={clsx(
        "font-medium transition-all duration-200 rounded-lg px-4 py-2",
        preset,
        className
      )}
    >
      {isLoading ? <Spinner size="sm" /> : (
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

### 2.2 Molecule Components (`components/molecule/`)

**Definisi:** Kombinasi dari atoms yang membentuk unit fungsional.

**Contoh:**
- `AuthCard.tsx` - Wrapper untuk form login/register
- `OrderSummary.tsx` - Menampilkan ringkasan order (item list + total)
- `ProductCard.tsx` - Produk dengan gambar, harga, dan tombol aksi
- `HeaderWithBreadcrumb.tsx` - Header + breadcrumb navigation

**Pattern:**

```typescript
interface OrderSummaryProps {
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  onCheckout: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  subtotal,
  tax,
  total,
  onCheckout,
}) => {
  return (
    <TijarahCard className="p-6 gap-4 flex flex-col">
      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between">
            <span>{item.name}</span>
            <span>Rp {item.price.toLocaleString('id-ID')}</span>
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
          <span className="text-[var(--text-muted)]">Pajak</span>
          <span>Rp {tax.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      {/* Total */}
      <div className="border-t border-[var(--border-subtle)] pt-2">
        <div className="flex justify-between font-semibold text-lg">
          <span>Total</span>
          <span>Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>
      
      {/* Action */}
      <TijarahButton
        tijarahVariant="primary"
        onClick={onCheckout}
        className="w-full"
      >
        Proceed to Checkout
      </TijarahButton>
    </TijarahCard>
  );
};
```

### 2.3 Feature/Module Components (`components/{feature}/`)

**Definisi:** Page-level atau feature-level components. Complex logic + data fetching.

**Struktur:**

```
components/
├── auth/
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── OTPVerification.tsx
├── checkout/
│   ├── CheckoutSummary.tsx
│   ├── PaymentMethod.tsx
│   └── ShippingAddress.tsx
└── shop/
    ├── ProductGrid.tsx
    ├── FilterSidebar.tsx
    └── ProductDetail.tsx
```

---

## 3. Hardcoded Values Refactoring Guide

### 3.1 Deteksi Hardcoded Values

**Pattern yang harus di-refactor:**

```typescript
// ❌ BEFORE: Hardcoded colors
<div className="bg-blue-500 text-red-600">

// ✅ AFTER: Design token
<div className="bg-[var(--primary-sage)] text-[var(--status-danger)]">

// ❌ BEFORE: Inline pixel values
<div style={{ padding: '20px', marginTop: '16px' }}>

// ✅ AFTER: Tailwind utilities
<div className="p-5 mt-4">

// ❌ BEFORE: Magic numbers
const delay = 300;
const maxRetries = 5;

// ✅ AFTER: Named constants
const ANIMATION_DELAY_MS = 300;
const MAX_API_RETRIES = 5;
```

### 3.2 Refactoring Checklist

Ketika membuat/memodifikasi component:

- [ ] Semua warna menggunakan `var(--token-name)`
- [ ] Semua spacing menggunakan Tailwind utilities (`p-4`, `gap-6`, etc.)
- [ ] Semua typography menggunakan Tailwind classes (`text-lg`, `font-semibold`)
- [ ] Tidak ada inline `style={}` dengan hardcoded values
- [ ] Tidak ada magic numbers di logic (konstanta dengan nama deskriptif)
- [ ] Dark mode kompatibel (test dengan `.dark` class)

---

## 4. Component Naming Convention

### 4.1 Atom Components

**Format:** `Tijarah{ComponentName}.tsx`

```
TijarahButton.tsx
TijarahInput.tsx
TijarahCard.tsx
TijarahCheckbox.tsx
TijarahModal.tsx
TijarahDropdown.tsx
TijarahChip.tsx
TijarahBadge.tsx
TijarahLabel.tsx
```

**Export:** Named export dengan PascalCase

```typescript
export const TijarahButton: React.FC<TijarahButtonProps> = ({ ... });
export type TijarahButtonVariant = keyof typeof TijarahButtonVariants;
```

### 4.2 Molecule Components

**Format:** `{FeatureName}{ComponentName}.tsx` (PascalCase)

```
OrderSummary.tsx
AuthCard.tsx
ProductCard.tsx
UserProfile.tsx
HeaderNavbar.tsx
```

### 4.3 Module/Feature Components

**Format:** Folder feature + component files

```
auth/
├── LoginForm.tsx
├── RegisterForm.tsx
├── OTPVerification.tsx

checkout/
├── CheckoutFlow.tsx
├── PaymentForm.tsx

shop/
├── ProductGrid.tsx
├── FilterPanel.tsx
```

---

## 5. Variant System (Button, Input, Card, etc.)

Semua atom component mendukung variants untuk flexibility.

### 5.1 Button Variants

```typescript
const variants = {
  primary: "bg-[var(--primary-sage)] text-white hover:bg-[var(--primary-dark)]",
  secondary: "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]",
  outline: "border border-[var(--primary-sage)] text-[var(--primary-sage)] bg-transparent",
  ghost: "text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-transparent",
  danger: "bg-[var(--status-danger)] text-white hover:brightness-95",
  success: "bg-[var(--status-success)] text-white hover:brightness-95",
  warning: "bg-[var(--status-warning)] text-slate-900 font-semibold",
  gold: "bg-[var(--accent-gold)] text-white hover:brightness-95",
};
```

**Penggunaan:**

```tsx
<TijarahButton tijarahVariant="primary">Primary Action</TijarahButton>
<TijarahButton tijarahVariant="secondary">Secondary</TijarahButton>
<TijarahButton tijarahVariant="danger">Delete</TijarahButton>
<TijarahButton tijarahVariant="success">Confirm</TijarahButton>
<TijarahButton tijarahVariant="outline">Cancel</TijarahButton>
```

---

## 6. Dark Mode Implementation

Semua komponen harus support dark mode tanpa extra configuration.

**Prinsip:**
1. Dark mode colors sudah defined di CSS variables
2. Component automatically use dark mode variant via `next-themes`
3. Test component di both light & dark mode

```tsx
// ✅ Component otomatis responsive terhadap dark mode
export const MyComponent = () => {
  return (
    <div className="bg-[var(--canvas)] text-[var(--text-primary)]">
      {/* Akan otomatis pakai dark mode token saat .dark class applied */}
    </div>
  );
};

// ✅ Ketika perlu explicit dark mode styles
<div className="bg-white dark:bg-slate-900">
```

---

## 7. Animation & Transition

### 7.1 Pre-defined Animations

```css
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes floatSlow {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-10px) scale(1.04); }
}

@keyframes pulseGlow {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.28; transform: scale(1.08); }
}

@keyframes popIn {
  0% { opacity: 0; transform: scale(0.96) translateY(12px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
```

### 7.2 Animation Classes

```typescript
// ✅ Gunakan pre-defined animation classes
<div className="animate-fade-in-up">Content</div>
<div className="animate-pop-in">Modal</div>
<div className="animate-float-slow">Floating Element</div>
<div className="animate-pulse-glow">Glow Effect</div>

// ✅ Transition utilities
<button className="transition-all duration-200 hover:scale-105">
  Hover me
</button>
```

---

## 8. Accessibility (A11y)

### 8.1 ARIA Attributes

```tsx
// ✅ Button dengan loading state
<button aria-busy={isLoading} aria-label="Submit form">
  {isLoading ? <Spinner /> : 'Submit'}
</button>

// ✅ Form inputs with labels
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-describedby="email-error" />
<span id="email-error" role="alert">{error}</span>

// ✅ Modal dengan proper ARIA
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Action</h2>
</div>
```

### 8.2 Keyboard Navigation

```tsx
// ✅ Support keyboard navigation
<button onClick={handleClose} onKeyDown={(e) => {
  if (e.key === 'Escape') handleClose();
}}>
  Close
</button>
```

### 8.3 Color Contrast

Semua warna di design system sudah tested untuk WCAG AA compliance:
- Primary sage + white text: ✅ 4.5:1 ratio
- Status danger + white text: ✅ 4.5:1 ratio

---

## 9. Best Practices Checklist

Setiap component harus memenuhi:

- [ ] ✅ Menggunakan design tokens (tidak ada hardcoded colors)
- [ ] ✅ Variants pattern di-implement (jika applicable)
- [ ] ✅ Props well-typed dengan TypeScript
- [ ] ✅ Component documented dengan JSDoc
- [ ] ✅ Dark mode support
- [ ] ✅ Responsive (mobile, tablet, desktop)
- [ ] ✅ Accessibility attributes (aria-*, role)
- [ ] ✅ No inline styles (gunakan Tailwind)
- [ ] ✅ Consistent spacing & padding

---

## 10. Quick Reference

### Color Token Map

| Token | Light | Dark | Use Case |
|-------|-------|------|----------|
| `--canvas` | #F8FAF7 | #1A1F1B | App background |
| `--surface` | #FFFFFF | #1F2620 | Cards, modals, surfaces |
| `--primary-sage` | #6B8E6F | #7A9E7C | Primary action, links |
| `--accent-gold` | #B8A000 | #D4B800 | Highlights, accents |
| `--status-danger` | #E53E3E | #F56565 | Errors, destructive actions |
| `--status-success` | #389E0D | #52C41A | Success messages |
| `--status-warning` | #FF9C6E | #FFA940 | Warnings, caution |

### Component Quick Links

- **Atoms**: `components/atom/` - Basic UI primitives
- **Molecules**: `components/molecule/` - Compound components
- **Features**: `components/{feature}/` - Page-level logic
- **Styles**: `styles/globals.css` - Design tokens
- **Config**: `config/fonts.ts`, `config/site.ts`

---

## 11. Refactoring Existing Components

### Phase 1: Audit
1. Scan semua `.tsx` files untuk hardcoded colors
2. Buat list komponen yang perlu refactor

### Phase 2: Refactor
1. Replace hardcoded colors → design tokens
2. Remove inline styles → Tailwind utilities
3. Add/improve variants jika ada

### Phase 3: Test
1. Visual test di light mode
2. Visual test di dark mode
3. Responsive test (mobile, tablet, desktop)

---

**Last Updated:** 2026-10-15
**Version:** 1.0.0
