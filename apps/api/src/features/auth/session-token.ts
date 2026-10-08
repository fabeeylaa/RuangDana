import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "rd_session";

/** Token acak 256-bit; hanya hash-nya yang disimpan di database. */
export function newSessionToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
