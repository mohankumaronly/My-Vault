import type { Request } from "express";
import { prisma } from "../../config/prisma";

export const auditService = {
  async log(
    action: string,
    opts: {
      vaultId?: string | null;
      metadata?: Record<string, unknown>;
      req?: Request;
    } = {}
  ) {
    try {
      const ip =
        opts.req?.ip ?? opts.req?.socket?.remoteAddress ?? null;
      await prisma.auditLog.create({
        data: {
          action,
          vaultId: opts.vaultId ?? null,
          metadata: opts.metadata ? (opts.metadata as object) : undefined,
          ip,
        },
      });
    } catch (err) {
      // Auditing must never break the request flow.
      console.error("Audit log failed:", err);
    }
  },
};
