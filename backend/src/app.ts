import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { testApiKey } from "./common/middleware/testApiKey";
import { attachSession } from "./common/middleware/sessionMiddleware";
import { csrfProtection } from "./common/middleware/csrfProtection";
import { generalLimiter } from "./common/middleware/rateLimit";
import { errorHandler, notFoundHandler } from "./common/middleware/errorHandler";
import { ok } from "./common/utils/response";
import vaultRoutes from "./modules/vault/vault.routes";
import credentialRoutes from "./modules/credentials/credential.routes";

const allowedOrigins = [env.CLIENT_ORIGIN];

export function createApp() {
  const app = express();

  // Trust proxy (needed for rate-limiting behind Docker/Nginx).
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Test-API-Key"],
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Global test API key detection MUST come before rate-limit + CSRF checks.
  app.use(testApiKey);

  const api = express.Router();
  api.use(generalLimiter);

  // Public endpoints
  api.get("/health", (_req, res) => res.status(200).json(ok({ status: "ok", uptime: process.uptime() })));

  // Session-aware middleware for all API routes.
  api.use(attachSession);
  api.use(csrfProtection);

  // CSRF token retrieval for the current session.
  api.get("/csrf", (req, res) => {
    if (!req.session) {
      res.status(401).json({ success: false, message: "No active session" });
      return;
    }
    res.status(200).json(ok({ csrfToken: req.session.csrfToken }));
  });

  api.use("/vault", vaultRoutes);
  api.use("/credentials", credentialRoutes);

  app.use("/api/v1", api);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
