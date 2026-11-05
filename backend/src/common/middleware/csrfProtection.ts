import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { safeEqual } from "../utils/crypto";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfProtection(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (req.isTestRequest) return next(); // TEST_MODE + valid X-Test-API-Key bypass

  if (!req.session) return next(); // unauthenticated routes handle their own auth

  const header = req.header("X-CSRF-Token");
  if (!header || !safeEqual(header, req.session.csrfToken)) {
    return next(AppError.forbidden("Invalid or missing CSRF token", "CSRF_FAILED"));
  }
  next();
}
