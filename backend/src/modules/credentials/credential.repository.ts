import { prisma } from "../../config/prisma";

export const credentialRepository = {
  list(vaultId: string) {
    return prisma.credential.findMany({
      where: { vaultId },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(vaultId: string, id: string) {
    return prisma.credential.findFirst({ where: { id, vaultId } });
  },

  create(data: {
    vaultId: string;
    ciphertext: string;
    nonce: string;
    encryptionVersion: number;
  }) {
    return prisma.credential.create({ data });
  },

  /** Atomic version check + update for optimistic concurrency. Returns null when stale. */
  async updateIfVersionMatches(
    vaultId: string,
    id: string,
    expectedVersion: number,
    data: { ciphertext: string; nonce: string; encryptionVersion: number }
  ) {
    const result = await prisma.credential.updateMany({
      where: { id, vaultId, recordVersion: expectedVersion },
      data: { ...data, recordVersion: { increment: 1 } },
    });
    if (result.count === 0) return null;
    return prisma.credential.findFirst({ where: { id, vaultId } });
  },

  delete(vaultId: string, id: string) {
    return prisma.credential.deleteMany({ where: { id, vaultId } });
  },
};
