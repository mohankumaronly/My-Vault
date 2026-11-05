import type { Request } from "express";
import rateLimit from "express-rate-limit";

const isTest = (req: Request) => Boolean((req as any).isTestRequest);

export const vaultSetupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: isTest,
  message: { success: false, message: "Too many setup attempts. Try again later." },
});

export const vaultUnlockLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: isTest,
  message: { success: false, message: "Too many unlock attempts. Try again later." },
});

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: isTest,
  message: { success: false, message: "Too many requests." },
});
