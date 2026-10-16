import prisma from '../config/prisma';
import { AuditAction } from '@prisma/client';

interface AuditLogParams {
  actorId?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  } catch (error) {
    // Audit log failures should not break the main operation
    console.error('Failed to create audit log:', error);
  }
}
