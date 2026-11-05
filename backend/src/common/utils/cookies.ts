import type { CookieOptions, Response } from "express";
import { env } from "../../config/env";

function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE === "none" ? "none" : env.COOKIE_SAME_SITE,
    path: "/",
  };
}

export function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(env.COOKIE_NAME, token, { ...baseOptions(), expires: expiresAt });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(env.COOKIE_NAME, baseOptions());
}
