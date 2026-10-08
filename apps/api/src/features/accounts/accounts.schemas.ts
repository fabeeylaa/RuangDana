import { z } from "zod";
import { MAX_RUPIAH } from "@ruangdana/shared";

const name = z.string({ error: "Nama akun wajib diisi." }).trim().min(1, "Nama akun wajib diisi.").max(60, "Nama akun maksimal 60 karakter.");
const type = z.enum(["CASH", "BANK", "EWALLET", "SAVINGS"], { error: "Jenis akun tidak valid." });
// Hanya bilangan bulat Rupiah yang aman; tanpa desimal.
const rupiah = z
  .number({ error: "Saldo harus berupa angka." })
  .int("Saldo harus bilangan bulat (tanpa desimal).")
  .min(0, "Saldo tidak boleh negatif.")
  .max(MAX_RUPIAH, "Saldo terlalu besar.");

export const createAccountSchema = z.object({ name, type, openingBalance: rupiah.default(0) });
export const updateAccountSchema = z
  .object({ name: name.optional(), type: type.optional(), openingBalance: rupiah.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: "Tidak ada perubahan yang dikirim." });
export const idParamSchema = z.uuid({ error: "ID tidak valid." });
