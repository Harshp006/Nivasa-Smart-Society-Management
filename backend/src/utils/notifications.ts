import prisma from '../config/prisma';
import { NotificationType } from '@prisma/client';

interface NotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: NotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityId: params.entityId,
        entityType: params.entityType,
        metadata: params.metadata as any,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function createNotificationsForAll(
  userIds: string[],
  params: Omit<NotificationParams, 'userId'>
): Promise<void> {
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityId: params.entityId,
        entityType: params.entityType,
        metadata: params.metadata as any,
      })),
    });
  } catch (error) {
    console.error('Failed to create notifications:', error);
  }
}
