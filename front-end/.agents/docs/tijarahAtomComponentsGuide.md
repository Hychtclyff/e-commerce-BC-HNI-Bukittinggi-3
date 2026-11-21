# 📚 Panduan Penggunaan Komponen Atom Tijarah (`Tijarah UI Atom Components`)

Dokumen ini berisi panduan lengkap penggunaan, varian visual, tipe props, serta contoh implementasi komponen atom **Tijarah UI** di dalam aplikasi.

Seluruh komponen atom disimpan pada folder [`components/atom/`](file:///d:/Developer/Tijarah/front-end/components/atom).

---

## 🧭 Daftar Komponen Atom

1. [`TijarahButton`](#1-tijarahbutton)
2. [`TijarahInput`](#2-tijarahinput)
3. [`TijarahLabel`](#3-tijarahlabel)
4. [`TijarahBadge`](#4-tijarahbadge)
5. [`TijarahAlert`](#5-tijarahalert)
6. [`TijarahCard`](#6-tijarahcard)
7. [`TijarahChip`](#7-tijarahchip)
8. [`TijarahSelect`](#8-tijarahselect)
9. [`TijarahCheckbox`](#9-tijarahcheckbox)
10. [`TijarahRadioBtn`](#10-tijarahradiobtn)
11. [`TijarahTextArea`](#11-tijarahtextarea)
12. [`TijarahDropdown`](#12-tijarahdropdown)

---

## 1. `TijarahButton`

Komponen tombol interaktif berbasis HeroUI `Button` dengan preset varian kontekstual, state hover, active, serta dark mode.

### Varian (`tijarahVariant`):
- `primary`: Tombol aksi utama (biru).
- `secondary`: Tombol sekunder (slate/abu).
- `outline`: Tombol bergaris tepi.
- `danger`: Tombol aksi destruktif (merah).
- `ghost`: Tombol transparan tanpa garis tepi.

### Contoh Penggunaan:
```tsx
import { TijarahButton } from "@/components/atom/tijarahButton";

export const ExampleButton = () => (
  <div className="flex gap-2">
    <TijarahButton tijarahVariant="primary">Simpan Data</TijarahButton>
    <TijarahButton tijarahVariant="outline">Batal</TijarahButton>
    <TijarahButton tijarahVariant="danger">Hapus</TijarahButton>
  </div>
);
```

---

## 2. `TijarahInput`

Komponen input teks tunggal berbasis HeroUI `Input`.

### Varian (`tijarahVariant`):
- `primary`: Border standar dengan fokus biru.
- `secondary`: Latar belakang flat abu-abu.
- `error`: Status validasi gagal dengan border & latar belakang merah.

### Contoh Penggunaan:
```tsx
import { TijarahInput } from "@/components/atom/tijarahInput";

export const ExampleInput = () => (
  <TijarahInput
    tijarahVariant="primary"
    placeholder="Masukkan email anda..."
    type="email"
  />
);
```

---

## 3. `TijarahLabel`

Komponen label penjelas untuk form input dengan dukungan penanda field wajib (`isRequired`) dan indikator error.

### Contoh Penggunaan:
```tsx
import { TijarahLabel } from "@/components/atom/tijarahLabel";
import { TijarahInput } from "@/components/atom/tijarahInput";

export const ExampleField = () => (
  <div className="flex flex-col gap-1.5">
    <TijarahLabel isRequired>Alamat Email</TijarahLabel>
    <TijarahInput placeholder="name@example.com" />
  </div>
);
```

---

## 4. `TijarahBadge`

Komponen badge/label kecil status visual.

### Varian (`tijarahVariant`):
- `primary`, `secondary`, `success`, `warning`, `danger`

### Contoh Penggunaan:
```tsx
import { TijarahBadge } from "@/components/atom/tijarahBadge";

export const ExampleBadge = () => (
  <div className="flex gap-2">
    <TijarahBadge tijarahVariant="success">Aktif</TijarahBadge>
    <TijarahBadge tijarahVariant="warning">Pending</TijarahBadge>
    <TijarahBadge tijarahVariant="danger">Non-Aktif</TijarahBadge>
  </div>
);
```

---

## 5. `TijarahAlert`

Komponen notifikasi alert/pesan informasi dengan struktur ikon, judul, dan deskripsi.

### Varian (`tijarahVariant`):
- `info`, `success`, `warning`, `danger`

### Contoh Penggunaan:
```tsx
import { TijarahAlert } from "@/components/atom/tijarahAlert";

export const ExampleAlert = () => (
  <TijarahAlert
    tijarahVariant="success"
    title="Berhasil Disimpan!"
    description="Data transaksi telah diperbarui pada sistem."
  />
);
```

---

## 6. `TijarahCard`

Komponen kontainer kartu lengkap dengan subkomponen `Header`, `Title`, `Description`, `Content`/`Body`, dan `Footer`.

### Varian (`tijarahVariant`):
- `default`: Kartu dengan border halus & shadow tipis.
- `bordered`: Kartu bergaris tegas.
- `flat`: Kartu flat tanpa shadow.
- `elevated`: Kartu dengan elevasi shadow lebih tinggi.

### Contoh Penggunaan:
```tsx
import { TijarahCard } from "@/components/atom/tijarahCard";
import { TijarahButton } from "@/components/atom/tijarahButton";

export const ExampleCard = () => (
  <TijarahCard tijarahVariant="default">
    <TijarahCard.Header>
      <TijarahCard.Title>Ringkasan Penjualan</TijarahCard.Title>
      <TijarahCard.Description>Laporan periode bulan ini</TijarahCard.Description>
    </TijarahCard.Header>
    <TijarahCard.Body>
      <p className="text-2xl font-bold">Rp 15.400.000</p>
    </TijarahCard.Body>
    <TijarahCard.Footer>
      <TijarahButton tijarahVariant="secondary" size="sm">Lihat Detail</TijarahButton>
    </TijarahCard.Footer>
  </TijarahCard>
);
```

---

## 7. `TijarahChip`

Komponen chip/tag interaktif.

### Contoh Penggunaan:
```tsx
import { TijarahChip } from "@/components/atom/tijarahChip";

export const ExampleChip = () => (
  <div className="flex gap-2">
    <TijarahChip tijarahVariant="primary">Kategori: Elektronik</TijarahChip>
    <TijarahChip tijarahVariant="outline">Stok Tersedia</TijarahChip>
  </div>
);
```

---

## 8. `TijarahSelect`

Komponen pemilih opsi drop-down berbasis HeroUI `Select` & `ListBoxItem`.

### Contoh Penggunaan:
```tsx
import { TijarahSelect } from "@/components/atom/tijarahSelect";

export const ExampleSelect = () => (
  <TijarahSelect tijarahVariant="primary" placeholder="Pilih Peran">
    <TijarahSelect.Trigger />
    <TijarahSelect.Popover>
      <TijarahSelect.Item id="admin">Administrator</TijarahSelect.Item>
      <TijarahSelect.Item id="kasir">Kasir</TijarahSelect.Item>
    </TijarahSelect.Popover>
  </TijarahSelect>
);
```

---

## 9. `TijarahCheckbox`

Komponen kotak centang dengan label kustom.

### Contoh Penggunaan:
```tsx
import { TijarahCheckbox } from "@/components/atom/tijarahCheckbox";

export const ExampleCheckbox = () => (
  <TijarahCheckbox label="Saya menyetujui Syarat & Ketentuan" tijarahVariant="primary" />
);
```

---

## 10. `TijarahRadioBtn` & `TijarahRadioGroup`

Komponen tombol radio tunggal dan grup radio.

### Contoh Penggunaan:
```tsx
import { TijarahRadioBtn } from "@/components/atom/tijarahRadioBtn";

export const ExampleRadio = () => (
  <TijarahRadioBtn.Group label="Metode Pembayaran">
    <TijarahRadioBtn value="qris" label="QRIS" />
    <TijarahRadioBtn value="cash" label="Tunai" />
    <TijarahRadioBtn value="transfer" label="Transfer Bank" />
  </TijarahRadioBtn.Group>
);
```

---

## 11. `TijarahTextArea`

Komponen area input teks banyak baris.

### Contoh Penggunaan:
```tsx
import { TijarahTextArea } from "@/components/atom/tijarahTextArea";

export const ExampleTextArea = () => (
  <TijarahTextArea
    tijarahVariant="primary"
    placeholder="Tuliskan catatan tambahan..."
    rows={4}
  />
);
```

---

## 12. `TijarahDropdown`

Komponen menu aksi melayang (dropdown menu).

### Contoh Penggunaan:
```tsx
import { TijarahDropdown } from "@/components/atom/tijarahDropdown";
import { TijarahButton } from "@/components/atom/tijarahButton";

export const ExampleDropdown = () => (
  <TijarahDropdown>
    <TijarahDropdown.Trigger>
      <TijarahButton tijarahVariant="secondary">Opsi Pembeli ▾</TijarahButton>
    </TijarahDropdown.Trigger>
    <TijarahDropdown.Popover>
      <TijarahDropdown.Item id="edit">Edit Profil</TijarahDropdown.Item>
      <TijarahDropdown.Item id="history">Riwayat Transaksi</TijarahDropdown.Item>
      <TijarahDropdown.Item id="logout" className="text-red-600 dark:text-red-400">Keluar</TijarahDropdown.Item>
    </TijarahDropdown.Popover>
  </TijarahDropdown>
);
```
