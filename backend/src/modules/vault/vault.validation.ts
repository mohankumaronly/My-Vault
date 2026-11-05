import { z } from "zod";

const base64 = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/_-]+={0,2}$/, "Must be base64/base64url encoded");

const kdfParametersSchema = z.object({
  memoryKiB: z.number().int().min(8192).max(1_048_576),
  iterations: z.number().int().min(1).max(20),
  parallelism: z.number().int().min(1).max(16),
  outputLength: z.number().int().min(32).max(128),
});

export const setupVaultSchema = z.object({
  kdfAlgorithm: z.literal("ARGON2ID"),
  kdfParameters: kdfParametersSchema,
  salt: base64,
  keyEncryptionAlgo: z.literal("AES-256-GCM"),
  wrappedVaultKey: base64,
  keyNonce: base64,
  authVerifier: base64,
  encryptionVersion: z.number().int().min(1).max(100).default(1),
});

export const unlockVaultSchema = z.object({
  authVerifier: base64,
});

export const updateKeyEnvelopeSchema = z.object({
  kdfAlgorithm: z.literal("ARGON2ID"),
  kdfParameters: kdfParametersSchema,
  salt: base64,
  wrappedVaultKey: base64,
  keyNonce: base64,
  authVerifier: base64,
  encryptionVersion: z.number().int().min(1).max(100),
});

export type SetupVaultPayload = z.infer<typeof setupVaultSchema>;
export type UnlockVaultPayload = z.infer<typeof unlockVaultSchema>;
export type UpdateKeyEnvelopePayload = z.infer<typeof updateKeyEnvelopeSchema>;
