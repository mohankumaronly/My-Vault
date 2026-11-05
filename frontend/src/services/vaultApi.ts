import { api } from "./api";
import type { SessionResponse, VaultMetadata } from "../types";

export interface SetupVaultRequest {
  kdfAlgorithm: "ARGON2ID";
  kdfParameters: {
    memoryKiB: number;
    iterations: number;
    parallelism: number;
    outputLength: number;
  };
  salt: string;
  keyEncryptionAlgo: "AES-256-GCM";
  wrappedVaultKey: string;
  keyNonce: string;
  authVerifier: string;
  encryptionVersion: number;
}

export interface UpdateKeyEnvelopeRequest {
  kdfAlgorithm: "ARGON2ID";
  kdfParameters: {
    memoryKiB: number;
    iterations: number;
    parallelism: number;
    outputLength: number;
  };
  salt: string;
  wrappedVaultKey: string;
  keyNonce: string;
  authVerifier: string;
  encryptionVersion: number;
}

export const vaultApi = {
  async getMetadata(): Promise<VaultMetadata | null> {
    try {
      return await api.raw<VaultMetadata>("/vault/metadata");
    } catch (err) {
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  },

  setup(payload: SetupVaultRequest) {
    return api.raw<SessionResponse>("/vault/setup", { method: "POST", body: payload });
  },

  unlock(authVerifier: string) {
    return api.raw<SessionResponse>("/vault/unlock", { method: "POST", body: { authVerifier } });
  },

  lock() {
    return api.raw<null>("/vault/lock", { method: "POST", csrf: true });
  },

  updateKeyEnvelope(payload: UpdateKeyEnvelopeRequest) {
    return api.raw<{ vaultId: string }>("/vault/key-envelope", {
      method: "PUT",
      body: payload,
      csrf: true,
    });
  },

  getCsrfToken() {
    return api.raw<{ csrfToken: string }>("/csrf");
  },
};
