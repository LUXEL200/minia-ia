import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const key = () => createHash("sha256").update(ENV.cookieSecret || "minia-dev-secret").digest();

export function encodeBase32(buffer: Buffer) {
  let bits = "";
  for (let i = 0; i < buffer.length; i += 1) bits += buffer[i].toString(2).padStart(8, "0");
  let result = "";
  for (let i = 0; i < bits.length; i += 5) result += alphabet[Number.parseInt(bits.slice(i, i + 5).padEnd(5, "0"), 2)];
  return result;
}
export function decodeBase32(value: string) {
  let bits = "";
  for (const char of value.replace(/=+$/g, "").toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index < 0) throw new Error("Secret TOTP invalide");
    bits += index.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(bytes);
}
export function generateTotpSecret() { return encodeBase32(randomBytes(20)); }
export function totpCode(secret: string, time = Date.now()) {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const digest = createHmac("sha1", decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, "0");
}
export function verifyTotpCode(secret: string, code: string, now = Date.now()) {
  return /^\d{6}$/.test(code) && [-1, 0, 1].some(offset => totpCode(secret, now + offset * 30000) === code);
}
export function encryptTotpSecret(secret: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64url")}.${cipher.getAuthTag().toString("base64url")}.${body.toString("base64url")}`;
}
export function decryptTotpSecret(value: string) {
  const [iv, tag, body] = value.split("."); const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url")); return Buffer.concat([decipher.update(Buffer.from(body, "base64url")), decipher.final()]).toString("utf8");
}
export function createAdminMfaCookie(userId: number, now = Date.now()) {
  const payload = `${userId}.${Math.floor(now / 1000)}`;
  return `${payload}.${createHmac("sha256", key()).update(payload).digest("base64url")}`;
}
export function verifyAdminMfaCookie(value: string | undefined, userId: number, now = Date.now()) {
  if (!value) return false;
  const [id, issued, signature] = value.split("."); const payload = `${id}.${issued}`;
  const expected = createHmac("sha256", key()).update(payload).digest("base64url");
  return Number(id) === userId && signature === expected && now / 1000 - Number(issued) < 8 * 60 * 60;
}
