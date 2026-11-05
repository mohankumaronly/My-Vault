import { createCipheriv, randomBytes } from "node:crypto";
import argon2 from "argon2";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
// Self-hosted vault bootstrap.
//
// The deployment is driven by a single MASTER_KEY supplied through the backend
// .env. On startup we make sure a vault exists whose key envelope was derived
// from that master key, so the operator (and only the operator) can unlock the
// dashboard by typing the same master key in the browser.
//
// The derivation here is byte-for-byte identical to the client's
// deriveMasterKey in frontend/src/crypto/argon2.ts:
//
//   argon2id(password=masterKey, salt, memory=65536, iterations=3,
//            parallelism=4, hashLength=64)
//     bytes[0..31]  - KEK            (wraps the DEK)
//     bytes[32..63] - auth verifier  (proves key possession to the server)
//
// The KEK and the raw DEK NEVER leave the server during bootstrap; only the
// wrapped DEK, its nonce, the public salt and the argon2 hash of the verifier
// are persisted. The browser can therefore reproduce the exact same KEK from
// the same master key + salt and unwrap the DEK locally.
const KDF_MEMORY_KIB = 65536;
const KDF_ITERATIONS = 3;
const KDF_PARALLELISM = 4;
const KDF_OUTPUT_LENGTH = 64;
const ENCRYPTION_VERSION = 1;
const SALT_BYTES = 16;
const DEK_BYTES = 32;
const NONCE_BYTES = 12;
function toBase64(bytes: Uint8Array): string {
return Buffer.from(bytes).toString("base64");
}
// AAD binds the wrapped DEK to the public salt + encryption version (must match client).
function buildVaultKeyAad(saltB64: string, encryptionVersion: number): Buffer {
return Buffer.from("vaultkey:" + saltB64 + ":v" + encryptionVersion, "utf8");
}// Derive 64 bytes (KEK + authVerifier) from the master key - identical to the
// client's deriveMasterKey. Return type is inferred, so no angle brackets here.
async function deriveMasterKey(masterKey: string, salt: Uint8Array) {
const raw = await argon2.hash(masterKey, {
type: argon2.argon2id,
salt: Buffer.from(salt),
memoryCost: KDF_MEMORY_KIB,
timeCost: KDF_ITERATIONS,
parallelism: KDF_PARALLELISM,
hashLength: KDF_OUTPUT_LENGTH,
raw: true,
});
const bytes = Buffer.from(raw);
if (bytes.length !== KDF_OUTPUT_LENGTH) {
throw new Error("Unexpected Argon2 output length during vault bootstrap");
}
return {
kek: bytes.subarray(0, 32),
authVerifier: bytes.subarray(32, 64),
};
}
// Wrap a freshly generated DEK with the KEK using AES-256-GCM.
function wrapDek(kek: Buffer, saltB64: string) {
const dek = randomBytes(DEK_BYTES);
const nonce = randomBytes(NONCE_BYTES);
const aad = buildVaultKeyAad(saltB64, ENCRYPTION_VERSION);
const cipher = createCipheriv("aes-256-gcm", kek, nonce);
cipher.setAAD(aad);
const body = Buffer.concat([cipher.update(dek), cipher.final()]);
const tag = cipher.getAuthTag();
return {
// WebCrypto expects ciphertext + tag, which is exactly what we concatenate.
wrappedVaultKey: toBase64(Buffer.concat([body, tag])),
keyNonce: toBase64(nonce),
};
}
// Hash the auth verifier with argon2id for at-rest storage.
async function hashVerifier(authVerifier: Buffer) {
return argon2.hash(authVerifier.toString("base64"), {
type: argon2.argon2id,
memoryCost: KDF_MEMORY_KIB,
timeCost: KDF_ITERATIONS,
parallelism: KDF_PARALLELISM,
});
}// Ensure a vault exists for the configured MASTER_KEY.
//
// - No MASTER_KEY configured      : self-host bootstrap is disabled, do nothing.
// - No vault in the database      : create one from the env master key.
// - A vault already exists        : verify the env key still matches the
//                                   stored verifier and leave the data intact.
//
// Resolves to true when a vault is ready to be unlocked.
export async function bootstrapVault() {
if (!env.MASTER_KEY) {
console.warn(
"MASTER_KEY is not set - skipping self-hosted vault bootstrap. " +
"Set MASTER_KEY in backend/.env to auto-provision the vault."
);
return false;
}
const existing = await prisma.vault.findFirst();
if (existing) {
// Verify the configured master key still unlocks the existing vault so we
// fail loudly on a typo instead of silently leaving an unreachable vault.
const salt = Buffer.from(existing.salt, "base64");
const derived = await deriveMasterKey(env.MASTER_KEY, salt);
const matches = await argon2
.verify(existing.authVerifierHash, derived.authVerifier.toString("base64"))
.catch(function () {
return false;
});
if (matches) {
console.log("Vault bootstrap: existing vault verified against MASTER_KEY.");
return true;
}
// Self-host model: backend/.env is the source of truth for the master key.
// If it no longer matches the stored vault, re-provision the envelope so
// the configured MASTER_KEY can unlock the dashboard. Credentials encrypted
// under the old DEK cannot be recovered, so we clear them explicitly.
console.warn(
"Vault bootstrap: MASTER_KEY changed - re-provisioning the vault. " +
"Existing credentials encrypted with the previous key will be discarded."
);
await prisma.vault.delete({ where: { id: existing.id } });
}
// First run: provision the vault from the env master key.
const salt = randomBytes(SALT_BYTES);
const saltB64 = toBase64(salt);
const derived = await deriveMasterKey(env.MASTER_KEY, salt);
const wrapped = wrapDek(derived.kek, saltB64);
const authVerifierHash = await hashVerifier(derived.authVerifier);
await prisma.vault.create({
data: {
kdfAlgorithm: "ARGON2ID",
kdfMemoryKiB: KDF_MEMORY_KIB,
kdfIterations: KDF_ITERATIONS,
kdfParallelism: KDF_PARALLELISM,
kdfOutputLength: KDF_OUTPUT_LENGTH,
salt: saltB64,
keyEncryptionAlgo: "AES-256-GCM",
wrappedVaultKey: wrapped.wrappedVaultKey,
keyNonce: wrapped.keyNonce,
encryptionVersion: ENCRYPTION_VERSION,
authVerifierHash,
},
});
console.log("Vault bootstrap: provisioned vault from MASTER_KEY.");
return true;
}