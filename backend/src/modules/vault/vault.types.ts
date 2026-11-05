export interface KdfParameters {
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  outputLength: number;
}

export interface VaultMetadataDto {
  kdfAlgorithm: string;
  kdfParameters: KdfParameters;
  salt: string;
  keyEncryptionAlgo: string;
  wrappedVaultKey: string;
  keyNonce: string;
  encryptionVersion: number;
}

export interface SetupVaultInput {
  kdfAlgorithm: "ARGON2ID";
  kdfParameters: KdfParameters;
  salt: string;
  keyEncryptionAlgo: "AES-256-GCM";
  wrappedVaultKey: string;
  keyNonce: string;
  authVerifier: string;
  encryptionVersion: number;
}

export interface UpdateKeyEnvelopeInput {
  kdfAlgorithm: "ARGON2ID";
  kdfParameters: KdfParameters;
  salt: string;
  wrappedVaultKey: string;
  keyNonce: string;
  authVerifier: string;
  encryptionVersion: number;
}
