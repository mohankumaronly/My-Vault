export interface ApiEnvelope<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface KdfParameters {
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  outputLength: number;
}

export interface VaultMetadata {
  kdfAlgorithm: string;
  kdfParameters: KdfParameters;
  salt: string;
  keyEncryptionAlgo: string;
  wrappedVaultKey: string;
  keyNonce: string;
  encryptionVersion: number;
}

export interface SessionResponse {
  vaultId: string;
  csrfToken: string;
  expiresAt: string;
}

export interface CredentialRecord {
  id: string;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  recordVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultCredential {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  notes?: string;
  recordVersion: number;
  encryptionVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultSession {
  vaultId: string;
  dek: Uint8Array;
  dekKey: CryptoKey;
  csrfToken: string;
  expiresAt: number;
}
