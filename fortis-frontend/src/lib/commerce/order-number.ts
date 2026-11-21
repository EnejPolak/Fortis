import { randomBytes } from "crypto";

/** Human-readable order number, e.g. FT-20261121-A3F9 */
export function createOrderNumber(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  return `FT-${y}${m}${d}-${suffix}`;
}

export function createGuestAccessToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
