import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** SHA-256 hex hash — used for session tokens (opaque, high entropy). */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

/** Generate a URL-safe random token of given byte length. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
