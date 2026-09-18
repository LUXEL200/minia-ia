import { invalidateLegacyApiKeys } from "../server/db";

const revoked = await invalidateLegacyApiKeys();
console.log(`Revoked ${revoked} legacy plaintext API key(s).`);
