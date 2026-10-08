# RuangDana

**Beri Ruang untuk Setiap Tujuan.**

Aplikasi web pencatatan dan perencanaan keuangan pribadi untuk mahasiswa dan anak muda Indonesia. Proyek pembelajaran dan portofolio.

> RuangDana **bukan** layanan perbankan, pemroses pembayaran, atau platform investasi. Semua data dicatat manual oleh pengguna dan tidak ada uang nyata yang dipindahkan.

## Status: Phase 3 (Transaksi, Transfer, dan Saldo)

| Sudah ada | Belum ada |
|---|---|
| Monorepo (web, api, shared), design system, shell responsif | Logika tabungan virtual/eksternal nyata (Phase 4) |
| Skema PostgreSQL + migrasi (User, Session, Account, Category, Transaction) | Perencana tabungan, anggaran, laporan (Phase 5–6) |
| Register, login, logout, sesi server-side, profil, ganti kata sandi | Halaman Detail Tujuan Tabungan |
| Akun keuangan dengan saldo yang dihitung dari transaksi | Pemulihan kata sandi (lupa kata sandi) |
| Pemasukan, pengeluaran, transfer antar akun: tambah, ubah, hapus (soft delete), filter, paginasi | Tes frontend |
| Dasbor nyata: total aset, pemasukan/pengeluaran bulan ini, tren 6 bulan, rincian per kategori | Halaman Anggaran, Laporan, Pengaturan |
| 34 tes backend otomatis | |

Hanya bagian **Tujuan Tabungan** (dan kartu progresnya di Dashboard) yang masih memakai **data contoh fiktif** dan diberi label. Logo masih **placeholder sementara**.

> **Penting: bagian Prisma belum diverifikasi.** Lingkungan tempat kode ini ditulis tidak dapat mengunduh engine Prisma, sehingga `prisma generate`/`migrate` tidak pernah dijalankan di sana. Yang sudah diuji nyata: SQL migrasi pada PostgreSQL 16 (constraint dan cascade) serta seluruh logika API melalui tes. Yang **belum** diuji: `apps/api/src/db/prisma/*` (typecheck dan eksekusi), karena bergantung pada client hasil generate. Lihat langkah verifikasi di bawah.

## Struktur

```
ruangdana/
├── apps/
│   ├── web/      React + Vite + TypeScript + Tailwind CSS v4
│   └── api/      Express + TypeScript
├── packages/
│   └── shared/   Tipe dan helper uang (format Rupiah) yang dipakai web & api
├── docs/
└── README.md
```

Kode web dikelompokkan per fitur (`src/features/<fitur>`), komponen generik ada di `src/components/ui`.

## Menjalankan secara lokal

Prasyarat: Node.js 20+ (diuji pada 22), npm, dan PostgreSQL 16 (paling mudah lewat Docker).

