import { prisma } from "../../config/prisma";

export const vaultRepository = {
  findFirst() {
    return prisma.vault.findFirst();
  },

  findById(id: string) {
    return prisma.vault.findUnique({ where: { id } });
  },

  create(data: {
    kdfAlgorithm: string;
    kdfMemoryKiB: number;
    kdfIterations: number;
    kdfParallelism: number;
    kdfOutputLength: number;
    salt: string;
    keyEncryptionAlgo: string;
    wrappedVaultKey: string;
    keyNonce: string;
    encryptionVersion: number;
    authVerifierHash: string;
  }) {
    return prisma.vault.create({ data });
  },

  updateEnvelope(
    id: string,
    data: {
      kdfMemoryKiB: number;
      kdfIterations: number;
      kdfParallelism: number;
      kdfOutputLength: number;
      salt: string;
      wrappedVaultKey: string;
      keyNonce: string;
      encryptionVersion: number;
      authVerifierHash: string;
    }
  ) {
    return prisma.vault.update({ where: { id }, data });
  },
};
