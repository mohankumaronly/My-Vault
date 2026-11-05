import { Router } from "express";
import { requireSession } from "../../common/middleware/sessionMiddleware";
import { validateRequest } from "../../common/middleware/validateRequest";
import { credentialController } from "./credential.controller";
import {
  createCredentialSchema,
  credentialIdParamSchema,
  updateCredentialSchema,
} from "./credential.validation";

const router = Router();

router.use(requireSession);

router.get("/", credentialController.list);
router.post("/", validateRequest({ body: createCredentialSchema }), credentialController.create);
router.get(
  "/:id",
  validateRequest({ params: credentialIdParamSchema }),
  credentialController.getById
);
router.put(
  "/:id",
  validateRequest({ params: credentialIdParamSchema, body: updateCredentialSchema }),
  credentialController.update
);
router.delete(
  "/:id",
  validateRequest({ params: credentialIdParamSchema }),
  credentialController.remove
);

export default router;
