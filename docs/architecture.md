# Arsitektur (Phase 3)

- **web** memanggil **api** lewat `/api/*` (proxy Vite saat dev). Sesi memakai cookie httpOnly sehingga JavaScript frontend tidak pernah memegang token.
- **shared** adalah satu-satunya tempat tipe domain dan helper uang agar web dan api konsisten.
- **api** per fitur: `features/<fitur>/{routes,service,schemas}`. Service hanya bicara ke interface repository (`src/db/types.ts`); `src/db/prisma` adalah implementasi produksi.
- Semua nilai uang: integer Rupiah (`BigInt` di PostgreSQL, `number` aman di aplikasi, batas `MAX_RUPIAH`).

## Alur autentikasi
1. `POST /api/auth/register|login` → server membuat token acak, menyimpan hash-nya di tabel `Session`, mengirim cookie.
2. Setiap request terlindungi: `requireAuth` meng-hash cookie, mencari sesi yang belum kedaluwarsa.
3. `POST /api/auth/logout` menghapus baris sesi; ganti kata sandi menghapus semua sesi lain.

## Buku besar (Phase 3)
- Endpoint: `GET/POST /api/transactions`, `PATCH/DELETE /api/transactions/:id`, `GET/POST /api/categories`, `GET /api/dashboard?month=yyyy-mm`.
- `LedgerRepo.atomically(userId, lockAccountIds, fn)` membuka transaksi database, mengunci akun terkait (`FOR UPDATE`, urut id), lalu menjalankan `fn`. Service menghitung dampak (`netDeltas`) sebelum dan sesudah perubahan, lalu menolak bila ada saldo yang negatif atau melebihi `MAX_BALANCE`.
- Aturan: transfer butuh dua akun berbeda dan tanpa kategori; pemasukan/pengeluaran butuh kategori sesuai jenis; akun yang saldonya berubah harus aktif.
- Semua query menyertakan `userId`; data milik orang lain menghasilkan 404.

## Rencana Phase 4+
Tujuan tabungan virtual/eksternal, lalu perencana tabungan, anggaran, dan laporan.
