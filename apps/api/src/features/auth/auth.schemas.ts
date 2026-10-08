import { z } from "zod";

const email = z
  .string({ error: "Email wajib diisi." })
  .trim()
  .toLowerCase()
  .max(254, "Email terlalu panjang.")
  .pipe(z.email("Format email tidak valid."));

const name = z
  .string({ error: "Nama wajib diisi." })
  .trim()
  .min(2, "Nama minimal 2 karakter.")
  .max(80, "Nama maksimal 80 karakter.");

// Batas atas 128 mencegah beban hashing berlebih dari input raksasa.
const newPassword = z
  .string({ error: "Kata sandi wajib diisi." })
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi maksimal 128 karakter.");

export const registerSchema = z.object({ name, email, password: newPassword });
export const loginSchema = z.object({
  email,
  password: z.string({ error: "Kata sandi wajib diisi." }).min(1, "Kata sandi wajib diisi.").max(128),
});
export const updateProfileSchema = z.object({ name });
export const changePasswordSchema = z.object({
  currentPassword: z.string({ error: "Kata sandi saat ini wajib diisi." }).min(1, "Kata sandi saat ini wajib diisi.").max(128),
  newPassword,
});
