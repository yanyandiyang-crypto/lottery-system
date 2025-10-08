const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/notifications/winners
// @desc    Get winner notifications for agents
// @access  Private
router.get('/winners', async (req, res) => {
  try {
    const { filter = 'all', type = 'win' } = req.query;
    
    let whereClause = { 
      userId: req.user.id,
      type: type
    };

    // Apply date filters
    const now = new Date();
    if (filter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      whereClause.createdAt = { gte: today };
    } else if (filter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      whereClause.createdAt = { gte: weekAgo };
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        relatedTicket: {
          select: {
            id: true,
            ticketNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            winningTickets: {
              select: {
                prizeAmount: true
              }
            }
          }
        },
        relatedDraw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format notifications with winning details
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      relatedTicket: notification.relatedTicket ? {
        ticketNumber: notification.relatedTicket.ticketNumber,
        totalAmount: notification.relatedTicket.totalAmount,
        status: notification.relatedTicket.status,
        prizeAmount: notification.relatedTicket.winningTickets[0]?.prizeAmount || 0
      } : null,
      relatedDraw: notification.relatedDraw
    }));

    res.json({
      success: true,
      data: formattedNotifications
    });

  } catch (error) {
    console.error('Get winner notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/notifications
// @desc    Get user notifications
// @access  Private
router.get('/', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.error('❌ Notifications: User not authenticated');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    console.log('✅ Fetching notifications for user:', req.user.id, 'role:', req.user.role);

    const { page = 1, limit = 20, isRead, type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = { userId: req.user.id };

    // Additional filters
    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }

    if (type) {
      whereClause.type = type;
    }

    console.log('📋 Query where clause:', whereClause);

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        relatedTicket: {
          select: {
            id: true,
            ticketNumber: true,
            totalAmount: true,
            // status: true,  // Removed - causes enum error with 'claimed' status
            createdAt: true
          }
        },
        relatedDraw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true
          }
        }
      },
      skip: offset,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    console.log('✅ Found notifications:', notifications.length);

    const total = await prisma.notification.count({ where: whereClause });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update this notification'
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', async (req, res) => {
  try {
    const updatedCount = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: `${updatedCount.count} notifications marked as read`
    });

  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/notifications
// @desc    Create notification (Admin/SuperAdmin only)
// @access  Private (Admin/SuperAdmin)
router.post('/', [
  body('userId').optional().isInt().withMessage('User ID must be an integer'),
  body('targetRoles').optional().isArray().withMessage('targetRoles must be an array'),
  body('title').notEmpty().withMessage('Title is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('type').optional().isIn(['winning', 'system', 'balance', 'info', 'success', 'warning', 'error']).withMessage('Invalid notification type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Check if user has permission to create notifications
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create notifications'
      });
    }

    const { userId, title, message, type, targetRoles, relatedTicketId, relatedDrawId } = req.body;

    // Ensure at least a userId or targetRoles is provided
    if (!userId && (!Array.isArray(targetRoles) || targetRoles.length === 0)) {
      return res.status(400).json({ success: false, message: 'Provide a userId or targetRoles[]' });
    }

    // Normalize type
    const finalType = type || 'system';

    // Broadcast to roles if targetRoles present
    if (Array.isArray(targetRoles) && targetRoles.length > 0) {
      const targetUsers = await prisma.user.findMany({
        where: { role: { in: targetRoles }, status: 'active' },
        select: { id: true }
      });

      if (targetUsers.length === 0) {
        return res.status(404).json({ success: false, message: 'No users found for the specified roles' });
      }

      const created = await prisma.$transaction(async (tx) => {
        const results = [];
        
        // Create notification for the creator first
        const creatorNotification = await tx.notification.create({
          data: {
            userId: req.user.id,
            title,
            message,
            type: finalType,
            relatedTicketId: relatedTicketId || null,
            relatedDrawId: relatedDrawId || null
          }
        });
        results.push(creatorNotification);
        
        // Create notifications for target users
        for (const u of targetUsers) {
          const n = await tx.notification.create({
            data: {
              userId: u.id,
              title,
              message,
              type: finalType,
              relatedTicketId: relatedTicketId || null,
              relatedDrawId: relatedDrawId || null
            }
          });
          results.push(n);
        }
        return results;
      });

      const io = req.app.get('io');
      if (io) {
        for (const n of created) {
          io.to(`user-${n.userId}`).emit('notification', {
            id: n.id,
            title: n.title,
            message: n.message,
            type: n.type,
            createdAt: n.createdAt
          });
        }
      }

      return res.status(201).json({ success: true, message: `Notifications created for ${created.length} users (including creator)`, data: { count: created.length } });
    }

    // Single-user notification path
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: finalType,
        relatedTicketId: relatedTicketId || null,
        relatedDrawId: relatedDrawId || null
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt
      });
    }

    return res.status(201).json({ success: true, message: 'Notification created successfully', data: notification });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete this notification'
      });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.notification.groupBy({
      by: ['notificationType', 'isRead'],
      where: { userId: req.user.id },
      _count: { id: true }
    });

    const totalNotifications = await prisma.notification.count({
      where: { userId: req.user.id }
    });

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: req.user.id,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: totalNotifications - unreadNotifications,
        byType: stats
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;


