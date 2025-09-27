const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleCheck');
const transactionService = require('../services/transactionService');

const router = express.Router();

// @route   GET /api/audit/login-history/:userId
// @desc    Get login history for a specific user
// @access  Private (Admin/SuperAdmin)
router.get('/login-history/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await transactionService.getUserLoginHistory(
      parseInt(userId), 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history'
    });
  }
});

// @route   GET /api/audit/transaction-history/:userId
// @desc    Get transaction history for a specific user
// @access  Private (Admin/SuperAdmin)
router.get('/transaction-history/:userId', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await transactionService.getUserTransactionHistory(
      parseInt(userId), 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
});

// @route   GET /api/audit/system-log
// @desc    Get system audit log with filtering
// @access  Private (SuperAdmin only)
router.get('/system-log', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      tableName, 
      userId, 
      operation, 
      startDate, 
      endDate 
    } = req.query;
    
    const filters = {};
    if (tableName) filters.tableName = tableName;
    if (userId) filters.userId = parseInt(userId);
    if (operation) filters.operation = operation;
    if (startDate) filters.startDate = new Date(startDate + 'T00:00:00+08:00');
    if (endDate) filters.endDate = new Date(endDate + 'T23:59:59.999+08:00');
    
    const auditLog = await transactionService.getAuditLog(
      filters, 
      parseInt(page), 
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log'
    });
  }
});

// Export audit log as CSV
router.get('/system-log/export', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { tableName, userId, operation, startDate, endDate, limit = 10000 } = req.query;
    const filters = {};
    if (tableName) filters.tableName = tableName;
    if (userId) filters.userId = parseInt(userId);
    if (operation) filters.operation = operation;
    if (startDate) filters.startDate = new Date(startDate + 'T00:00:00+08:00');
    if (endDate) filters.endDate = new Date(endDate + 'T23:59:59.999+08:00');

    const auditLog = await transactionService.getAuditLog(filters, 1, parseInt(limit));
    const rows = auditLog.auditLogs || [];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit_log.csv"');

    const header = ['id','table_name','record_id','operation','user_id','username','created_at'];
    res.write(header.join(',') + '\n');
    for (const r of rows) {
      const line = [r.id, r.table_name, r.record_id, r.operation, r.user_id, (r.username||''), r.created_at?.toISOString?.()||''];
      res.write(line.join(',') + '\n');
    }
    res.end();
  } catch (error) {
    console.error('Error exporting audit log:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit log' });
  }
});

// @route   GET /api/audit/failed-logins
// @desc    Get failed login attempts (last 24 hours)
// @access  Private (Admin/SuperAdmin)
router.get('/failed-logins', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const failedLogins = await prisma.loginAudit.findMany({
        where: {
          status: 'failed',
          createdAt: { gte: twentyFourHoursAgo }
        },
        include: {
          user: {
            select: {
              username: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 100
      });
      
      res.json({
        success: true,
        data: {
          failedLogins: failedLogins.map(login => ({
            ...login,
            username: login.user?.username,
            full_name: login.user?.fullName,
            email: login.user?.email,
            user: undefined
          })),
          totalCount: failedLogins.length
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Error fetching failed logins:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch failed logins'
    });
  }
});

// @route   GET /api/audit/security-summary
// @desc    Get security summary dashboard data
// @access  Private (SuperAdmin only)
router.get('/security-summary', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      // Get failed logins in last 24 hours
      const failedLogins = await prisma.loginAudit.count({
        where: {
          status: 'failed',
          createdAt: { gte: twentyFourHoursAgo }
        }
      });
      
      // Get successful logins in last 24 hours
      const successfulLogins = await prisma.loginAudit.count({
        where: {
          status: 'success',
          createdAt: { gte: twentyFourHoursAgo }
        }
      });
      
      // Get failed transactions in last 24 hours
      const failedTransactions = await prisma.balanceTransaction.count({
        where: {
          amount: { lt: 0 },
          createdAt: { gte: twentyFourHoursAgo }
        }
      });
      
      // Get unique IPs with failed logins
      const suspiciousIPs = await prisma.loginAudit.groupBy({
        by: ['ipAddress'],
        where: {
          status: 'failed',
          createdAt: { gte: twentyFourHoursAgo }
        },
        having: {
          ipAddress: {
            _count: {
              gt: 5
            }
          }
        },
        orderBy: {
          _count: {
            ipAddress: 'desc'
          }
        },
        _count: {
          ipAddress: true
        }
      });
      
      // Get recent audit activities
      const recentAuditActivities = await prisma.auditLog.findMany({
        select: {
          id: true,
          action: true,
          tableName: true,
          recordId: true,
          createdAt: true,
          ipAddress: true,
          userAgent: true,
          details: true,
          user: {
            select: {
              username: true,
              fullName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });

      res.json({
        success: true,
        data: {
          failedLogins24h: failedLogins,
          successfulLogins24h: successfulLogins,
          failedTransactions24h: failedTransactions,
          suspiciousIPs: suspiciousIPs.map(ip => ({
            ip_address: ip.ipAddress,
            attempts: ip._count.ipAddress
          })),
          recentAuditActivities: recentAuditActivities.map(activity => ({
            ...activity,
            username: activity.user?.username,
            fullName: activity.user?.fullName,
            user: undefined
          }))
        }
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Error fetching security summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch security summary'
    });
  }
});

module.exports = router;
