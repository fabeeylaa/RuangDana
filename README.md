# RuangDana

**Beri Ruang untuk Setiap Tujuan.**

Aplikasi web pencatatan dan perencanaan keuangan pribadi untuk mahasiswa dan anak muda Indonesia. Proyek pembelajaran dan portofolio.

> RuangDana **bukan** layanan perbankan, pemroses pembayaran, atau platform investasi. Semua data dicatat manual oleh pengguna dan tidak ada uang nyata yang dipindahkan.

## Status: Phase 1 (Fondasi)

| Sudah ada | Belum ada |
|---|---|
| Monorepo (web, api, shared) | Database PostgreSQL + Prisma (Phase 2) |
| Design system Burgundy & Soft Cream | Autentikasi, halaman Login/Register/Onboarding (Phase 2) |
| Shell responsif (sidebar desktop, navigasi bawah mobile) | CRUD transaksi, transfer, saldo (Phase 3) |
| Dashboard, Transaksi, Tujuan Tabungan dengan **data contoh** | Logika tabungan virtual/eksternal (Phase 4) |
| Endpoint `GET /api/health` | Perencana tabungan, anggaran, laporan (Phase 5–6) |

Seluruh angka pada UI saat ini adalah **data contoh fiktif** (`apps/web/src/data/sample.ts`) dan diberi label di setiap halaman. Logo saat ini adalah **placeholder sementara**, bukan logo resmi.

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

Prasyarat: Node.js 20+ (diuji pada 22) dan npm.

```bash
npm install
cp apps/api/.env.example apps/api/.env   # opsional; ada nilai bawaan
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:4000/api/health

Vite meneruskan `/api/*` ke `localhost:4000`, jadi tidak perlu konfigurasi CORS saat pengembangan. Status koneksi API dapat dilihat di halaman **Pengaturan**.

Perintah lain:

```bash
npm run typecheck   # semua workspace
npm run build       # build api (tsup) dan web (vite)
npm run dev:web     # hanya frontend
npm run dev:api     # hanya backend
```

## Keputusan arsitektur

- **Uang sebagai integer Rupiah.** Tidak memakai desimal/float (`packages/shared/src/money.ts`).
- **Shared package berisi TypeScript mentah.** Vite dan tsup yang melakukan kompilasi, sehingga tidak ada langkah build terpisah.
- **Tabungan tanpa hitung ganda.** Tabungan *virtual* tetap di dalam saldo akun dan hanya mengurangi saldo tersedia; tabungan *eksternal* tidak dikurangkan lagi dari saldo (lihat `apps/web/src/lib/finance.ts`). Ini baru logika tampilan; validasi sebenarnya dilakukan di backend pada Phase 3–4.
- **Keamanan dasar API:** `helmet`, CORS dibatasi, ukuran body dibatasi, validasi env dengan Zod, pesan error tidak membocorkan detail internal.

## Keterbatasan yang diketahui

- Belum ada tes otomatis (direncanakan Phase 6).
- Tombol "Tambah transaksi" dan "Tujuan baru" sengaja nonaktif sampai backend siap.
- Bundle JS frontend ±713 kB (belum di-code-split).
- `npm audit` melaporkan kerentanan pada alat pengembangan (`esbuild` dan `shell-quote` via `concurrently`), bukan pada kode runtime aplikasi; belum ditangani.
