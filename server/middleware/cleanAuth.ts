import { Request, Response, NextFunction } from 'express';
import { getCleanDb } from '../db/cleanDb';
import { CleanUser, UserRole, AdminPermission } from '../types/raviniTypes';

export interface CleanAuthRequest extends Request {
  user?: CleanUser;
}

export async function cleanAuthMiddleware(req: CleanAuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let userId = req.headers['x-user-id'] as string;

    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parts = token.split(':');
      userId = parts[0];
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Hujaingia kwenye mfumo. Tafadhali ingia upya.'
      });
    }

    const db = getCleanDb();
    await db.initialize();
    const user = await db.getUserById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Akaunti haikupatikana au imefutwa.'
      });
    }

    if (user.status === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Akaunti yako imezuiwa (Blocked) na Msimamizi Mkuu.'
      });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Akaunti yako imesimamishwa kwa muda.'
      });
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Hitilafu ya uthibitisho wa mtumiaji.' });
  }
}

/**
 * Enforces strict role access.
 * If user does not have one of allowed roles, returns 403 Forbidden.
 */
export function requireCleanRole(...allowedRoles: UserRole[]) {
  return (req: CleanAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Hujaingia kwenye mfumo.' });
    }

    const role = req.user.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Ruksa imezuiliwa: Huna mamlaka ya kutumia sehemu hii (${role}).`,
        requiredRoles: allowedRoles,
        userRole: role
      });
    }

    next();
  };
}

/**
 * Enforces specific admin permissions for ADMIN role.
 * Note: SUPER_ADMIN bypasses specific permission checks while remaining SUPER_ADMIN.
 */
export function requireCleanPermission(permission: AdminPermission) {
  return (req: CleanAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Hujaingia kwenye mfumo.' });
    }

    if (req.user.role === 'SUPER_ADMIN') {
      return next(); // Super Admin always authorized
    }

    if (req.user.role === 'ADMIN') {
      const userPerms = req.user.permissions || [];
      if (userPerms.includes(permission)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Ruksa imezuiliwa: Huna idhini ya '${permission}'.`
      });
    }

    return res.status(403).json({
      success: false,
      message: 'Ruksa imezuiliwa: Eneo hili ni la wasimamizi pekee.'
    });
  };
}
