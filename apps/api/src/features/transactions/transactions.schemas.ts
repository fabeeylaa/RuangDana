import { z } from "zod";
import { MAX_RUPIAH } from "@ruangdana/shared";
import { isRealDate } from "../../lib/dates";

const date = z
  .string({ error: "Tanggal wajib diisi." })
  .refine(isRealDate, "Tanggal tidak valid (format yyyy-mm-dd).");

const amount = z
  .number({ error: "Jumlah harus berupa angka." })
  .int("Jumlah harus bilangan bulat (tanpa desimal).")
  .min(1, "Jumlah harus lebih dari 0.")
  .max(MAX_RUPIAH, "Jumlah terlalu besar.");

const description = z.string({ error: "Deskripsi tidak valid." }).trim().max(200, "Deskripsi maksimal 200 karakter.");
const id = (label: string) => z.uuid({ error: `${label} tidak valid.` });

export const createTransactionSchema = z.discriminatedUnion(
  "type",
  [
    z.object({
      type: z.literal("INCOME"),
      amount, date, description: description.default(""),
      accountId: id("Akun"), categoryId: id("Kategori"),
    }),
    z.object({
      type: z.literal("EXPENSE"),
      amount, date, description: description.default(""),
      accountId: id("Akun"), categoryId: id("Kategori"),
    }),
    z.object({
      type: z.literal("TRANSFER"),
      amount, date, description: description.default(""),
      accountId: id("Akun asal"), toAccountId: id("Akun tujuan"),
    }),
  ],
  { error: "Jenis transaksi tidak valid." },
);

// Jenis transaksi tidak bisa diubah; hapus lalu buat ulang bila salah jenis.
export const updateTransactionSchema = z
  .object({
    amount: amount.optional(),
    date: date.optional(),
    description: description.optional(),
    accountId: id("Akun").optional(),
    toAccountId: id("Akun tujuan").optional(),
    categoryId: id("Kategori").optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada perubahan yang dikirim." });

const blankToUndefined = (v: unknown) => (v === "" ? undefined : v);

export const listTransactionsQuerySchema = z.object({
  search: z.preprocess(blankToUndefined, z.string().trim().max(100).optional()),
  type: z.preprocess(blankToUndefined, z.enum(["INCOME", "EXPENSE", "TRANSFER"]).optional()),
  accountId: z.preprocess(blankToUndefined, id("Akun").optional()),
  categoryId: z.preprocess(blankToUndefined, id("Kategori").optional()),
  dateFrom: z.preprocess(blankToUndefined, date.optional()),
  dateTo: z.preprocess(blankToUndefined, date.optional()),
  page: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100000).default(1)),
  pageSize: z.preprocess(blankToUndefined, z.coerce.number().int().min(1).max(100).default(20)),
});

export const idParamSchema = z.uuid({ error: "ID tidak valid." });
