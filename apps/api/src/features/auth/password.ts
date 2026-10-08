import { hash, verify } from "@node-rs/argon2";

// Argon2id dengan parameter bawaan pustaka (memenuhi rekomendasi OWASP).
export const hashPassword = (password: string) => hash(password);

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | undefined;

/** Verifikasi palsu agar waktu respons login tidak membocorkan apakah email terdaftar. */
export async function burnPasswordCheck(password: string): Promise<void> {
  dummyHash ??= hashPassword("kata-sandi-palsu-untuk-penyeimbang-waktu");
  await verifyPassword(await dummyHash, password);
}
