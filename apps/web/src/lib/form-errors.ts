import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "./api";

/** Menaruh galat per-kolom dari server ke form; mengembalikan pesan umum bila tidak ada kolom yang cocok. */
export function applyApiError<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>): string | null {
  if (!(err instanceof ApiError)) return "Terjadi kesalahan tak terduga.";
  let matched = false;
  for (const [field, message] of Object.entries(err.fields ?? {})) {
    if (field === "_") continue;
    setError(field as Path<T>, { message });
    matched = true;
  }
  return matched ? null : err.message;
}
