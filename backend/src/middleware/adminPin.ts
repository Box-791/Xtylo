import { Request, Response, NextFunction } from "express";

export function requireAdminPin(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_PIN;

  // If you didn't set ADMIN_PIN, don't lock yourself out in dev
  if (!expected) return next();

  const provided = req.header("x-admin-pin");

  if (!provided || provided !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}
