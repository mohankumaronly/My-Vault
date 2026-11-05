import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validateRequest(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.params) req.params = schemas.params.parse(req.params) as any;
      if (schemas.query) req.query = schemas.query.parse(req.query) as any;
      next();
    } catch (err) {
      next(err);
    }
  };
}
