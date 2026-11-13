# JogetYuk

Game ritme berbasis web yang terinspirasi dari konsep game DDR (Dance Dance Revolution) / AyoDance, tapi dengan mekanik kontrol yang berbeda: memakai **pose tubuh** (dideteksi lewat kamera + model computer vision) sebagai pengganti tombol/keyboard. Nggak butuh alat bantu apapun selain webcam.

## ✨ Fitur

- **Beat-synced gameplay** — arrow muncul & harus ditepati tepat sesuai beat lagu (bukan interval acak), berdasarkan file beatmap custom per lagu.
- **Deteksi pose real-time** pakai TensorFlow.js + Teachable Machine (PoseNet).
- **Sistem judgement presisi**: Perfect / Good / Too Early / Miss, dengan deteksi transisi gerakan (bukan cuma "posisi sekarang cocok") supaya nggak bisa dicurangi dengan diam di 1 pose.
- **Combo & multiplier skor**, lengkap dengan efek shake yang skalanya naik sesuai combo.
- **Skeleton overlay** di feed kamera (murah secara performa, reuse data pose yang sudah dihitung).
- **3 tingkat kesulitan** (Easy/Normal/Hard) — beda di jumlah nyawa & kepadatan not, kecepatan scroll tetap sama semua level (biar tetap adil buat game berbasis gerak tubuh).
- **Halaman kalibrasi pose** — cek dulu apakah pose kamu kedeteksi dengan baik sebelum main.
- **Leaderboard lokal** (localStorage), difilter per lagu & kesulitan, siap dimigrasikan ke backend/database nanti.
- **Daftar lagu otomatis** — taruh mp3 baru di folder `assets/`, otomatis muncul di dropdown (lewat endpoint PHP), tanpa edit kode.

## 🧰 Requirement

- Browser modern yang mendukung WebGL & getUserMedia (kamera) — Chrome/Edge/Firefox versi terbaru direkomendasikan.
- **PHP** (minimal versi 7.4+) — dibutuhkan buat endpoint `api/list-songs.php` yang men-scan folder lagu secara otomatis. Tanpa PHP, dropdown lagu nggak akan terisi.
- Webcam yang berfungsi.

> ⚠️ **Penting**: karena sistem ini pakai `fetch()` (buat baca beatmap & daftar lagu) dan endpoint PHP, project ini **tidak bisa** dijalankan dengan cara buka `index.html` langsung (double-click). Harus lewat web server yang menjalankan PHP.

## 🚀 Cara Menjalankan

Pilih salah satu:

**Opsi 1 — PHP built-in server (paling gampang, kalau PHP sudah terinstall)**
```bash
cd JogetYuk-v4
php -S localhost:8000
```
Buka `http://localhost:8000` di browser.

**Opsi 2 — XAMPP / Laragon**
Taruh folder project ini di `htdocs` (XAMPP) atau `www` (Laragon), lalu akses lewat `http://localhost/JogetYuk-v4`.

## 📁 Struktur Folder

```
JogetYuk-v4/
├── api/
│   └── list-songs.php        # Scan assets/audio/songs/ real-time, kembalikan daftar lagu (JSON)
├── assets/
│   ├── audio/
│   │   ├── songs/             # Semua mp3 lagu yang bisa dipilih (auto-detect via list-songs.php)
│   │   ├── sfx/                # Efek suara (klik, hit, miss, countdown, finish)
│   │   └── backsounds.mp3      # Musik latar menu
│   ├── video/
│   │   └── background3.mp4
│   └── images/
│       ├── logo.png
│       ├── arrows/              # Ikon arrow (atas/kiri/kanan)
│       └── poses/                # Gambar contoh pose (buat halaman "Cara Bermain")
├── beatmaps/                   # File JSON beatmap, 1 file per lagu (nama harus identik dgn mp3-nya, flat - tidak ikut direstruktur)
├── fonts/                       # Font Orbitron
├── js/                           # Seluruh logic game, dipecah per tanggung jawab (lihat bawah)
├── lib/                           # TensorFlow.js & Teachable Machine (library pihak ketiga)
├── model/                         # Model pose classifier hasil training Teachable Machine
├── index.html                      # Struktur halaman (SPA - semua "halaman" ada di 1 file)
├── style.css                        # Semua styling
└── README.md
```

### Isi folder `js/`

Kode game dipecah jadi modul-modul kecil per tanggung jawab (bukan pakai ES Modules `import`/`export`, tapi `<script>` biasa yang dimuat berurutan — perilakunya identik dengan 1 file besar, cuma lebih rapi diorganisir):

