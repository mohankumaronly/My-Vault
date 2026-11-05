import { base64ToBytes, bytesToBase64, utf8ToBytes } from "./encoding";

const AES_ALGO = "AES-GCM";

export const NONCE_LENGTH = 12;

/** Normalize a typed array to a fresh Uint8Array backed by a plain ArrayBuffer. */
function toBufferSource(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out;
}

export async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  if (raw.length !== 32) throw new Error("AES-256 key must be 32 bytes");
  return crypto.subtle.importKey("raw", toBufferSource(raw), { name: AES_ALGO }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export function generateNonce(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(NONCE_LENGTH));
}

export function generateDek(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function generateSalt(): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(16));
}

export interface EncryptedBlob {
  ciphertext: string;
  nonce: string;
}

/** AES-256-GCM encrypt with optional Additional Authenticated Data (AAD). */
export async function encryptWithKey(
  key: CryptoKey,
  plaintext: Uint8Array,
  aad?: Uint8Array
): Promise<EncryptedBlob> {
  const nonce = generateNonce();
  const params: AesGcmParams = { name: AES_ALGO, iv: nonce };
  if (aad) params.additionalData = toBufferSource(aad);

  const ctBuffer = await crypto.subtle.encrypt(params, key, toBufferSource(plaintext));
  return {
    ciphertext: bytesToBase64(new Uint8Array(ctBuffer)),
    nonce: bytesToBase64(nonce),
  };
}

/** AES-256-GCM decrypt. Throws on authentication failure (wrong key / tampering). */
export async function decryptWithKey(
  key: CryptoKey,
  ciphertextB64: string,
  nonceB64: string,
  aad?: Uint8Array
): Promise<Uint8Array> {
  const ct = base64ToBytes(ciphertextB64);
  const nonce = base64ToBytes(nonceB64);
  const params: AesGcmParams = { name: AES_ALGO, iv: toBufferSource(nonce) };
  if (aad) params.additionalData = toBufferSource(aad);
  const ptBuffer = await crypto.subtle.decrypt(params, key, toBufferSource(ct));
  return new Uint8Array(ptBuffer);
}

/** Build AAD binding ciphertext to credential identity + version. */
export function buildCredentialAad(
  vaultId: string,
  credentialId: string,
  encryptionVersion: number
): Uint8Array {
  return utf8ToBytes(`credential:${vaultId}:${credentialId}:v${encryptionVersion}`);
}

/** Build AAD binding the wrapped DEK to the vault salt + version (salt is public + stable). */
export function buildVaultKeyAad(saltB64: string, encryptionVersion: number): Uint8Array {
  return utf8ToBytes(`vaultkey:${saltB64}:v${encryptionVersion}`);
}