```bash
npm install
docker compose up -d                          # PostgreSQL lokal (lihat docker-compose.yml)
cp apps/api/.env.example apps/api/.env
npm run db:generate -w @ruangdana/api         # membuat Prisma client
npm run db:deploy   -w @ruangdana/api         # menerapkan migrasi
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api/health

Tanpa Docker, arahkan `DATABASE_URL` di `apps/api/.env` ke PostgreSQL milikmu sendiri.

Vite meneruskan `/api/*` ke `localhost:4000`, jadi cookie sesi berlaku di satu origin dan tidak perlu konfigurasi CORS tambahan saat pengembangan.

### Verifikasi bagian Prisma (wajib dilakukan sekali)

```bash
npm run db:generate -w @ruangdana/api
npm run typecheck          # harus bersih, termasuk apps/api/src/db/prisma
npm run db:deploy -w @ruangdana/api
npm run dev                # lalu daftar, buat akun, cek di halaman Akun
```

Jika `prisma migrate dev` melaporkan *drift* terhadap migrasi `20261008000000_init`, berarti SQL tulisan tangan tidak identik dengan hasil Prisma; buat ulang dengan `prisma migrate dev --name init` pada database kosong.

### Mencoba tanpa database

`npm run dev:memory -w @ruangdana/api` menjalankan API dengan penyimpanan in-memory (data hilang saat berhenti). Hanya untuk melihat alur UI; bukan pengganti PostgreSQL.

### Perintah lain

```bash
npm run test -w @ruangdana/api   # tes backend (vitest)
npm run typecheck                # semua workspace
npm run build                    # api (tsup) dan web (vite)
```

## Keputusan arsitektur

- **Uang sebagai integer Rupiah.** Tidak memakai desimal/float (`packages/shared/src/money.ts`).
- **Shared package berisi TypeScript mentah.** Vite dan tsup yang melakukan kompilasi, sehingga tidak ada langkah build terpisah.
- **Tabungan tanpa hitung ganda.** Tabungan *virtual* tetap di dalam saldo akun dan hanya mengurangi saldo tersedia; tabungan *eksternal* tidak dikurangkan lagi dari saldo (lihat `apps/web/src/lib/finance.ts`). Ini baru logika tampilan; validasi sebenarnya dilakukan di backend pada Phase 3–4.
- **Sesi server-side, bukan JWT.** Token acak 256-bit di cookie `httpOnly` + `SameSite=Lax` (`Secure` di produksi); database hanya menyimpan hash SHA-256-nya, sehingga logout dan ganti kata sandi benar-benar mencabut sesi.
- **Kata sandi:** Argon2id (`@node-rs/argon2`). Login tidak membedakan "email tak dikenal" dan "kata sandi salah", dan waktu prosesnya diseimbangkan.
- **CSRF:** cookie SameSite=Lax ditambah pemeriksaan header `Origin` untuk semua permintaan yang mengubah data.
- **Rate limit** pada login (10/15 menit) dan register (10/jam) per IP. Di belakang reverse proxy, atur `TRUST_PROXY`.
- **Otorisasi di lapisan data.** Setiap query akun menyertakan `userId`; akun milik orang lain dan akun yang tidak ada sama-sama menghasilkan 404 (dibuktikan oleh tes isolasi).
- **Akses data lewat interface repository** (`apps/api/src/db/types.ts`). Implementasi Prisma dipakai server; implementasi in-memory hanya untuk tes. Konsekuensinya: tes tidak menyentuh Prisma/PostgreSQL.
- **Akun diarsipkan, bukan dihapus,** agar riwayat transaksi tetap utuh. Akun hanya bisa diarsipkan saat saldonya Rp0, dan akun arsip tidak menerima transaksi.
- **Saldo dihitung, tidak disimpan:** saldo = saldo awal + pemasukan − pengeluaran − transfer keluar + transfer masuk (hanya transaksi yang belum dihapus). Tidak ada kolom saldo yang bisa tidak sinkron.
- **Saldo tidak boleh negatif** setelah transaksi dibuat, diubah, atau dihapus (422 `INSUFFICIENT_BALANCE` / `BALANCE_WOULD_BE_NEGATIVE`). Karena itu pemasukan yang uangnya sudah terpakai tidak bisa dihapus. Mengubah saldo awal juga tidak boleh membuat saldo negatif.
- **Transfer tidak mengubah total aset** dan tidak dihitung sebagai pemasukan/pengeluaran di dasbor.
- **Atomik dan aman dari balapan:** setiap perubahan berjalan dalam satu transaksi database dengan `SELECT … FOR UPDATE` pada akun yang terlibat (urut id, anti-deadlock). Dua pengeluaran serentak yang melebihi saldo: hanya satu lolos (ada tesnya pada implementasi in-memory).
- **Riwayat terjaga:** transaksi dihapus secara *soft delete* (`deletedAt`). Jenis transaksi tidak bisa diubah setelah dibuat.
- **Pertahanan berlapis:** constraint CHECK di PostgreSQL (jumlah 1..1e12, bentuk transaksi sesuai jenis) selain validasi Zod.
- **Keamanan dasar API lainnya:** `helmet`, CORS dibatasi dengan `credentials`, ukuran body dibatasi, validasi env dan input dengan Zod, pesan error tidak membocorkan detail internal.

## Keterbatasan yang diketahui

- Tes otomatis baru mencakup backend dengan penyimpanan in-memory; belum ada tes frontend, dan belum ada tes terhadap PostgreSQL lewat Prisma.
- Antarmuka (Masuk, Daftar, Onboarding, Akun, Profil, Transaksi, Dashboard) lolos typecheck dan build, tetapi belum diperiksa secara visual di browser.
- Belum ada fitur lupa kata sandi dan verifikasi email.
- Kategori bawaan dibuat per pengguna saat pertama dibuka; belum ada UI untuk mengubah/menghapus kategori (API hanya list dan tambah).
- Satu mata uang (IDR), tanpa transaksi berulang.
- Tombol "Tujuan baru" sengaja nonaktif sampai Phase 4.
- Tes konkurensi memakai penyimpanan in-memory; penguncian baris `FOR UPDATE` pada PostgreSQL belum diuji dengan beban paralel nyata.
- Bundle JS frontend ±713 kB (belum di-code-split).
- `npm audit` melaporkan kerentanan pada alat pengembangan (`esbuild` dan `shell-quote` via `concurrently`), bukan pada kode runtime aplikasi; belum ditangani.
