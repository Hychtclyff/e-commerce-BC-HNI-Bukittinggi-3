Viewed auth.service.ts:1-250
Viewed auth.service.ts:250-500
Edited auth.service.ts
Edited auth.service.ts
Ran command: `bun run build`

Semua method di [auth.service.ts](file:///d:/Developer/Tijarah/back-end/src/modules/auth/auth.service.ts) yang bertugas mengirimkan kode OTP kini telah **diseragamkan** untuk menyertakan properti `cooldownSeconds: 60` dan `cooldown: 60`.

---

### 📋 Daftar Method yang Telah Diperbarui:

1. **`register()`**:
   ```json
   {
       "status": "success",
       "data": {
           "id": "...",
           "email": "user@example.com",
           "requireOtp": true,
           "cooldownSeconds": 60,
           "cooldown": 60
       }
   }
   ```

2. **`resendOTP()`**:
   ```json
   {
       "status": "success",
       "data": {
           "success": true,
           "message": "Email verifikasi berhasil dikirim",
           "cooldownSeconds": 60,
           "cooldown": 60
       }
   }
   ```

3. **`requestEmailChangeOTP()`**:
   ```json
   {
       "status": "success",
       "data": {
           "success": true,
           "message": "Kode OTP berhasil dikirim ke email baru.",
           "cooldownSeconds": 60,
           "cooldown": 60
       }
   }
   ```

4. **`sendVerificationEmail()`**:
   ```json
   {
       "status": "success",
       "data": {
           "success": true,
           "message": "Email verifikasi berhasil dikirim",
           "cooldownSeconds": 60,
           "cooldown": 60
       }
   }
   ```

---

Dengan penyeragaman ini, Front-End dapat menggunakan satu cara standar (`res?.data?.cooldownSeconds || 60`) untuk menyalakan timer countdown di tombol OTP pada seluruh halaman auth (Register, Resend OTP, maupun Ubah Email).

Kompilasi TypeScript (`bun run build`) telah diuji dan **berhasil 100% tanpa error**!