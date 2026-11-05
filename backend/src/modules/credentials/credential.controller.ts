import type { Request, Response } from "express";
import { created, ok } from "../../common/utils/response";
import { auditService } from "../audit/audit.service";
import { credentialService } from "./credential.service";

export const credentialController = {
  async list(req: Request, res: Response) {
    const items = await credentialService.list(req.session!.vaultId);
    res.status(200).json(ok(items));
  },

  async getById(req: Request, res: Response) {
    const item = await credentialService.getById(req.session!.vaultId, req.params.id as string);
    res.status(200).json(ok(item));
  },

  async create(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const item = await credentialService.create(vaultId, req.body);
    await auditService.log("credential.created", { vaultId, metadata: { id: item.id }, req });
    res.status(201).json(created(item, "Credential created"));
  },

  async update(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const id = req.params.id as string;
    const item = await credentialService.update(vaultId, id, req.body);
    await auditService.log("credential.updated", { vaultId, metadata: { id }, req });
    res.status(200).json(ok(item, "Credential updated"));
  },

  async remove(req: Request, res: Response) {
    const vaultId = req.session!.vaultId;
    const id = req.params.id as string;
    await credentialService.remove(vaultId, id);
    await auditService.log("credential.deleted", { vaultId, metadata: { id }, req });
    res.status(200).json(ok(null, "Credential deleted"));
  },
};
