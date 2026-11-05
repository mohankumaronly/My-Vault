import { Router } from "express";
import { requireSession } from "../../common/middleware/sessionMiddleware";
import { vaultSetupLimiter, vaultUnlockLimiter } from "../../common/middleware/rateLimit";
import { validateRequest } from "../../common/middleware/validateRequest";
import { vaultController } from "./vault.controller";
import { setupVaultSchema, unlockVaultSchema, updateKeyEnvelopeSchema } from "./vault.validation";

const router = Router();

router.get("/metadata", vaultController.getMetadata);
router.post("/setup", vaultSetupLimiter, validateRequest({ body: setupVaultSchema }), vaultController.setup);
router.post("/unlock", vaultUnlockLimiter, validateRequest({ body: unlockVaultSchema }), vaultController.unlock);
router.post("/lock", requireSession, vaultController.lock);
router.put(
  "/key-envelope",
  requireSession,
  validateRequest({ body: updateKeyEnvelopeSchema }),
  vaultController.updateKeyEnvelope
);

export default router;
