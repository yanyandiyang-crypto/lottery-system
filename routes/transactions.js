const express = require('express');
const { requireAuth } = require('../middleware/auth');
const transactionService = require('../services/transactionService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const router = express.Router();

// @route   GET /api/transactions/history
// @desc    Get current user's balance transaction history (paginated)
// @access  Private
router.get('/history', requireAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const requestedUserId = req.query.userId ? parseInt(req.query.userId, 10) : null;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    // Authorization by role
    // - superadmin/admin: can view any user's transactions
    // - area_coordinator: can view coordinators/agents within same region
    // - coordinator: can view their agents
    // - others: only self
    let userId = req.user.id;
    if (requestedUserId) {
      if (['superadmin', 'admin'].includes(req.user.role)) {
        userId = requestedUserId;
      } else if (req.user.role === 'area_coordinator') {
        const target = await prisma.user.findUnique({ where: { id: requestedUserId }, select: { id: true, role: true, regionId: true, coordinatorId: true } });
        if (target && target.regionId === req.user.regionId && ['coordinator', 'agent'].includes(target.role)) {
          userId = requestedUserId;
        } else {
          return res.status(403).json({ success: false, message: 'Not allowed to view this user\'s transactions' });
        }
      } else if (req.user.role === 'coordinator') {
        const target = await prisma.user.findUnique({ where: { id: requestedUserId }, select: { id: true, role: true, coordinatorId: true } });
        if (target && target.coordinatorId === req.user.id && target.role === 'agent') {
          userId = requestedUserId;
        } else {
          return res.status(403).json({ success: false, message: 'Not allowed to view this user\'s transactions' });
        }
      } else {
        // Other roles can only view self
        if (requestedUserId !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Not allowed to view this user\'s transactions' });
        }
      }
    }

    try {
      const data = await transactionService.getUserTransactionHistory(userId, page, limit, startDate, endDate);
      return res.json({ success: true, data });
    } catch (svcError) {
      // Fallback to Prisma-based query to avoid column mismatch issues
      const skip = (page - 1) * limit;
      const whereClause = {
        userId
      };
      if (startDate) {
        whereClause.createdAt = { ...(whereClause.createdAt || {}), gte: startDate };
      }
      if (endDate) {
        whereClause.createdAt = { ...(whereClause.createdAt || {}), lte: endDate };
      }

      const [rows, total] = await Promise.all([
        prisma.balanceTransaction.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            processedBy: {
              select: { id: true, username: true, fullName: true }
            }
          }
        }),
        prisma.balanceTransaction.count({ where: whereClause })
      ]);

      const data = {
        transactions: rows.map(r => ({
          id: r.id,
          user_id: r.userId,
          amount: r.amount,
          transaction_type: r.transactionType,
          description: r.description,
          processed_by: r.processedById,
          status: r.status || 'completed',
          createdAt: r.createdAt,
          processed_by_username: r.processedBy?.username || r.processedBy?.fullName || null
        })),
        totalCount: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit)
      };

      return res.json({ success: true, data });
    }
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transaction history' });
  }
});

module.exports = router;


