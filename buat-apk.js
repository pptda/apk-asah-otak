#!/usr/bin/env node
/* =====================================================================
   buat-apk.js  —  PEMBUAT APK "Asah Otak Seru"
   ---------------------------------------------------------------------
   Cara pakai (cukup satu perintah di folder ini):

        node buat-apk.js

   Yang dikerjakan skrip ini, berurutan:
     1. Mengecek Node.js, Java (JDK), dan Android SDK di komputer Anda.
     2. Memasang paket yang dibutuhkan (Capacitor) lewat npm.
     3. Membuat proyek Android dari isi folder "www" (game Anda).
     4. Memasang ikon aplikasi (bintang kuning) dari folder "ikon".
     5. Membangun file APK dengan Gradle.
     6. Menyalin hasilnya ke folder "hasil" -> hasil/AsahOtakSeru.apk

   Opsi tambahan:
        node buat-apk.js --ulang    (hapus proyek Android lama, buat dari awal)
   ===================================================================== */

// ---- Modul bawaan Node.js yang dipakai ----
const fs = require('fs');                       // membaca/menulis file dan folder
const path = require('path');                   // menyusun alamat file
const os = require('os');                       // mengetahui folder rumah pengguna
const { spawnSync } = require('child_process'); // menjalankan perintah di terminal

// ---- Pengaturan dasar ----
const FOLDER = __dirname;                                   // folder tempat skrip ini berada
const WINDOWS = process.platform === 'win32';               // true jika komputer Windows
const MAC = process.platform === 'darwin';                  // true jika komputer Mac
const FOLDER_ANDROID = path.join(FOLDER, 'android');        // proyek Android hasil buatan skrip
const NAMA_APK = 'AsahOtakSeru.apk';                        // nama file APK akhir
const JAVA_MINIMAL = 21;                                    // versi Java minimal untuk Capacitor 8
const NODE_MINIMAL = 22;                                    // versi Node.js minimal untuk Capacitor 8
const WARNA_LATAR_IKON = '#17324D';                         // warna latar ikon adaptif (biru tua)

// ---- Fungsi pembantu untuk mencetak pesan agar mudah dibaca ----
const langkah = (teks) => console.log('\n▶ ' + teks);      // judul langkah
const beres = (teks) => console.log('  ✔ ' + teks);        // tanda berhasil
const catatan = (teks) => console.log('  • ' + teks);       // keterangan biasa

// Menghentikan skrip dengan pesan yang jelas (daftar "saran" berisi cara memperbaikinya)
function berhenti(judul, saran) {
  console.error('\n✖ ' + judul);
  (saran || []).forEach((s) => console.error('   ' + s));
  process.exit(1);
}

// Menjalankan perintah terminal. Jika gagal, skrip melempar error supaya bisa ditangkap.
function jalankan(perintah, folder) {
  const hasil = spawnSync(perintah, {
    cwd: folder || FOLDER,   // jalankan di folder ini (atau folder lain jika disebut)
    stdio: 'inherit',        // tampilkan keluaran langsung di layar
    shell: true,             // pakai terminal bawaan (cmd di Windows, sh di Mac/Linux)
    env: process.env,        // bawa semua pengaturan lingkungan (JAVA_HOME dll)
  });
  if (hasil.status !== 0) throw new Error('Perintah gagal: ' + perintah);
}

/* ---------------------------------------------------------------------
   LANGKAH 1a — Cek versi Node.js
   --------------------------------------------------------------------- */
function cekNode() {
  const utama = parseInt(process.versions.node.split('.')[0], 10);   // mis. "22.4.0" -> 22
  if (utama < NODE_MINIMAL) {
    berhenti('Node.js Anda versi ' + process.versions.node + ', padahal dibutuhkan versi ' + NODE_MINIMAL + ' ke atas.', [
      'Unduh versi LTS terbaru dari https://nodejs.org lalu pasang (cukup Next-Next-Finish).',
      'Setelah itu tutup terminal, buka lagi, dan jalankan: node buat-apk.js',
    ]);
  }
  beres('Node.js ' + process.versions.node);
}

