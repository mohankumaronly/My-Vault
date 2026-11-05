import { prisma } from "../../config/prisma";

export const sessionRepository = {
  create(data: {
    vaultId: string;
    tokenHash: string;
    csrfToken: string;
    expiresAt: Date;
  }) {
    return prisma.session.create({ data });
  },

  findByTokenHash(tokenHash: string) {
    return prisma.session.findUnique({ where: { tokenHash } });
  },

  deleteByTokenHash(tokenHash: string) {
    return prisma.session.deleteMany({ where: { tokenHash } });
  },

  deleteById(id: string) {
    return prisma.session.delete({ where: { id } });
  },

  deleteExpired() {
    return prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  },

  deleteAllForVault(vaultId: string) {
    return prisma.session.deleteMany({ where: { vaultId } });
  },
};
