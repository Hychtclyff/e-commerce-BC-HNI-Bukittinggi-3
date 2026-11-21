# Panduan Integrasi Autentikasi & i18n Backend (Tijarah-3)

Dokumen ini berisi panduan penggunaan API Autentikasi (Register, Login, Google OAuth) dan Kamus Bahasa (i18n) pada backend Tijarah-3 untuk tim Front-End.

---

## 1. Konfigurasi Header Utama (Multi-Bahasa / i18n)

Backend Tijarah-3 mendukung respon multi-bahasa (`id` dan `en`). Setiap request dari Front-End **sangat disarankan** menyertakan header bahasa:

- **Header Standard**: `Accept-Language: id` atau `Accept-Language: en`
- **Custom Header**: `Language: id` atau `x-lang: id`
- **Query Parameter (Fallback)**: `?lang=id` atau `?lang=en`

---

## 2. Endpoint Kamus Bahasa (i18n Dictionary)

FE dapat mengambil kamus terjemahan backend untuk ditampilkan di UI atau disinkronkan.

- **URL**: `GET /api/v1/i18n/dictionary`
- **Headers**: `Accept-Language: id` (atau `en`)
- **Query Optional**: `?all=true` (mengambil seluruh terjemahan yang didukung)

### Contoh Respon (`GET /api/v1/i18n/dictionary` dengan `Accept-Language: id`):
```json
{
  "status": "success",
  "message": "Dictionary retrieved successfully",
  "data": {
    "language": "id",
    "dictionary": {
      "auth": {
        "login_failed_default": "Email atau kata sandi salah.",
        "register_success": "Registrasi berhasil, silakan login.",
        "login_success": "Login berhasil."
      },
      "common": {
        "bad_request": "Permintaan tidak valid.",
        "unauthorized": "Sesi tidak valid atau telah berakhir."
      }
    }
  }
}
```

---

## 3. Registrasi Pengguna Baru (Register)

- **URL**: `POST /api/v1/auth/register`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept-Language: id` (atau `en`)

### Request Body:
```json
{
  "fullName": "Budi Santoso",
  "phoneNumber": "081234567890",
  "email": "budi@example.com",
  "password": "Password123"
}
```

### Respon Sukses (201 Created):
```json
{
  "status": "success",
  "message": "Registrasi berhasil, silakan login.",
  "data": {
    "id": "uuid-user-id",
    "fullName": "Budi Santoso",
    "phoneNumber": "081234567890",
    "email": "budi@example.com"
  }
}
```

### Respon Gagal (400 Bad Request):
```json
{
  "status": "error",
  "message": "Email sudah terdaftar."
}
```

---

## 4. Login Pengguna (Email & Password)

- **URL**: `POST /api/v1/auth/login`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept-Language: id` (atau `en`)

### Request Body:
```json
{
  "email": "budi@example.com",
  "password": "Password123"
}
```

### Respon Sukses (200 OK):
```json
{
  "status": "success",
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "fullName": "Budi Santoso",
      "phoneNumber": "081234567890",
      "email": "budi@example.com"
    },
    "token": "supabase-access-token",
    "appToken": "jwt-internal-backend-token"
  }
}
```

### Respon Gagal (400 Bad Request):
```json
{
  "status": "error",
  "message": "Login gagal: Email atau kata sandi salah.",
  "details": {
    "code": "invalid_credentials",
    "status": 400,
    "hint": "Pastikan email & password benar. Jika user baru dibuat, verifikasi email terlebih dahulu di Supabase Dashboard..."
  }
}
```

> **Catatan Penggunaan Hint di FE**: Jika `details.hint` ada pada respon error, FE dapat menampilkannya sebagai pesan bantuan (`serverHint`) pada UI Alert.

---

## 5. Google OAuth Sign In

Untuk Google Sign-In, Front-End dapat memilih salah satu dari dua alur:

### Alur A: Dapatkan Google OAuth URL dari Backend (Rekomendasi)

1. **Ambil URL OAuth dari Backend**:
   - **URL**: `GET /api/v1/auth/google/url?redirectTo=http://localhost:3000/id/auth/callback`
   - **Respon Sukses**:
     ```json
     {
       "status": "success",
       "message": "OAuth URL Google berhasil dibuat.",
       "data": {
         "url": "https://<supabase-project>.supabase.co/auth/v1/authorize?provider=google..."
       }
     }
     ```
2. **Redirect User**: Di FE, lakukan `window.location.href = data.url`.
3. **Submit Token saat Callback**: Pada halaman callback (`/auth/callback`), dapatkan `access_token` dari URL/Session, lalu panggil endpoint di bawah.

### Alur B: Submit Google OAuth Token ke Backend

- **URL**: `POST /api/v1/auth/sign-in-with-google`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept-Language: id` (atau `en`)

### Request Body:
```json
{
  "token": "<supabase_access_token_atau_google_id_token>"
}
```

### Respon Sukses (200 OK):
```json
{
  "status": "success",
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": "uuid-user-id",
      "fullName": "Google User",
      "email": "user@gmail.com",
      "phoneNumber": "g_uuid"
    },
    "token": "jwt-internal-backend-token"
  }
}
```

---

## 6. Contoh Implementasi Service pada Front-End (`auth.service.ts`)

```typescript
import { apiClient } from "@/lib/axios/client";

export const authService = {
  // Login Email & Password
  login: async (payload: { email: string; password: string }) => {
    const response = await apiClient.post("/auth/login", payload);
    return response.data;
  },

  // Register
  register: async (payload: { fullName: string; phoneNumber: string; email: string; password: string }) => {
    const response = await apiClient.post("/auth/register", payload);
    return response.data;
  },

  // Dapatkan URL Google OAuth dari Backend
  getGoogleOAuthUrl: async (redirectTo?: string) => {
    const response = await apiClient.get("/auth/google/url", {
      params: { redirectTo },
    });
    return response.data;
  },

  // Sign In with Google menggunakan Token
  signWithGoogle: async (tokenStrOrObj: string | { token: string }) => {
    const payload = typeof tokenStrOrObj === "string" ? { token: tokenStrOrObj } : tokenStrOrObj;
    const response = await apiClient.post("/auth/sign-in-with-google", payload);
    return response.data;
  },
};
```
