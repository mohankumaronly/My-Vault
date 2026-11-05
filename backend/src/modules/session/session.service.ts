import { randomToken, sha256 } from "../../common/utils/crypto";
import { env } from "../../config/env";
import { sessionRepository } from "./session.repository";

const SESSION_MS = env.SESSION_DURATION_MINUTES * 60 * 1000;

export interface CreatedSession {
  sessionId: string;
  token: string;
  csrfToken: string;
  expiresAt: Date;
}

export const sessionService = {
  async create(vaultId: string): Promise<CreatedSession> {
    const token = randomToken(48);
    const csrfToken = randomToken(32);
    const expiresAt = new Date(Date.now() + SESSION_MS);
    const session = await sessionRepository.create({
      vaultId,
      tokenHash: sha256(token),
      csrfToken,
      expiresAt,
    });
    return { sessionId: session.id, token, csrfToken, expiresAt };
  },

  async validate(token: string) {
    if (!token) return null;
    const session = await sessionRepository.findByTokenHash(sha256(token));
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) {
      await sessionRepository.deleteById(session.id).catch(() => undefined);
      return null;
    }
    return session;
  },

  async destroy(token: string) {
    if (!token) return;
    await sessionRepository.deleteByTokenHash(sha256(token));
  },

  async destroyAllForVault(vaultId: string) {
    await sessionRepository.deleteAllForVault(vaultId);
  },

  async cleanupExpired() {
    await sessionRepository.deleteExpired();
  },
};
