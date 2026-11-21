<!-- Berikut adalah daftar **Custom Hooks & Helper Methods** yang paling sering digunakan secara berulang (*reusable*) di berbagai fitur aplikasi. Mengisolasinya ke dalam folder global (seperti `hooks/` dan `utils/`) akan menghemat waktu dan menjaga konsistensi kode secara signifikan.

---

### 1. Centralized Custom Hooks (`/hooks`)

**A. Form & Input Management**

* **`useForm` / `useInput**`: Mengelola state *form*, penanganan *change event*, reset *form*, hingga validasi sederhana tanpa perlu menulis `useState` berulang di setiap halaman.
* **`useDebounce`**: Menunda eksekusi fungsi (misal: *auto-complete* pencarian atau *live validation*) agar tidak memicu panggilan API berlebihan saat pengguna mengetik.

**B. Data Fetching & State Async**

* **`useFetch` / `useAsync**`: Membungkus proses *HTTP Request* dengan otomatis menyediakan state `data`, `isLoading`, dan `error`.
* **`usePaginate` / `useFilter**`: Mengatur state *pagination* (halaman, limit), sorting, dan *query parameter* URL untuk tabel atau daftar produk.

**C. UI & Device State**

* **`useDisclosure` / `useToggle**`: Mengelola status *open/close* modal, *drawer*, *accordion*, atau *dropdown* (`isOpen`, `onOpen`, `onClose`, `toggle`).
* **`useMediaQuery` / `useResponsive**`: Mendeteksi ukuran layar (*mobile*, *tablet*, *desktop*) untuk rendering kondisional berbasis JavaScript.
* **`useOnClickOutside`**: Mendeteksi klik di luar elemen tertentu (sangat berguna untuk menutup *dropdown* atau *popover* secara otomatis).

**D. Browser Storage & Authentication**

* **`useLocalStorage` / `useSessionStorage**`: Menyimpan dan mengambil state langsung dari storage browser yang sinkron dengan komponen React.
* **`useAuth`**: Mengakses data pengguna yang sedang login, status autentikasi, serta fungsi *login* dan *logout* di mana saja.

---

### 2. Universal Helper Utilities (`/utils` atau `/helpers`)

Selain Hooks, beberapa fungsi murni (*pure functions*) ini wajib diletakkan di utilitas terpusat:

* **Formatters**:
* `formatRupiah(amount)` / `formatCurrency(val)`
* `formatDate(date, formatPattern)` (memformat tanggal lokal)


* **Validations**:
* `isValidEmail(string)`
* `isValidPhoneNumber(string)`


* **Data Transformers**:
* `truncateText(text, length)` (memotong teks panjang untuk *card*)
* `cleanPayload(object)` (menghapus key `null` atau `undefined` sebelum dikirim ke API)



---

### 📁 Contoh Struktur Folder Ideal

```text
src/
├── hooks/
│   ├── useDisclosure.ts
│   ├── useDebounce.ts
│   ├── useLocalStorage.ts
│   └── useAuth.ts
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── constants.ts

```

--- -->