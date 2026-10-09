import { Request, Response, NextFunction } from 'express';
import { getDataStore } from '../db/fileDataStore';
import { User, UserRole } from '../../src/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    let userId = req.headers['x-user-id'] as string;

    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Format can be userId or userId:sessionToken
      const parts = token.split(':');
      userId = parts[0];
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Hujaingia kwenye mfumo (Missing Authentication).'
      });
    }

    const dataStore = getDataStore();
    const user = await dataStore.getUserById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Mtumiaji hakupatikana au akaunti haipo.'
      });
    }

    if (user.isDisabled || user.accountStatus === 'BLOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Akaunti yako imezuiwa (Blocked) na Msimamizi Mkuu.'
      });
    }

    if (user.isSuspended || user.accountStatus === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: `Akaunti imesimamishwa (Suspended): ${user.suspensionDetails?.reason || 'Ukiukwaji wa miongozo ya RAVINI'}`
      });
    }

    if (user.accountStatus === 'DEACTIVATED') {
      return res.status(403).json({
        success: false,
        message: 'Akaunti hii imesitishwa (Deactivated). Wasiliana na Huduma kwa Wateja kuifungua tena.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, message: 'Hitilafu ya uthibitishaji wa akaunti.' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Hujaingia kwenye mfumo.' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    if (userRole === 'super_admin' || userRole === 'manager') {
      return next(); // Manager / Super Admin has supreme system authority
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Huna idhini ya kutumia sehemu hii (Insufficient role privileges).'
      });
    }

    next();
  };
}

export function requirePermission(permissionId: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Hujaingia kwenye mfumo.' });
    }

    const userRole = (req.user.role || '').toLowerCase();
    if (userRole === 'super_admin' || userRole === 'manager') {
      return next(); // Manager / Super Admin has supreme authority
    }

    // Only authorized roles (admin, employee) can use admin permissions
    if (userRole !== 'admin' && userRole !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'Watumiaji wa kawaida hawaruhusiwi kutumia vitendo vya kiutawala.'
      });
    }

    const userPerms = (req.user.permissions || []).map(p => p.toLowerCase());
    const permTarget = permissionId.toLowerCase();

    // Note: Admins without explicit permissions do NOT have access.
    // 'all' is strictly reserved for Super Admin or explicitly delegated root admin
    const userHasPerm = (target: string): boolean => {
      if (userPerms.includes('all') || userPerms.includes(target)) return true;
      if (['manage_users', 'user_manage', 'view_users'].includes(target)) {
        return userPerms.some(p => ['manage_users', 'user_manage', 'view_users', 'all'].includes(p));
      }
      if (['post_moderation_manage', 'moderate_posts'].includes(target)) {
        return userPerms.some(p => ['post_moderation_manage', 'moderate_posts', 'all'].includes(p));
      }
      if (['verify_rvc', 'rvc_manage', 'wallet_manage'].includes(target)) {
        return userPerms.some(p => ['verify_rvc', 'rvc_manage', 'wallet_manage', 'all'].includes(p));
      }
      return false;
    };

    if (userHasPerm(permTarget)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Huna ruhusa ya kiutawala ya '${permissionId}' kufanya operesheni hii.`
    });
  };
}
