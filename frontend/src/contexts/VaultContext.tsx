import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_KDF_PARAMS, deriveMasterKey } from "../crypto/argon2";
import { generateSalt } from "../crypto/aes";
import { base64ToBytes, bytesToBase64 } from "../crypto/encoding";
import {
  dekToCryptoKey,
  decryptCredential,
  encryptCredential,
  unwrapDek,
  wrapDek,
  type PlainCredential,
} from "../crypto/vaultKey";
import { credentialApi } from "../services/credentialApi";
import { setCsrfToken } from "../services/api";
import { vaultApi } from "../services/vaultApi";
import type { VaultCredential } from "../types";

const AUTO_LOCK_MS = 3 * 60 * 1000; // 3 minutes inactivity
const MAX_SESSION_MS = 5 * 60 * 1000; // 5 minutes hard cap

interface VaultContextValue {
  status: "checking" | "setup" | "locked" | "unlocked";
  vaultId: string | null;
  credentials: VaultCredential[];
  loadingCredentials: boolean;
  error: string | null;
  unlockExpiresAt: number | null;

  refreshStatus: () => Promise<void>;
  setupVault: (masterKey: string) => Promise<void>;
  unlockVault: (masterKey: string) => Promise<void>;
  lockVault: () => Promise<void>;

  addCredential: (input: PlainCredential) => Promise<void>;
  updateCredential: (id: string, input: PlainCredential) => Promise<void>;
  deleteCredential: (id: string) => Promise<void>;
  reloadCredentials: () => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

interface SessionState {
  dekKey: CryptoKey;
  saltB64: string;
  encryptionVersion: number;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<VaultContextValue["status"]>("checking");
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<VaultCredential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlockExpiresAt, setUnlockExpiresAt] = useState<number | null>(null);

  const sessionRef = useRef<SessionState | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const hardCapRef = useRef<number | null>(null);

  const clearSession = useCallback(() => {
    sessionRef.current = null;
    hardCapRef.current = null;
    setVaultId(null);
    setCredentials([]);
    setUnlockExpiresAt(null);
    setCsrfToken(null);
  }, []);

  const refreshStatus = useCallback(async () => {
    setError(null);
    try {
      const metadata = await vaultApi.getMetadata();
      setStatus(metadata ? "locked" : "setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check vault status");
      setStatus("locked");
    }
  }, []);

  const decryptAll = useCallback(async (vaultIdValue: string, dekKey: CryptoKey) => {
    setLoadingCredentials(true);
    try {
      const records = await credentialApi.list();
      const decrypted = await Promise.all(
        records.map(async (r) => {
          try {
            const plain = await decryptCredential(
              dekKey,
              vaultIdValue,
              r.id,
              r.ciphertext,
              r.nonce,
              r.encryptionVersion
            );
            return {
              id: r.id,
              recordVersion: r.recordVersion,
              encryptionVersion: r.encryptionVersion,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
              ...plain,
            } as VaultCredential;
          } catch {
            return null;
          }
        })
      );
      setCredentials(decrypted.filter((c): c is VaultCredential => c !== null));
    } finally {
      setLoadingCredentials(false);
    }
  }, []);

  const finalizeUnlock = useCallback(
    async (
      vaultIdValue: string,
      dek: Uint8Array,
      saltB64: string,
      encryptionVersion: number,
      csrfToken: string,
      expiresAtIso: string
    ) => {
      const key = await dekToCryptoKey(dek);
      sessionRef.current = { dekKey: key, saltB64, encryptionVersion };
      lastActivityRef.current = Date.now();
      hardCapRef.current = Date.now() + MAX_SESSION_MS;
      const serverExpiry = new Date(expiresAtIso).getTime();
      const localExpiry = Math.min(hardCapRef.current, serverExpiry || hardCapRef.current);
      setUnlockExpiresAt(localExpiry);
      setVaultId(vaultIdValue);
      setCsrfToken(csrfToken);
      setStatus("unlocked");
      await decryptAll(vaultIdValue, key);
    },
    [decryptAll]
  );

  const setupVault = useCallback(
    async (masterKey: string) => {
      setError(null);
      const salt = generateSalt();
      const saltB64 = bytesToBase64(salt);
      const { kek, authVerifier } = await deriveMasterKey(masterKey, salt, DEFAULT_KDF_PARAMS);
      const { dek, wrapped } = await wrapDek(kek, saltB64, 1);

      const session = await vaultApi.setup({
        kdfAlgorithm: "ARGON2ID",
        kdfParameters: DEFAULT_KDF_PARAMS,
        salt: saltB64,
        keyEncryptionAlgo: "AES-256-GCM",
        wrappedVaultKey: wrapped.wrappedVaultKey,
        keyNonce: wrapped.keyNonce,
        authVerifier: bytesToBase64(authVerifier),
        encryptionVersion: 1,
      });

      await finalizeUnlock(
        session.vaultId,
        dek,
        saltB64,
        1,
        session.csrfToken,
        session.expiresAt
      );
    },
    [finalizeUnlock]
  );

