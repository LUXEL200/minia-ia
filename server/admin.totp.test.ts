import { describe, expect, it } from "vitest";
import { createAdminMfaCookie, decryptTotpSecret, encryptTotpSecret, generateTotpSecret, totpCode, verifyAdminMfaCookie, verifyTotpCode } from "./adminTotp";

describe("Admin TOTP security", () => {
  it("génère et vérifie un code sur la fenêtre de temps", () => {
    const secret = generateTotpSecret(); const now = 1_750_000_000_000; const code = totpCode(secret, now);
    expect(code).toMatch(/^\d{6}$/); expect(verifyTotpCode(secret, code, now)).toBe(true); expect(verifyTotpCode(secret, "000000", now)).toBe(false);
  });
  it("chiffre le secret sans le restituer en clair", () => {
    const secret = generateTotpSecret(); const cipher = encryptTotpSecret(secret);
    expect(cipher).not.toContain(secret); expect(decryptTotpSecret(cipher)).toBe(secret);
  });
  it("accepte seulement le cookie MFA signé et non expiré", () => {
    const now = 1_750_000_000_000; const cookie = createAdminMfaCookie(42, now);
    expect(verifyAdminMfaCookie(cookie, 42, now + 60_000)).toBe(true); expect(verifyAdminMfaCookie(cookie, 7, now)).toBe(false); expect(verifyAdminMfaCookie(cookie, 42, now + 8 * 60 * 60 * 1000 + 1)).toBe(false);
  });
});
