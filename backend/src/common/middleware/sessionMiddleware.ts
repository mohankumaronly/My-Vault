import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";
import { AppError } from "../errors/AppError";
import { sessionService } from "../../modules/session/session.service";

export interface SessionContext {
  sessionId: string;
  vaultId: string;
  csrfToken: string;
  expiresAt: Date;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      session?: SessionContext;
      isTestRequest?: boolean;
      sessionToken?: string;
    }
  }
}

/** Populates req.session from the session cookie. Does NOT reject anonymous requests. */
export async function attachSession(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[env.COOKIE_NAME];
    if (typeof token === "string" && token.length > 0) {
      const session = await sessionService.validate(token);
      if (session) {
        req.sessionToken = token;
        req.session = {
          sessionId: session.id,
          vaultId: session.vaultId,
          csrfToken: session.csrfToken,
          expiresAt: session.expiresAt,
        };
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires an active session; rejects otherwise with 401. */
export function requireSession(req: Request, _res: Response, next: NextFunction) {
  if (!req.session) {
    return next(AppError.unauthorized("Vault is locked. Please unlock with your master key.", "NO_SESSION"));
  }
  next();
}
