import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';

// Role hierarchy mirrors the frontend:
//   CEO > HR > DEPT HEAD > Team Lead > team member
//
// These strings are stored verbatim in team_members.role, so the value in the
// database and the label shown in the UI are the same thing — there is no
// separate display-name mapping to keep in sync.
export type Role = 'CEO' | 'HR' | 'DEPT HEAD' | 'Team Lead' | 'team member';

const RANK: Record<string, number> = {
  CEO: 4,
  HR: 3,
  'DEPT HEAD': 2,
  'Team Lead': 1,
  'team member': 0,
};

/** Require the caller's role to be at least `minRole`. Assumes requireAuth ran first. */
export function requireRole(minRole: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) return next(ApiError.unauthorized());
    if ((RANK[role] ?? -1) < RANK[minRole]) {
      return next(ApiError.forbidden('You do not have permission to perform this action'));
    }
    next();
  };
}
