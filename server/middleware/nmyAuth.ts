import { Request, Response, NextFunction } from 'express';
import { getNmyDb } from '../db/nmyDb';
import { NmyUser, NmySession, NmyUserRole } from '../types/nmyTypes';

export interface NmyAuthRequest extends Request {
  user?: NmyUser;
  session?: NmySession;
}

export async function nmyAuthMiddleware(
  req: NmyAuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (typeof req.query.token === 'string') {
      token = req.query.token.trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Tafadhali ingia kwenye akaunti yako kwanza.'
      });
    }

    const db = getNmyDb();
    const session = await db.getSessionByToken(token);
    if (!session) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'SESSION IMEISHA\n\nKwa usalama, session yako imeisha.\nTafadhali ingia tena.'
      });
    }

    if (session.isRevoked) {
      if (session.revokeReason === 'ANOTHER_DEVICE') {
        return res.status(401).json({
          success: false,
          code: 'SESSION_REVOKED_ANOTHER_DEVICE',
          message: 'SESSION IMESITISHWA\n\nAkaunti yako imeingia kwenye kifaa kingine.\nTafadhali ingia tena.'
        });
      }
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'SESSION IMEISHA\n\nKwa usalama, session yako imeisha.\nTafadhali ingia tena.'
      });
    }

    if (session.expiresAt <= new Date().toISOString()) {
      return res.status(401).json({
        success: false,
        code: 'SESSION_EXPIRED',
        message: 'SESSION IMEISHA\n\nKwa usalama, session yako imeisha.\nTafadhali ingia tena.'
      });
    }

    const user = await db.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Mtumiaji hakupatikana.'
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_SUSPENDED',
        message: 'Akaunti yako imesimamishwa. Wasiliana na Uongozi wa RAVINI.'
      });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (error: any) {
    console.error('[NMY Auth Middleware Error]:', error);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: 'Hitilafu ya uthibitishaji kwenye mfumo.'
    });
  }
}

export function requireNmyRole(...allowedRoles: NmyUserRole[]) {
  return (req: NmyAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Tafadhali ingia kwenye akaunti yako.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Huna mamlaka ya kufungua au kutumia huduma hii.'
      });
    }

    next();
  };
}

export function requireNmyPermission(requiredPermission: string) {
  return (req: NmyAuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Tafadhali ingia kwenye akaunti yako.'
      });
    }

    // Super Admin has all permissions
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    // Admin must have specific permission or 'ALL'
    if (
      req.user.permissions?.includes('ALL') ||
      req.user.permissions?.includes(requiredPermission)
    ) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN_PERMISSION',
      message: `Huna idhini ya kitengo hiki (${requiredPermission}).`
    });
  };
}
