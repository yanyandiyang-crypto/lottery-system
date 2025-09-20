const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class NotificationService {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;
    console.log('🔔 Notification Service initialized');
  }

  async createNotification(userId, title, message, type, relatedTicketId = null, relatedDrawId = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          notificationType: type,
          relatedTicketId,
          relatedDrawId
        }
      });

      // Send real-time notification
      if (this.io) {
        this.io.to(`user-${userId}`).emit('notification', {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.notificationType,
          createdAt: notification.createdAt
        });
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  async notifyWinningTicket(ticketId, drawId, agentId, coordinatorId, betDigits, winningPrize, drawTime) {
    try {
      // Notify agent
      await this.createNotification(
        agentId,
        '🎉 Congratulations! You Won!',
        `Your ticket with number ${betDigits} won ₱${winningPrize} in the ${drawTime} draw!`,
        'winning',
        ticketId,
        drawId
      );

      // Notify coordinator if exists
      if (coordinatorId) {
        await this.createNotification(
          coordinatorId,
          '🎊 Agent Won!',
          `Your agent won ₱${winningPrize} with number ${betDigits} in the ${drawTime} draw!`,
          'winning',
          ticketId,
          drawId
        );
      }

      // Notify admins and superadmins
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['admin', 'superadmin'] }
        },
        select: { id: true }
      });

      for (const admin of admins) {
        await this.createNotification(
          admin.id,
          '🏆 New Winner!',
          `Agent won ₱${winningPrize} with number ${betDigits} in the ${drawTime} draw!`,
          'winning',
          ticketId,
          drawId
        );
      }

    } catch (error) {
      console.error('Error notifying winning ticket:', error);
    }
  }

  async notifyDrawResult(drawId, winningNumber, totalWinners, totalPrize) {
    try {
      const draw = await prisma.draw.findUnique({
        where: { id: drawId },
        select: { drawDate: true, drawTime: true }
      });

      if (!draw) return;

      // Notify all users about draw result
      const users = await prisma.user.findMany({
        where: {
          status: 'active'
        },
        select: { id: true }
      });

      for (const user of users) {
        await this.createNotification(
          user.id,
          '🎲 Draw Result',
          `The ${draw.drawTime} draw result is ${winningNumber}. ${totalWinners} winners with total prize of ₱${totalPrize}`,
          'system',
          null,
          drawId
        );
      }

    } catch (error) {
      console.error('Error notifying draw result:', error);
    }
  }

  async notifyLowBalance(userId, currentBalance, threshold = 100) {
    try {
      if (currentBalance <= threshold) {
        await this.createNotification(
          userId,
          '⚠️ Low Balance Alert',
          `Your balance is ₱${currentBalance}. Please load credits to continue betting.`,
          'balance'
        );
      }
    } catch (error) {
      console.error('Error notifying low balance:', error);
    }
  }

  async notifyBetLimitReached(drawId, betType, betDigits, limitAmount) {
    try {
      const draw = await prisma.draw.findUnique({
        where: { id: drawId },
        select: { drawTime: true }
      });

      if (!draw) return;

      // Notify all agents about sold out number
      const agents = await prisma.user.findMany({
        where: {
          role: 'agent',
          status: 'active'
        },
        select: { id: true }
      });

      for (const agent of agents) {
        await this.createNotification(
          agent.id,
          '🚫 Number Sold Out',
          `Number ${betDigits} for ${betType} betting in ${draw.drawTime} draw has reached its limit of ₱${limitAmount}`,
          'system',
          null,
          drawId
        );
      }

    } catch (error) {
      console.error('Error notifying bet limit reached:', error);
    }
  }

  async notifySystemMaintenance(message, scheduledTime = null) {
    try {
      const users = await prisma.user.findMany({
        where: {
          status: 'active'
        },
        select: { id: true }
      });

      const title = scheduledTime ? '🔧 Scheduled Maintenance' : '🔧 System Maintenance';
      const fullMessage = scheduledTime 
        ? `${message} Scheduled for: ${scheduledTime}`
        : message;

      for (const user of users) {
        await this.createNotification(
          user.id,
          title,
          fullMessage,
          'system'
        );
      }

    } catch (error) {
      console.error('Error notifying system maintenance:', error);
    }
  }

  async notifyNewTicket(ticketId, agentName, betType, betDigits, betAmount, drawTime) {
    try {
      // Notify coordinators and admins about new ticket
      const managers = await prisma.user.findMany({
        where: {
          role: { in: ['coordinator', 'admin', 'superadmin'] }
        },
        select: { id: true }
      });

      for (const manager of managers) {
        await this.createNotification(
          manager.id,
          '🎫 New Ticket',
          `${agentName} placed a ${betType} bet of ₱${betAmount} on number ${betDigits} for ${drawTime} draw`,
          'system',
          ticketId
        );
      }

    } catch (error) {
      console.error('Error notifying new ticket:', error);
    }
  }

  async notifyDrawStatusChange(drawId, newStatus, drawTime) {
    try {
      const draw = await prisma.draw.findUnique({
        where: { id: drawId },
        select: { drawDate: true, drawTime: true }
      });

      if (!draw) return;

      let title, message;

      switch (newStatus) {
        case 'closed':
          title = '🔒 Draw Closed';
          message = `The ${draw.drawTime} draw is now closed for betting`;
          break;
        case 'settled':
          title = '✅ Draw Settled';
          message = `The ${draw.drawTime} draw has been settled`;
          break;
        default:
          return;
      }

      // Notify all users
      const users = await prisma.user.findMany({
        where: {
          status: 'active'
        },
        select: { id: true }
      });

      for (const user of users) {
        await this.createNotification(
          user.id,
          title,
          message,
          'system',
          null,
          drawId
        );
      }

    } catch (error) {
      console.error('Error notifying draw status change:', error);
    }
  }

  async getNotificationStats(userId) {
    try {
      const stats = await prisma.notification.groupBy({
        by: ['notificationType', 'isRead'],
        where: { userId },
        _count: { id: true }
      });

      const total = await prisma.notification.count({
        where: { userId }
      });

      const unread = await prisma.notification.count({
        where: {
          userId,
          isRead: false
        }
      });

      return {
        total,
        unread,
        read: total - unread,
        byType: stats
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        byType: []
      };
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification || notification.userId !== userId) {
        return false;
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: { isRead: true }
      });

      return result.count;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;




