import { z } from "zod";

const base64 = z
  .string()
  .min(1)
  .regex(/^[A-Za-z0-9+/_-]+={0,2}$/, "Must be base64/base64url encoded");

const idSchema = z.object({
  id: z.string().uuid("Invalid credential id"),
});

export const createCredentialSchema = z.object({
  ciphertext: base64,
  nonce: base64,
  encryptionVersion: z.number().int().min(1).max(100).default(1),
});

export const updateCredentialSchema = z.object({
  ciphertext: base64,
  nonce: base64,
  encryptionVersion: z.number().int().min(1).max(100).default(1),
  expectedRecordVersion: z.number().int().min(1),
});

export const credentialIdParamSchema = idSchema;

export type CreateCredentialPayload = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialPayload = z.infer<typeof updateCredentialSchema>;
