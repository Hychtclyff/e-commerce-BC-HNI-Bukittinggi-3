# Panduan Integrasi Frontend: Profile & HNI Profile Service

Dokumen ini berisi spesifikasi teknis dan panduan integrasi lengkap API **Profile** dan **HNI Profile** untuk pengembang Frontend (FE).

---

## 1. Overview Endpoints

Prefix Route: `/profile`

| Endpoint | Method | Fungsi | Autentikasi |
| :--- | :--- | :--- | :--- |
| `/profile/search-hni` | `GET` | Pencarian agen HNI via HSIS (atau Dummy Lokal) berdasarkan No. HP / ID Member | Optional / Bearer Token |
| `/profile/searchHniProfile` | `GET` | Alias pencarian agen HNI (dukungan kompatibilitas route) | Optional / Bearer Token |
| `/profile/:id/hni` | `POST` / `PUT` | Menyimpan / memperbarui data profil HNI pengguna (`hni_profiles`) | Bearer Token |
| `/profile/:id` | `GET` | Mengambil data detail profil pengguna (termasuk `hniProfile`, `addresses`, `creditProfile`) | Bearer Token |

---

## 2. Dokumentasi Spesifikasi API

### A. Pencarian Agen HNI (`search-hni`)

- **URL:** `/profile/search-hni` atau `/profile/searchHniProfile`
- **Method:** `GET`
- **Query Parameters:**
  - `noHandphone` *(string, opsional)*: Nomor HP agen (contoh: `081261831713`).
  - `keyword` *(string, opsional)*: Keyword pencarian (ID member, Nama, No. HP, Nama Upline).
  - `start` *(number, opsional, default: 0)*: Offset baris data.
  - `limit` *(number, opsional, default: 20)*: Jumlah baris per pencarian.

#### Example Request:
```http
GET /profile/search-hni?noHandphone=081261831713 HTTP/1.1
Host: localhost:5000
Authorization: Bearer <token_user>
```

#### Example Response (Success 200 OK):
```json
{
  "status": "success",
  "message": "Pencarian agen HNI berhasil.",
  "data": {
    "success": true,
    "message": "",
    "data": {
      "total": 1,
      "rows": [
        {
          "ci": "03466846",
          "cn": "YUDRIQUL AULIA",
          "ui": "01119387",
          "un": "FAKHRUR RIJAL FAUZI",
          "ds": "M",
          "ts": "SC",
          "mp": "081261831713",
          "ic": "1371012304950001"
        }
      ]
    }
  }
}
```

---

### B. Simpan / Perbarui Profil HNI (`saveHniProfile`)

- **URL:** `/profile/:id/hni` (ganti `:id` dengan `userId`)
- **Method:** `POST` / `PUT`
- **Headers:** `Content-Type: application/json`

#### Request Body Payload:
```json
{
  "hniMemberId": "03466846",
  "hniMemberName": "YUDRIQUL AULIA",
  "uplineName": "FAKHRUR RIJAL FAUZI",
  "rank": "SC",
  "rankMarketing": "SC"
}
```

#### Field Description:
| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `hniMemberId` | `string` | **Ya** | Nomor ID Member HNI (contoh: `"03466846"`) |
| `hniMemberName` | `string` | **Ya** | Nama lengkap agen sesuai ID HNI |
| `uplineName` | `string` | Tidak | Nama sponsor / upline agen HNI |
| `rank` | `string` | Tidak | Jenjang / rank agen HNI (`AB`, `Manager`, `SC`, `ED`, dll) |
| `rankMarketing` | `string` | Tidak | Status rank marketing dari HSIS |

#### Example Response (Success 200 OK):
```json
{
  "status": "success",
  "message": "Profil HNI berhasil disimpan.",
  "data": {
    "id": "bfa8619a-986c-486a-8b83-b097b696f81a",
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "hniMemberId": "03466846",
    "hniMemberName": "YUDRIQUL AULIA",
    "uplineName": "FAKHRUR RIJAL FAUZI",
    "rank": "SC",
    "rankMarketing": "SC",
    "isVerified": false,
    "createdAt": "2026-09-28T15:10:00.000Z",
    "updatedAt": "2026-09-28T15:10:00.000Z"
  }
}
```

---

### C. Get Profile Detail (`getProfile`)

- **URL:** `/profile/:id`
- **Method:** `GET`

#### Example Response (Success 200 OK):
```json
{
  "status": "success",
  "message": "Profil pengguna berhasil diambil.",
  "data": {
    "user": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "fullName": "Yudriqul Aulia",
      "phoneNumber": "081261831713",
      "email": "user@example.com",
      "userType": "CUSTOMER"
    },
    "hniProfile": {
      "id": "bfa8619a-986c-486a-8b83-b097b696f81a",
      "hniMemberId": "03466846",
      "hniMemberName": "YUDRIQUL AULIA",
      "uplineName": "FAKHRUR RIJAL FAUZI",
      "rank": "SC",
      "isVerified": false
    },
    "addresses": [],
    "creditProfile": null
  }
}
```

---

## 3. Contoh Implementasi API Service di Frontend (Axios & TypeScript)

```typescript
// src/modules/profile/api/profile.api.ts
import api from '@/lib/axios';

export interface SearchHniParams {
  keyword?: string;
  noHandphone?: string;
  start?: number;
  limit?: number;
}

export interface SaveHniProfilePayload {
  hniMemberId: string;
  hniMemberName: string;
  uplineName?: string;
  rank?: string;
  rankMarketing?: string;
}

export const profileApi = {
  // 1. Cari Agen HNI
  searchHniProfile: async (params: SearchHniParams) => {
    const res = await api.get('/profile/search-hni', { params });
    return res.data;
  },

  // 2. Simpan / Update Profil HNI User
  saveHniProfile: async (userId: string, payload: SaveHniProfilePayload) => {
    const res = await api.post(`/profile/${userId}/hni`, payload);
    return res.data;
  },

  // 3. Ambil Profile Lengkap
  getProfile: async (userId: string) => {
    const res = await api.get(`/profile/${userId}`);
    return res.data;
  },
};

export default profileApi;
```

---

## 4. Contoh Integrasi pada Form React Hook Form

```tsx
import React, { useState } from 'react';
import { profileApi } from '../api/profile.api';
import SearchHniProfileSearch from './serachHniProfileForm';

export const HniRegistrationContainer = ({ userId }: { userId: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveHni = async (selectedMember: any) => {
    try {
      setIsSubmitting(true);
      await profileApi.saveHniProfile(userId, {
        hniMemberId: selectedMember.hniMemberId,
        hniMemberName: selectedMember.hniMemberName,
        uplineName: selectedMember.uplineName,
        rank: selectedMember.rank || selectedMember.titleStatus,
      });

      alert("Profil HNI berhasil disimpan! Menunggu verifikasi admin.");
    } catch (error: any) {
      alert("Gagal menyimpan profil HNI: " + (error?.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <SearchHniProfileSearch
        onSelectMember={(member) => {
          if (member) {
            handleSaveHni(member);
          }
        }}
        disabled={isSubmitting}
      />
    </div>
  );
};
```
