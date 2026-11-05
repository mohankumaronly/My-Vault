import type { NextFunction, Request, Response } from "express";
import { env } from "../../config/env";

export function testApiKey(req: Request, _res: Response, next: NextFunction) {
  if (env.TEST_MODE !== "true") return next();

  const key = req.header("X-Test-API-Key");
  if (key && env.TEST_API_KEY && key === env.TEST_API_KEY) {
    (req as any).isTestRequest = true;
  }
  next();
}
