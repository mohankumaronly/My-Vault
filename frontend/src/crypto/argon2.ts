import { argon2id } from "hash-wasm";
import { utf8ToBytes } from "./encoding";

export interface KdfParameters {
  memoryKiB: number;
  iterations: number;
  parallelism: number;
  outputLength: number;
}

export const DEFAULT_KDF_PARAMS: KdfParameters = {
  memoryKiB: 65536,
  iterations: 3,
  parallelism: 4,
  outputLength: 64,
};

/**
 * Derive 64 bytes from the master key using Argon2id (client-side WASM).
 * bytes[0..31]  → KEK (wraps the DEK)
 * bytes[32..63] → auth verifier (sent to server)
 */
export async function deriveMasterKey(
  masterKey: string,
  salt: Uint8Array,
  params: KdfParameters = DEFAULT_KDF_PARAMS
): Promise<{ kek: Uint8Array; authVerifier: Uint8Array }> {
  const derived = await argon2id({
    password: utf8ToBytes(masterKey),
    salt,
    parallelism: params.parallelism,
    iterations: params.iterations,
    memorySize: params.memoryKiB,
    hashLength: params.outputLength,
    outputType: "binary",
  });

  const bytes = derived instanceof Uint8Array ? derived : new Uint8Array(derived);
  if (bytes.length !== params.outputLength) {
    throw new Error("Unexpected Argon2 output length");
  }

  return {
    kek: bytes.slice(0, 32),
    authVerifier: bytes.slice(32, 64),
  };
}