/* ---------------------------------------------------------------------
   LANGKAH 1b — Cari Java (JDK) versi 21 ke atas
   Android Studio sudah membawa Java sendiri (folder "jbr"), jadi jika
   Anda memasang Android Studio, Java ikut ditemukan otomatis.
   --------------------------------------------------------------------- */
// Alamat file "java" di dalam sebuah folder JDK
function berkasJava(folderJdk) {
  return path.join(folderJdk, 'bin', WINDOWS ? 'java.exe' : 'java');
}

// Menanyakan versi sebuah Java; hasilnya angka (mis. 21), atau 0 jika tidak bisa dijalankan
function versiJava(perintahJava) {
  const hasil = spawnSync('"' + perintahJava + '" -version', { shell: true, encoding: 'utf8' });
  const teks = (hasil.stderr || '') + (hasil.stdout || '');          // Java menulis versinya ke stderr
  const cocok = teks.match(/version "(\d+)(?:\.(\d+))?/);           // mis. version "21.0.2"
  if (!cocok) return 0;
  const awal = parseInt(cocok[1], 10);
  return awal === 1 ? parseInt(cocok[2], 10) : awal;                 // Java lama: "1.8" berarti 8
}

// Daftar tempat Java yang biasa ada di komputer (termasuk milik Android Studio)
function daftarJdkKandidat() {
  const rumah = os.homedir();
  const daftar = [];
  if (process.env.JAVA_HOME) daftar.push(process.env.JAVA_HOME);     // pengaturan JAVA_HOME milik Anda
  if (WINDOWS) {
    daftar.push('C:\\Program Files\\Android\\Android Studio\\jbr');
    if (process.env.LOCALAPPDATA) daftar.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Android Studio', 'jbr'));
  } else if (MAC) {
    daftar.push('/Applications/Android Studio.app/Contents/jbr/Contents/Home');
  } else {
    daftar.push('/opt/android-studio/jbr', path.join(rumah, 'android-studio', 'jbr'),
      '/usr/local/android-studio/jbr', '/snap/android-studio/current/android-studio/jbr');
  }
  return daftar;
}

function cekJava() {
  // 1) Coba Java dari tempat-tempat yang biasa
  for (const folderJdk of daftarJdkKandidat()) {
    if (fs.existsSync(berkasJava(folderJdk)) && versiJava(berkasJava(folderJdk)) >= JAVA_MINIMAL) {
      process.env.JAVA_HOME = folderJdk;                                          // beri tahu Gradle
      process.env.PATH = path.join(folderJdk, 'bin') + path.delimiter + process.env.PATH;
      beres('Java ditemukan: ' + folderJdk);
      return;
    }
  }
  // 2) Coba Java yang sudah ada di PATH komputer
  const v = versiJava('java');
  if (v >= JAVA_MINIMAL) { beres('Java ' + v + ' (dari PATH)'); return; }

  berhenti('Java (JDK) versi ' + JAVA_MINIMAL + ' ke atas tidak ditemukan' + (v ? ' (yang ada baru versi ' + v + ')' : '') + '.', [
    'Cara paling mudah: pasang Android Studio dari https://developer.android.com/studio',
    '(Java sudah ikut di dalamnya, dan kita memang butuh Android Studio untuk Android SDK).',
    'Atau pasang JDK 21 saja dari https://adoptium.net lalu jalankan lagi skrip ini.',
  ]);
}

/* ---------------------------------------------------------------------
   LANGKAH 1c — Cari Android SDK
   Android SDK otomatis terpasang saat Android Studio pertama kali dibuka.
   --------------------------------------------------------------------- */
function cariSdk() {
  const rumah = os.homedir();
  const kandidat = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT];   // pengaturan milik Anda
  if (WINDOWS && process.env.LOCALAPPDATA) kandidat.push(path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'));
  if (MAC) kandidat.push(path.join(rumah, 'Library', 'Android', 'sdk'));
  if (!WINDOWS && !MAC) kandidat.push(path.join(rumah, 'Android', 'Sdk'));
  for (const folderSdk of kandidat) {
    // Dianggap benar jika foldernya ada dan berisi "platforms" atau "platform-tools"
    if (folderSdk && fs.existsSync(folderSdk) &&
        (fs.existsSync(path.join(folderSdk, 'platforms')) || fs.existsSync(path.join(folderSdk, 'platform-tools')))) {
      process.env.ANDROID_HOME = folderSdk;
      process.env.ANDROID_SDK_ROOT = folderSdk;
      beres('Android SDK ditemukan: ' + folderSdk);
      return folderSdk;
    }
  }
  berhenti('Android SDK tidak ditemukan.', [
    'Pasang Android Studio dari https://developer.android.com/studio',
    'Buka sekali sampai selesai mengunduh komponen (Setup Wizard), lalu jalankan lagi: node buat-apk.js',
    'Jika SDK Anda ada di folder lain, atur dulu ANDROID_HOME ke folder tersebut.',
  ]);
}

/* ---------------------------------------------------------------------
   LANGKAH 2 — Pasang paket npm (Capacitor) bila belum ada
   --------------------------------------------------------------------- */
function pasangPaket() {
  if (fs.existsSync(path.join(FOLDER, 'node_modules', '@capacitor', 'cli'))) {
    beres('Paket Capacitor sudah terpasang');
    return;
  }
  catatan('Memasang paket (butuh internet, sekitar 1 menit)...');
  jalankan('npm install');
  beres('Paket Capacitor terpasang');
}

/* ---------------------------------------------------------------------
   LANGKAH 3 — Buat proyek Android dari isi folder "www"
   --------------------------------------------------------------------- */
function buatProyekAndroid(ulang) {
  if (!fs.existsSync(path.join(FOLDER, 'www', 'index.html'))) {
    berhenti('File www/index.html tidak ada.', ['Pastikan game Anda bernama index.html dan ada di dalam folder "www".']);
  }
  if (ulang && fs.existsSync(FOLDER_ANDROID)) {
    fs.rmSync(FOLDER_ANDROID, { recursive: true, force: true });   // hapus proyek Android lama
    catatan('Proyek Android lama dihapus (--ulang)');
  }
  if (!fs.existsSync(FOLDER_ANDROID)) {
    jalankan('npx cap add android');                                // buat proyek Android baru
    beres('Proyek Android dibuat');
  } else {
    beres('Proyek Android sudah ada (dipakai ulang)');
  }
}

/* ---------------------------------------------------------------------
   LANGKAH 4 — Pasang ikon aplikasi
   Folder ikon/res berisi gambar bintang untuk semua ukuran layar.
   Kita salin menimpa ikon bawaan Capacitor.
   --------------------------------------------------------------------- */
function pasangIkon() {
  const tujuan = path.join(FOLDER_ANDROID, 'app', 'src', 'main', 'res');
  fs.cpSync(path.join(FOLDER, 'ikon', 'res'), tujuan, { recursive: true, force: true });   // salin gambar ikon
  // Warna latar untuk ikon adaptif (ikon yang bentuknya bisa bulat/kotak sesuai HP)
  fs.writeFileSync(
    path.join(tujuan, 'values', 'ic_launcher_background.xml'),
    '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">' +
      WARNA_LATAR_IKON + '</color>\n</resources>\n'
  );
  beres('Ikon aplikasi terpasang');
}

/* ---------------------------------------------------------------------
   LANGKAH 5 — Sinkronkan isi game ke proyek Android, lalu bangun APK
   --------------------------------------------------------------------- */
function sinkronkan(folderSdk) {
  jalankan('npx cap sync android');   // menyalin isi folder "www" ke dalam proyek Android
  // Memberi tahu Gradle di mana Android SDK berada (garis miring biasa agar aman di Windows)
  fs.writeFileSync(path.join(FOLDER_ANDROID, 'local.properties'), 'sdk.dir=' + folderSdk.replace(/\\/g, '/') + '\n');
  beres('Isi game disalin ke proyek Android');
}

function bangunApk() {
  catatan('Membangun APK. Pertama kali bisa 5-15 menit karena mengunduh alat bantu. Mohon sabar...');
  const perintah = WINDOWS ? 'gradlew.bat assembleDebug' : './gradlew assembleDebug';
  if (!WINDOWS) fs.chmodSync(path.join(FOLDER_ANDROID, 'gradlew'), 0o755);   // agar boleh dijalankan
  jalankan(perintah, FOLDER_ANDROID);
}

/* ---------------------------------------------------------------------
   LANGKAH 6 — Salin hasil ke folder "hasil"
   --------------------------------------------------------------------- */
function salinHasil() {
  const asal = path.join(FOLDER_ANDROID, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  if (!fs.existsSync(asal)) berhenti('Build selesai tetapi file APK tidak ditemukan di: ' + asal);
  const folderHasil = path.join(FOLDER, 'hasil');
  fs.mkdirSync(folderHasil, { recursive: true });
  const tujuan = path.join(folderHasil, NAMA_APK);
  fs.copyFileSync(asal, tujuan);
  return tujuan;
}

/* ---------------------------------------------------------------------
   PROGRAM UTAMA — menjalankan semua langkah berurutan
   --------------------------------------------------------------------- */
function main() {
  console.log('=== Pembuat APK: Asah Otak Seru ===');
  const ulang = process.argv.includes('--ulang');   // apakah pengguna menambahkan --ulang

  langkah('1/6  Mengecek alat yang dibutuhkan');
  cekNode();
  cekJava();
  const folderSdk = cariSdk();

  try {
    langkah('2/6  Memasang paket');
    pasangPaket();

    langkah('3/6  Menyiapkan proyek Android');
    buatProyekAndroid(ulang);

    langkah('4/6  Memasang ikon');
    pasangIkon();

    langkah('5/6  Menyalin game & membangun APK');
    sinkronkan(folderSdk);
    bangunApk();

    langkah('6/6  Menyelesaikan');
    const apk = salinHasil();
    console.log('\n✅ SELESAI! File APK Anda:\n   ' + apk);
    console.log('\nCara memasang di HP:');
    console.log('  1. Kirim file APK ke HP (kabel USB, WhatsApp, Google Drive, dll).');
    console.log('  2. Di HP, ketuk file APK tersebut.');
    console.log('  3. Jika diminta, izinkan "Pasang dari sumber ini / Install unknown apps".');
  } catch (e) {
    berhenti('Pembuatan APK gagal: ' + e.message, [
      'Penyebab yang paling sering, coba satu per satu:',
      '- Internet terputus saat mengunduh Gradle/SDK -> jalankan lagi perintah yang sama.',
      '- Lisensi Android SDK belum disetujui -> buka terminal lalu jalankan:',
      '     "' + path.join(process.env.ANDROID_HOME || '<folder SDK>', 'cmdline-tools', 'latest', 'bin', 'sdkmanager') + '" --licenses',
      '  (jawab "y" untuk setiap pertanyaan setelah Anda membaca lisensinya).',
      '- Komponen SDK kurang -> buka Android Studio > More Actions > SDK Manager, lalu pasang "Android SDK Platform 36"',
      '  dan "Android SDK Build-Tools".',
      '- Proyek rusak -> jalankan: node buat-apk.js --ulang',
      'Pesan error lengkapnya ada di layar, tepat di atas pesan ini.',
    ]);
  }
}

main();   // mulai!
