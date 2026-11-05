import {
  buildCredentialAad,
  buildVaultKeyAad,
  decryptWithKey,
  encryptWithKey,
  generateDek,
  importAesKey,
} from "./aes";
import { base64ToBytes, bytesToBase64, bytesToUtf8, utf8ToBytes } from "./encoding";

export interface WrappedDek {
  wrappedVaultKey: string;
  keyNonce: string;
}

/** Wrap the DEK with the KEK. AAD is bound to the (public) salt + encryption version. */
export async function wrapDek(
  kek: Uint8Array,
  saltB64: string,
  encryptionVersion = 1
): Promise<{ dek: Uint8Array; wrapped: WrappedDek }> {
  const dek = generateDek();
  const kekKey = await importAesKey(kek);
  const aad = buildVaultKeyAad(saltB64, encryptionVersion);
  const blob = await encryptWithKey(kekKey, dek, aad);
  return {
    dek,
    wrapped: { wrappedVaultKey: blob.ciphertext, keyNonce: blob.nonce },
  };
}

/** Re-wrap an existing DEK (used when rotating the master key). */
export async function rewrapDek(
  kek: Uint8Array,
  saltB64: string,
  dek: Uint8Array,
  encryptionVersion = 1
): Promise<WrappedDek> {
  const kekKey = await importAesKey(kek);
  const aad = buildVaultKeyAad(saltB64, encryptionVersion);
  const blob = await encryptWithKey(kekKey, dek, aad);
  return { wrappedVaultKey: blob.ciphertext, keyNonce: blob.nonce };
}

/** Try to unwrap the DEK. Throws when the KEK is wrong (GCM auth failure). */
export async function unwrapDek(
  kek: Uint8Array,
  saltB64: string,
  wrapped: WrappedDek,
  encryptionVersion = 1
): Promise<Uint8Array> {
  const kekKey = await importAesKey(kek);
  const aad = buildVaultKeyAad(saltB64, encryptionVersion);
  return decryptWithKey(kekKey, wrapped.wrappedVaultKey, wrapped.keyNonce, aad);
}

/** Build a non-extractable AES key from the raw DEK bytes for record operations. */
export async function dekToCryptoKey(dek: Uint8Array): Promise<CryptoKey> {
  const raw = new Uint8Array(dek.length);
  raw.set(dek);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export interface PlainCredential {
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
}

/** Encrypt a credential record with the vault DEK (AAD bound to id + version). */
export async function encryptCredential(
  dekKey: CryptoKey,
  vaultId: string,
  credentialId: string,
  credential: PlainCredential,
  encryptionVersion = 1
): Promise<{ ciphertext: string; nonce: string }> {
  const aad = buildCredentialAad(vaultId, credentialId, encryptionVersion);
  const plaintext = utf8ToBytes(JSON.stringify(credential));
  return encryptWithKey(dekKey, plaintext, aad);
}

/** Decrypt a credential record. Throws on tampering or wrong DEK. */
export async function decryptCredential(
  dekKey: CryptoKey,
  vaultId: string,
  credentialId: string,
  ciphertext: string,
  nonce: string,
  encryptionVersion = 1
): Promise<PlainCredential> {
  const aad = buildCredentialAad(vaultId, credentialId, encryptionVersion);
  const plaintext = await decryptWithKey(dekKey, ciphertext, nonce, aad);
  return JSON.parse(bytesToUtf8(plaintext)) as PlainCredential;
}

/** Generate a base64 random string (for tests / temp ids). */
export function randomBase64(length = 32): string {
  return bytesToBase64(crypto.getRandomValues(new Uint8Array(length)));
}

/** Convert a base64 auth verifier to bytes when needed. */
export function authVerifierToBytes(b64: string): Uint8Array {
  return base64ToBytes(b64);
}
