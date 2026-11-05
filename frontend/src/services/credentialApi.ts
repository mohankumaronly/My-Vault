import { api } from "./api";
import type { CredentialRecord } from "../types";

export interface CreateCredentialRequest {
  ciphertext: string;
  nonce: string;
  encryptionVersion: number;
}

export interface UpdateCredentialRequest extends CreateCredentialRequest {
  expectedRecordVersion: number;
}

export const credentialApi = {
  list() {
    return api.raw<CredentialRecord[]>("/credentials");
  },

  get(id: string) {
    return api.raw<CredentialRecord>(`/credentials/${id}`);
  },

  create(payload: CreateCredentialRequest) {
    return api.raw<CredentialRecord>("/credentials", { method: "POST", body: payload, csrf: true });
  },

  update(id: string, payload: UpdateCredentialRequest) {
    return api.raw<CredentialRecord>(`/credentials/${id}`, {
      method: "PUT",
      body: payload,
      csrf: true,
    });
  },

  remove(id: string) {
    return api.raw<null>(`/credentials/${id}`, { method: "DELETE", csrf: true });
  },
};
