import { Request } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from './auth.js';

export const logAudit = async (
  req: Request | AuthRequest,
  action: string,
  targetResource: string,
  resourceId: string = '',
  details: Record<string, any> = {}
): Promise<void> => {
  try {
    const performedBy = (req as AuthRequest).user?.name || (req as AuthRequest).user?.email || 'Anonymous/System';
    const ipAddress = req.ip || req.socket.remoteAddress || '';

    await AuditLog.create({
      action,
      performedBy,
      targetResource,
      resourceId,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

