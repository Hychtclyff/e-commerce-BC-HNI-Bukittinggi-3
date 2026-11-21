# 🎨 Panduan Standardisasi Komponen Atom Tijarah (`Tijarah UI Atom Components`)

Dokumen ini berisi petunjuk dan aturan standar dalam membuat serta mengelola komponen UI tingkat Atom (common components) pada sistem **Tijarah**.

---

## 📌 1. Konvensi Penamaan & Lokasi File

1. **Penamaan Komponen & File**:
   - Setiap komponen atom **WAJIB** diawali dengan nama sistem `Tijarah` menggunakan `PascalCase` untuk komponen (contoh: `TijarahButton`, `TijarahInput`, `TijarahLabel`, `TijarahBadge`, `TijarahCard`).
   - Penamaan nama file menggunakan `camelCase` (contoh: `tijarahInput.tsx`, `tijarahButton.tsx`, `tijarahLabel.tsx`).
2. **Lokasi Penyimpanan Komponen**:
   - Seluruh komponen atom disimpan pada direktori: [`components/atom/`](file:///d:/Developer/Tijarah/front-end/components/atom)

---

## 🎨 2. Prinsip Styling & Design System

1. **Konsistensi Tailwind CSS**:
   - Seluruh styling komponen menggunakan **Tailwind CSS** untuk menjaga keseragaman di seluruh aplikasi.
   - Gunakan utility `clsx` (atau `tailwind-merge` jika ada) untuk menggabungkan style dasar, varian, dan `className` eksternal.
2. **Dukungan Dark Mode & Responsif**:
   - Komponen **WAJIB** mendukung **Dark Mode** secara visual dengan prefix `dark:` (misal: `bg-white dark:bg-slate-900 text-slate-900 dark:text-white`).
   - Komponen harus bersifat **Responsif** (menggunakan breakpoint Tailwind seperti `sm:`, `md:`, `lg:`).
3. **Clean Code & DRY (Don't Repeat Yourself)**:
   - Hindari *hardcoding* style atau pengulangan kelas yang sama.
   - Selalu definisikan variant preset styling dalam bentuk objek/konstanta terpusat (`tijarahVariants`) di dalam file komponen atau file konfigurasi tema global jika dipadukan dengan style dasar proyek.
4. Basenya tetap HeroUi jadi ini fungsinya custome heroUI
5. penamaan variants atau group component itu jangan kaku, sesuaikan dengan konteks aplikasi
6. Jangan terpaku dengan contoh style yang diberikan, sesuaikan dengan konteks aplikasi
7. styling sesuia dengan global css
8. jika ada heroui prop yang sama seperti di komponen child maka timpa dengan component TIjarah
9. jika butuh penambahan style di css global maka sesuikan dengan yang sudah ada dan tambahkan pada file globabl css
10. jika ada heroui dan ada tambahan class maka tambahka pada komponen TIjarah
11. gunakan heroui sebagai komponen dasar
12. pastikan menggunakan type yang sudah ada di heroui dan sesuaikan dengan kebutuhan
13. pastikan menggunakan class tailwind dan jangan gunakan inline style
14. selalu gunakan komponen yang sudah ada di heroui dan sesuaikan dengan kebutuhan
15. jika ada tambahan styling atau properti pada heroui maka tambahka pada komponen TIjarah
16. jika membutuhkan icon guunakan icon library secara konsisten

---

## 📄 3. Standar Dokumentasi Komponen (`.md`)

Setiap kali komponen atom baru dibuat atau dimodifikasi:
1. Buatkan atau perbarui dokumen panduan penggunaan (`.md`) yang disimpan di folder [`.agents/docs/`](file:///d:/Developer/Tijarah/front-end/.agents/docs) (atau `.agents/tijarah<Component>.md`).
2. Format dokumentasi harus mencakup:
   - **Deskripsi & Kegunaan**: Fungsi utama komponen.
   - **Daftar Props & Variant**: Tabel prop yang didukung (misal: `tijarahVariant`, `size`, `isDisabled`, dll.).
   - **Contoh Penggunaan (Usage Example)**: Snippet kode penggunaan komponen dalam form atau halaman.
   - **Petunjuk Kustomisasi**: Cara melakukan *override* atau ekstensi styling.
   - jangan menggunakan inline style dalam bentuk apapun

---

## 🏗️ 4. Template / Struktur Standar Komponen Atom

```tsx
import React from "react";
import clsx from "clsx";
// Import primitif/HeroUI jika diperlukan
import { ButtonProps } from "@heroui/react";

// 1. Definisi preset varian secara terpusat (DRY & Reusable)
// nama variable dan styling jangan terpaku pada contoh dibawah bisa disesuikan dengan konteks aplikasi
const tijarahButtonVariants = { 
  primary: "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600",
  secondary: "bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200",
  outline: "border border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-slate-800",
  danger: "bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600",
} as const; 

export type TijarahButtonVariant = keyof typeof tijarahButtonVariants;

export interface TijarahButtonProps extends ButtonProps {
  tijarahVariant?: TijarahButtonVariant;
}

export const TijarahButton: React.FC<TijarahButtonProps> = ({
  tijarahVariant = "primary",
  className,
  children,
  ...props
}) => {
  return (
    <Button
      className={clsx(
        "rounded-lg px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50",
        tijarahButtonVariants[tijarahVariant],
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
};
```

---

## 📋 5. Daftar Rencana Komponen Common (Roadmap)

- [x] **`TijarahInput`**: Komponen input teks standar (`tijarahInput.tsx`).
- [x] **`TijarahButton`**: Komponen tombol dengan varian visual (`tijarahButton.tsx`).
- [x] **`TijarahLabel`**: Komponen label teks pendamping input (`tijarahLabel.tsx`).
- [x] **`TijarahBadge`**: Komponen chip/badge status visual (`tijarahBadge.tsx`).
- [x] **`TijarahAlert`**: Komponen alert notifikasi lengkap (`tijarahAlert.tsx`).
- [x] **`TijarahCard`**: Komponen container card lengkap (Header, Title, Body/Content, Footer) (`tijarahCard.tsx`).
- [x] **`TijarahChip`**: Komponen chip/tag interaktif (`tijarahChip.tsx`).
- [x] **`TijarahSelect`**: Komponen select dengan popover & item listbox (`tijarahSelect.tsx`).
- [x] **`TijarahCheckbox`**: Komponen checkbox dengan label & kontrol (`tijarahCheckbox.tsx`).
- [x] **`TijarahRadioBtn`**: Komponen radio button & radio group (`tijarahRadioBtn.tsx`).
- [x] **`TijarahTextArea`**: Komponen textarea input banyak baris (`tijarahTextArea.tsx`).
- [x] **`TijarahDropdown`**: Komponen dropdown menu melayang (`tijarahDropdown.tsx`).