Tolong perbaiki daftar bug / permintaan skema berikut pada Tijarah:

1. ### [BUG HIGH] penggunaan vocher
- **ID Catatan:** BUG-A5E36B59
- **Halaman / URL:** `/id/checkout`
- **Catatan / Langkah:** coba cek log padahal saya sudah upate senin tanggal valid 1 nove hingga 31 nove
- **User Aktif:** aldhani86@gmail.com (type: CUSTOMER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [API_ERROR] POST /checkout/process -> 400 Kupon ini hanya berlaku pada hari tertentu sesuai jadwal promo.
  - [API_ERROR] POST /checkout/calculate -> 400 Kupon ini hanya berlaku pada hari tertentu sesuai jadwal promo.

---

2. ### [BUG HIGH] pebaikan UX
- **ID Catatan:** BUG-50C726D9
- **Halaman / URL:** `/id/checkout`
- **Catatan / Langkah:** saat syart tidak  terpenuhi tetap disbale kupon dengan catatan syarat mana yang ialanggar, contoh ini tidak sesui jadwal karna khusus jumat
- **User Aktif:** aldhani86@gmail.com (type: CUSTOMER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [API_ERROR] POST /checkout/process -> 400 Kupon ini hanya berlaku pada hari tertentu sesuai jadwal promo.
  - [API_ERROR] POST /checkout/calculate -> 400 Kupon ini hanya berlaku pada hari tertentu sesuai jadwal promo.

---

3. ### [BUG HIGH] update keranjang
- **ID Catatan:** BUG-2886A058
- **Halaman / URL:** `/id/checkout`
- **Catatan / Langkah:** saat user mencoba menggunakan vocher ternyata belnajan kurang syrat dan dia ingin menambah user tidak menemukan fitur back to shop, atau tampilkan keranjang merekan untuk di + atau -
- **User Aktif:** aldhani86@gmail.com (type: CUSTOMER, roles: -)

---

4. ### [BUG HIGH] dev qa
- **ID Catatan:** BUG-AFB55658
- **Halaman / URL:** `/en/store?tab=auditLogs`
- **Catatan / Langkah:** setelah solusi diberikan ubah status ready to test, saat ini langsung fixed agar saya bisa close bugnya
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src
  - [API_ERROR] POST /store/hsis/sync-saldo -> 401 Request failed with status code 401
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

5. ### [PERMINTAAN SKEMA BARU] non product
- **ID Catatan:** BUG-C04B24AF
- **Halaman / URL:** `/en/store?tab=inventory`
- **Catatan / Langkah:** product non hni belum muncul di catalog shop
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src
  - [API_ERROR] POST /store/hsis/sync-saldo -> 401 Request failed with status code 401
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

6. ### [PERMINTAAN SKEMA BARU] tag producut
- **ID Catatan:** BUG-5EA17B35
- **Halaman / URL:** `/en/store?tab=news`
- **Catatan / Langkah:** di berita tambahkan fitur tag product untuk higlhg prodcyt
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src
  - [API_ERROR] POST /store/hsis/sync-saldo -> 401 Request failed with status code 401
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

7. ### [PERMINTAAN SKEMA BARU] relati khasiat ke product
- **ID Catatan:** BUG-AB5D21DA
- **Halaman / URL:** `/en/store?tab=productKnowledge`
- **Catatan / Langkah:** belum ada nya relasi one to one khasit dengan product
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [API_ERROR] POST /store/hsis/sync-saldo -> 401 Request failed with status code 401
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

8. ### [BUG HIGH] print cetak resi
- **ID Catatan:** BUG-B34FCCAB
- **Halaman / URL:** `/en/store?tab=orders`
- **Catatan / Langkah:** cetak resi tidak menggunakan tempalate tetpai tampilan window saat ini
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [API_ERROR] POST /store/hsis/sync-saldo -> 401 Request failed with status code 401
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

9. ### [BUG HIGH] tampilan terpotong
- **ID Catatan:** BUG-E3EB2069
- **Halaman / URL:** `/en/store?tab=orders`
- **Catatan / Langkah:** modal print recip terpotong karna data barang banyak, dan harusnya bisa download pdf
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [API_ERROR] POST /store/hsis/sync-saldo -> 401 Request failed with status code 401
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src
- **Flow UI Terekam (Playwright Steps):**
  1. [GOTO] Buka halaman /en/store?tab=orders (`page.goto('/en/store?tab=orders')`)
  2. [CLICK] "TIJARAH BC 3" (`page.getByText('TIJARAH BC 3').first()`)
  3. [CLICK] "Print Receipt" (`page.getByText('Print Receipt').first()`)

---

10. ### [PERMINTAAN SKEMA BARU] antrian print
- **ID Catatan:** BUG-D5FAB636
- **Halaman / URL:** `/en/store?tab=orders`
- **Catatan / Langkah:** order yang sedang dikemas tambahakan state belum diprint, dan tambahkan triger print orderan, dan corn job untuk jadwal pengecekan order hingga masuk dalam antrian print
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

11. ### [PERMINTAAN SKEMA BARU] layout khasiat
- **ID Catatan:** BUG-E37E3889
- **Halaman / URL:** `/en/store?tab=productKnowledge`
- **Catatan / Langkah:** Komposisi Bahan Alami pindahkan card ini satu column dengan aturan pakai dan peringatan, saat ini berada di terpencil di sudut kanan bwah secara ux tidak menarik
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

12. ### [PERMINTAAN SKEMA BARU] panel khasiat
- **ID Catatan:** BUG-B958CF69
- **Halaman / URL:** `/en/store?tab=productKnowledge`
- **Catatan / Langkah:** field upload foto masih link ganti jadi upload file
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

13. ### [PERMINTAAN SKEMA BARU] fitur return dan cancel
- **ID Catatan:** BUG-069C302F
- **Halaman / URL:** `/en/store?tab=returns`
- **Catatan / Langkah:** fitur return dan cancel di hold dulu saya butuh brainstrom mekanisme dan teknisnya gimana, selagi di hold tambahkan konfirmasi saat bikin order bahwa tidak bisa cancel dan di return,
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

14. ### [PERMINTAAN SKEMA BARU] Purchasing, Supplier & Hutang Dagang
- **ID Catatan:** BUG-0BFE6669
- **Halaman / URL:** `/en/store?tab=purchasing`
- **Catatan / Langkah:** hapus aja fitur ini dan firtur kasir
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)
- **Log Error Otomatis (API / Console):**
  - [CONSOLE_ERROR] An empty string ("") was passed to the %s attribute. This may cause the browser to download the whole page again over the network. To fix this, either do not render the element at all or pass null to %s instead of an empty string. src src

---

15. ### [BUG HIGH] konfirmasi refund
- **ID Catatan:** BUG-C07D3DD5
- **Halaman / URL:** `/en/store?tab=orders`
- **Catatan / Langkah:** filed bukti gunakan upload gambar bukan link, kemudian setelah di konfirmasi sudah di kembalikan user juga validasi bahwasanya dana pengembalian sudah masuk
- **User Aktif:** owner@tijarah.co (type: OWNER, roles: -)