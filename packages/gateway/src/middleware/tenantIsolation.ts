import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export function enforceTenantIsolation(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user?.tenantId) {
    res.status(403).json({ error: "Tenant context required" });
    return;
  }

  // Inject tenantId into query params for all downstream operations
  req.query.tenantId = req.user.tenantId;

  // For POST/PUT/PATCH, inject tenantId into body
  if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
    req.body.tenantId = req.user.tenantId;
  }

  next();
}
