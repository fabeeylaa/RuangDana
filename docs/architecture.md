# Arsitektur (Phase 1)

- **web** memanggil **api** lewat `/api/*` (proxy Vite saat dev).
- **shared** adalah satu-satunya tempat tipe domain dan helper uang agar web dan api konsisten.
- Rencana Phase 2+: Prisma + PostgreSQL di `apps/api`, kode backend per fitur (`features/<fitur>/{routes,service,schema}`), semua perubahan keuangan divalidasi di backend dan dibungkus transaksi database.
