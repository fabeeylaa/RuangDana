import { z } from "zod";

// Validasi sisi klien hanya untuk kenyamanan; server tetap sumber kebenaran.
export const loginSchema = z.object({
  email: z.email("Format email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter.").max(80, "Nama maksimal 80 karakter."),
  email: z.email("Format email tidak valid."),
  password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(128, "Kata sandi maksimal 128 karakter."),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
