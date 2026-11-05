import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { fail } from "../utils/response";
import { env } from "../../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json(fail(`Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    const message = err.issues
      .map((i) => `${i.path.join(".") || "body"}: ${i.message}`)
      .join("; ");
    res.status(422).json(fail(`Validation failed — ${message}`));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.message));
    return;
  }

  // Prisma known errors
  const prismaErr = err as { code?: string; name?: string };
  if (prismaErr?.code === "P2002") {
    res.status(409).json(fail("A record with this unique value already exists"));
    return;
  }
  if (prismaErr?.code === "P2025") {
    res.status(404).json(fail("Record not found"));
    return;
  }

  if (env.NODE_ENV === "development") {
    console.error("Unhandled error:", err);
  }

  res.status(500).json(fail("Internal server error"));
}
