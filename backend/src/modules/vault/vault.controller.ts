import type { Request, Response } from "express";
import { clearSessionCookie, setSessionCookie } from "../../common/utils/cookies";
import { created, ok } from "../../common/utils/response";
import { auditService } from "../audit/audit.service";
import { sessionService } from "../session/session.service";
import { vaultService } from "./vault.service";
import type { UpdateKeyEnvelopePayload } from "./vault.validation";

export const vaultController = {
  async getMetadata(_req: Request, res: Response) {
    const metadata = await vaultService.getMetadata();
    res.status(200).json(ok(metadata));
  },

  async setup(req: Request, res: Response) {
    const { vaultId, session } = await vaultService.setup(req.body);
    setSessionCookie(res, session.token, session.expiresAt);
    await auditService.log("vault.setup", { vaultId, req });
    res.status(201).json(
      created({
        vaultId,
        csrfToken: session.csrfToken,
        expiresAt: session.expiresAt.toISOString(),
      }, "Vault created")
    );
  },

  async unlock(req: Request, res: Response) {
    const { vaultId, session } = await vaultService.unlock(req.body.authVerifier);
    setSessionCookie(res, session.token, session.expiresAt);
    await auditService.log("vault.unlock", { vaultId, req });
    res.status(200).json(
      ok(
        {
          vaultId,
          csrfToken: session.csrfToken,
          expiresAt: session.expiresAt.toISOString(),
        },
        "Vault unlocked"
      )
    );
  },

  async lock(req: Request, res: Response) {
    const vaultId = req.session?.vaultId;
    if (req.sessionToken) {
      await sessionService.destroy(req.sessionToken);
    }
    clearSessionCookie(res);
    if (vaultId) await auditService.log("vault.lock", { vaultId, req });
    res.status(200).json(ok(null, "Vault locked"));
  },

  async updateKeyEnvelope(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const result = await vaultService.updateEnvelope(vaultId, req.body as UpdateKeyEnvelopePayload);
    await auditService.log("vault.key_envelope_updated", { vaultId, req });
    res.status(200).json(ok(result, "Key envelope updated"));
  },
};