  const unlockVault = useCallback(
    async (masterKey: string) => {
      setError(null);
      const metadata = await vaultApi.getMetadata();
      if (!metadata) throw new Error("Vault has not been set up yet");

      const salt = base64ToBytes(metadata.salt);
      const { kek, authVerifier } = await deriveMasterKey(masterKey, salt, metadata.kdfParameters);

      // Unwrap DEK locally first — a wrong master key fails here without a network call.
      let dek: Uint8Array;
      try {
        dek = await unwrapDek(
          kek,
          metadata.salt,
          { wrappedVaultKey: metadata.wrappedVaultKey, keyNonce: metadata.keyNonce },
          metadata.encryptionVersion
        );
      } catch {
        throw new Error("Incorrect master key. The vault could not be unlocked.");
      }

      const session = await vaultApi.unlock(bytesToBase64(authVerifier));
      await finalizeUnlock(
        session.vaultId,
        dek,
        metadata.salt,
        metadata.encryptionVersion,
        session.csrfToken,
        session.expiresAt
      );
    },
    [finalizeUnlock]
  );

  const lockVault = useCallback(async () => {
    try {
      if (vaultId) await vaultApi.lock();
    } catch {
      // Best-effort.
    }
    clearSession();
    setStatus("locked");
  }, [vaultId, clearSession]);

  const reloadCredentials = useCallback(async () => {
    const session = sessionRef.current;
    if (!vaultId || !session) return;
    await decryptAll(vaultId, session.dekKey);
  }, [vaultId, decryptAll]);

  const addCredential = useCallback(
    async (input: PlainCredential) => {
      const session = sessionRef.current;
      if (!vaultId || !session) throw new Error("Vault is locked");
      const enc = await encryptCredential(session.dekKey, vaultId, "pending", input, 1);
      const record = await credentialApi.create({
        ciphertext: enc.ciphertext,
        nonce: enc.nonce,
        encryptionVersion: 1,
      });
      // Re-encrypt with the real record id so AAD binding matches future reads.
      const finalEnc = await encryptCredential(session.dekKey, vaultId, record.id, input, 1);
      await credentialApi.update(record.id, {
        ciphertext: finalEnc.ciphertext,
        nonce: finalEnc.nonce,
        encryptionVersion: 1,
        expectedRecordVersion: record.recordVersion,
      });
      await reloadCredentials();
    },
    [vaultId, reloadCredentials]
  );

  const updateCredential = useCallback(
    async (id: string, input: PlainCredential) => {
      const session = sessionRef.current;
      if (!vaultId || !session) throw new Error("Vault is locked");
      const existing = credentials.find((c) => c.id === id);
      if (!existing) throw new Error("Credential not found");
      const enc = await encryptCredential(
        session.dekKey,
        vaultId,
        id,
        input,
        existing.encryptionVersion
      );
      await credentialApi.update(id, {
        ciphertext: enc.ciphertext,
        nonce: enc.nonce,
        encryptionVersion: existing.encryptionVersion,
        expectedRecordVersion: existing.recordVersion,
      });
      await reloadCredentials();
    },
    [vaultId, credentials, reloadCredentials]
  );

  const deleteCredential = useCallback(
    async (id: string) => {
      if (!vaultId) throw new Error("Vault is locked");
      await credentialApi.remove(id);
      setCredentials((prev) => prev.filter((c) => c.id !== id));
    },
    [vaultId]
  );

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (status !== "unlocked") return;
    const bump = () => {
      lastActivityRef.current = Date.now();
    };
    const events = ["mousemove", "keydown", "click", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, bump));
  }, [status]);

  useEffect(() => {
    if (status !== "unlocked") return;
    const interval = setInterval(() => {
      const now = Date.now();
      const inactive = now - lastActivityRef.current > AUTO_LOCK_MS;
      const capped = hardCapRef.current !== null && now > hardCapRef.current;
      if (inactive || capped) void lockVault();
    }, 5000);
    return () => clearInterval(interval);
  }, [status, lockVault]);

  const value = useMemo<VaultContextValue>(
    () => ({
      status,
      vaultId,
      credentials,
      loadingCredentials,
      error,
      unlockExpiresAt,
      refreshStatus,
      setupVault,
      unlockVault,
      lockVault,
      addCredential,
      updateCredential,
      deleteCredential,
      reloadCredentials,
    }),
    [
      status,
      vaultId,
      credentials,
      loadingCredentials,
      error,
      unlockExpiresAt,
      refreshStatus,
      setupVault,
      unlockVault,
      lockVault,
      addCredential,
      updateCredential,
      deleteCredential,
      reloadCredentials,
    ]
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
