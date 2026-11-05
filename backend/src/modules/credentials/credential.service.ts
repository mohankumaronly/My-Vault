import { AppError } from "../../common/errors/AppError";
import { credentialRepository } from "./credential.repository";
import type { CreateCredentialPayload, UpdateCredentialPayload } from "./credential.validation";

export interface CredentialDto {
  id: string;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  recordVersion: number;
  createdAt: string;
  updatedAt: string;
}

function toDto(record: {
  id: string;
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
  recordVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): CredentialDto {
  return {
    id: record.id,
    ciphertext: record.ciphertext,
    nonce: record.nonce,
    encryptionVersion: record.encryptionVersion,
    recordVersion: record.recordVersion,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export const credentialService = {
  async list(vaultId: string): Promise<CredentialDto[]> {
    const rows = await credentialRepository.list(vaultId);
    return rows.map(toDto);
  },

  async getById(vaultId: string, id: string): Promise<CredentialDto> {
    const row = await credentialRepository.findById(vaultId, id);
    if (!row) throw AppError.notFound("Credential not found", "CREDENTIAL_NOT_FOUND");
    return toDto(row);
  },

  async create(vaultId: string, input: CreateCredentialPayload): Promise<CredentialDto> {
    const row = await credentialRepository.create({
      vaultId,
      ciphertext: input.ciphertext,
      nonce: input.nonce,
      encryptionVersion: input.encryptionVersion,
    });
    return toDto(row);
  },

  async update(vaultId: string, id: string, input: UpdateCredentialPayload): Promise<CredentialDto> {
    const updated = await credentialRepository.updateIfVersionMatches(
      vaultId,
      id,
      input.expectedRecordVersion,
      {
        ciphertext: input.ciphertext,
        nonce: input.nonce,
        encryptionVersion: input.encryptionVersion,
      }
    );

    if (!updated) {
      const exists = await credentialRepository.findById(vaultId, id);
      if (!exists) throw AppError.notFound("Credential not found", "CREDENTIAL_NOT_FOUND");
      throw AppError.conflict(
        "This credential was modified by another session. Refresh and try again.",
        "STALE_RECORD"
      );
    }
    return toDto(updated);
  },

  async remove(vaultId: string, id: string): Promise<void> {
    const result = await credentialRepository.delete(vaultId, id);
    if (result.count === 0) {
      throw AppError.notFound("Credential not found", "CREDENTIAL_NOT_FOUND");
    }
  },
};