| File | Isi |
|---|---|
| `config.js` | Semua konstanta kalibrasi (dimuat **paling pertama**) |
| `state.js` | Semua variabel state yang berubah selama game jalan |
| `assets.js` | Loading audio/gambar + fungsi pemutaran suara |
| `beatSync.js` | Baca beatmap, jadwalkan & spawn arrow sesuai beat, load daftar lagu |
| `judgement.js` | Sistem penilaian (zona bayangan, deteksi transisi pose, Hit/Too Early/Miss) |
| `combo.js` | Multiplier skor & efek shake |
| `calibration.js` | Halaman kalibrasi pose |
| `leaderboard.js` | Simpan/ambil skor (localStorage) + render tabel |
| `navigation.js` | Navigasi SPA antar halaman |
| `render.js` | Semua yang menggambar ke canvas (game & skeleton overlay) |
| `main.js` | Entry point: init, render loop, predict loop, kontrol alur game (dimuat **paling akhir**) |

## 🎵 Cara Menambahkan Lagu Baru + Beatmap

Sistem ini dirancang supaya nambah lagu **tidak perlu ubah kode sama sekali**. Alurnya:

1. **Taruh file MP3** ke folder `assets/` (misal `"Lagu Baru.mp3"`). Otomatis muncul di dropdown lagu berkat `api/list-songs.php` yang men-scan folder ini tiap request.
2. **Buat beatmap**-nya pakai tool tap-beat kamu sendiri, export jadi JSON dengan format:
   ```json
   {
     "song": "Lagu Baru",
     "beats": [
       { "timestamp": 1.234, "direction": "kiri" },
       { "timestamp": 1.789, "direction": "atas" }
     ]
   }
   ```
   `direction` harus salah satu dari: `"kiri"`, `"atas"`, `"kanan"`.
3. **Rename file JSON** itu supaya **persis sama** dengan nama file MP3-nya (case-sensitive, termasuk spasi) — cuma beda ekstensi. Contoh: `"Lagu Baru.mp3"` → `"Lagu Baru.json"`.
4. **Taruh file JSON** itu ke folder `beatmaps/`.
5. **Refresh browser.** Selesai — lagu otomatis kedeteksi punya beatmap dan siap dimainkan.

Kalau MP3 sudah ada tapi beatmap-nya belum, lagu tetap muncul di dropdown tapi akan menampilkan peringatan "belum tersedia untuk mode ritme" ketika dipilih (bukan error/crash).

## ⚙️ Konfigurasi & Kalibrasi

Semua angka yang mungkin perlu di-tuning ada di `js/config.js`, dikelompokkan jadi 1 blok konfigurasi:

| Konstanta | Fungsi |
|---|---|
| `ARROW_SPEED_PX_PER_SEC` | Kecepatan scroll arrow (piksel/detik), sama untuk semua level |
| `DIFFICULTY_MISSES` | Jumlah nyawa per level (easy/normal/hard) |
| `DIFFICULTY_THINNING` | Kepadatan not per level (ambil 1 dari tiap N beat) |
| `JUDGE_ZONE_LEAD_SEC` | Seberapa awal sebuah beat mulai bisa dinilai ("zona bayangan") |
| `PERFECT_WINDOW_SEC` / `GOOD_WINDOW_SEC` | Toleransi presisi timing untuk skor Perfect/Good |
| `PREDICT_INTERVAL_MS` | Seberapa sering model pose dijalankan (ms) — makin kecil = makin presisi tapi makin berat |
| `DEBUG_MODE` | Set `true` buat lihat log informasional tambahan di console |

## 🙏 Kredit & Library Pihak Ketiga

- [TensorFlow.js](https://www.tensorflow.org/js) — Apache License 2.0
- [Teachable Machine (Google)](https://teachablemachine.withgoogle.com/) — model pose classifier di-training pakai tool ini
- [Orbitron Font](https://fonts.google.com/specimen/Orbitron) — SIL Open Font License

## 🗺️ Rencana Pengembangan

- [x] Restrukturisasi folder `assets/` (pisah audio/video/images lebih rapi)
- [x] Pecah `script.js` jadi modul-modul kecil per tanggung jawab (lihat folder `js/`)
- [ ] Migrasi leaderboard dari localStorage ke database (kalau sudah siap publish ke publik)

## 📄 Lisensi

Belum ditentukan — silakan tambahkan lisensi pilihanmu (misal MIT) kalau project ini akan di-publish.
