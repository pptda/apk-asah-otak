# Asah Otak Seru — jadi aplikasi Android (APK)

Isi folder ini:

| Nama | Fungsi |
|---|---|
| `www/index.html` | Game Anda (sudah ada **Petualangan Perkalian**). Font disimpan di `www/fonts`, jadi bisa dipakai tanpa internet. |
| `buat-apk.js` | **Pembuat APK** (Node.js). Ini yang Anda jalankan. |
| `ikon/` | Ikon aplikasi (bintang kuning). |
| `capacitor.config.json` | Nama aplikasi dan ID aplikasi. |
| `.github/workflows/buat-apk.yml` | Untuk Cara B (membuat APK di internet, tanpa memasang apa pun). |

Setelah berhasil, file APK ada di **`hasil/AsahOtakSeru.apk`**.

---

## Cara A — Buat APK di komputer sendiri

Hanya perlu memasang 2 program, sekali saja:

1. **Node.js versi 22 atau lebih baru** — unduh versi "LTS" dari https://nodejs.org lalu pasang.
2. **Android Studio** — unduh dari https://developer.android.com/studio lalu pasang.
   **Buka sekali** dan biarkan sampai selesai mengunduh komponen (Setup Wizard). Java sudah ikut di dalamnya, jadi tidak perlu memasang Java lagi.

Lalu:

1. Ekstrak (unzip) folder ini.
2. Buka terminal di dalam folder ini
   - Windows: buka folder, klik kolom alamat, ketik `cmd`, tekan Enter.
   - Mac: klik kanan folder > *New Terminal at Folder*.
3. Ketik perintah ini lalu Enter:

   ```
   node buat-apk.js
   ```

4. Tunggu. Pertama kali bisa **5–15 menit** karena mengunduh alat bantu (butuh internet). Berikutnya jauh lebih cepat.
5. Jika muncul tulisan **SELESAI**, ambil file `hasil/AsahOtakSeru.apk`.

## Cara B — Buat APK di internet (tanpa memasang apa pun)

1. Buat akun gratis di https://github.com lalu buat *repository* baru (boleh *Private*).
2. Unggah **semua isi folder ini** ke repository tersebut (*Add file > Upload files*).
   Folder `.github` kadang tidak ikut terunggah karena namanya diawali titik. Jika di repository tidak ada folder `.github`, pilih *Add file > Create new file*, ketik nama `.github/workflows/buat-apk.yml`, lalu tempel isi file `buat-apk.yml` dari komputer Anda.
3. Buka tab **Actions** > **Buat APK** > **Run workflow**.
4. Tunggu beberapa menit sampai ada tanda centang hijau, klik prosesnya, lalu unduh **AsahOtakSeru-APK** di bagian *Artifacts* (berbentuk zip berisi file APK).

---

## Memasang di HP

1. Kirim file APK ke HP (kabel USB, WhatsApp, Google Drive, dll).
2. Ketuk file APK di HP.
3. Jika HP bertanya, izinkan **"Pasang aplikasi dari sumber ini"** (*Install unknown apps*) untuk aplikasi yang Anda pakai membuka file tadi.
4. Ketuk **Pasang / Install**.

APK ini berjenis *debug*: cocok untuk dipakai sendiri dan dibagikan langsung ke HP lain. Untuk diunggah ke Google Play Store dibutuhkan versi rilis yang ditandatangani (bisa dibuat belakangan).

## Mengubah game lalu membuat APK baru

1. Ubah file `www/index.html`.
2. Jalankan lagi `node buat-apk.js`.

Untuk mengganti nama aplikasi, ubah `appName` di `capacitor.config.json`, lalu jalankan `node buat-apk.js --ulang`.

## Kalau gagal

Skrip akan menampilkan penyebab dan cara memperbaikinya. Yang paling sering:

- **Internet terputus** saat mengunduh — jalankan lagi perintah yang sama.
- **Lisensi Android SDK belum disetujui** — skrip menampilkan perintah `sdkmanager --licenses` yang perlu dijalankan.
- **Komponen SDK kurang** — di Android Studio buka *SDK Manager*, pasang *Android SDK Platform 36* dan *Build-Tools*.
- **Proyek Android rusak** — jalankan `node buat-apk.js --ulang`.
