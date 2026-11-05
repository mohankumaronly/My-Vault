import argon2 from "argon2";
import { AppError } from "../../common/errors/AppError";
import { sessionService } from "../session/session.service";
import { vaultRepository } from "./vault.repository";
import type { SetupVaultInput, UpdateKeyEnvelopeInput, VaultMetadataDto } from "./vault.types";

export const vaultService = {
  async getMetadata(): Promise<VaultMetadataDto> {
    const vault = await vaultRepository.findFirst();
    if (!vault) {
      throw AppError.notFound("Vault has not been set up yet", "VAULT_NOT_FOUND");
    }
    return {
      kdfAlgorithm: vault.kdfAlgorithm,
      kdfParameters: {
        memoryKiB: vault.kdfMemoryKiB,
        iterations: vault.kdfIterations,
        parallelism: vault.kdfParallelism,
        outputLength: vault.kdfOutputLength,
      },
      salt: vault.salt,
      keyEncryptionAlgo: vault.keyEncryptionAlgo,
      wrappedVaultKey: vault.wrappedVaultKey,
      keyNonce: vault.keyNonce,
      encryptionVersion: vault.encryptionVersion,
    };
  },

  async setup(input: SetupVaultInput) {
    const existing = await vaultRepository.findFirst();
    if (existing) {
      throw AppError.conflict("A vault already exists on this server", "VAULT_EXISTS");
    }

    const authVerifierHash = await argon2.hash(input.authVerifier, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const vault = await vaultRepository.create({
      kdfAlgorithm: input.kdfAlgorithm,
      kdfMemoryKiB: input.kdfParameters.memoryKiB,
      kdfIterations: input.kdfParameters.iterations,
      kdfParallelism: input.kdfParameters.parallelism,
      kdfOutputLength: input.kdfParameters.outputLength,
      salt: input.salt,
      keyEncryptionAlgo: input.keyEncryptionAlgo,
      wrappedVaultKey: input.wrappedVaultKey,
      keyNonce: input.keyNonce,
      encryptionVersion: input.encryptionVersion,
      authVerifierHash,
    });

    const session = await sessionService.create(vault.id);
    return { vaultId: vault.id, session };
  },

  async unlock(authVerifier: string) {
    const vault = await vaultRepository.findFirst();
    if (!vault) {
      throw AppError.notFound("Vault has not been set up yet", "VAULT_NOT_FOUND");
    }

    const valid = await argon2.verify(vault.authVerifierHash, authVerifier).catch(() => false);
    if (!valid) {
      throw AppError.unauthorized("Invalid master key", "INVALID_MASTER_KEY");
    }

    const session = await sessionService.create(vault.id);
    return { vaultId: vault.id, session };
  },

  async updateEnvelope(vaultId: string, input: UpdateKeyEnvelopeInput) {
    const vault = await vaultRepository.findById(vaultId);
    if (!vault) throw AppError.notFound("Vault not found", "VAULT_NOT_FOUND");

    const authVerifierHash = await argon2.hash(input.authVerifier, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await vaultRepository.updateEnvelope(vaultId, {
      kdfMemoryKiB: input.kdfParameters.memoryKiB,
      kdfIterations: input.kdfParameters.iterations,
      kdfParallelism: input.kdfParameters.parallelism,
      kdfOutputLength: input.kdfParameters.outputLength,
      salt: input.salt,
      wrappedVaultKey: input.wrappedVaultKey,
      keyNonce: input.keyNonce,
      encryptionVersion: input.encryptionVersion,
      authVerifierHash,
    });

    return { vaultId };
  },
};
