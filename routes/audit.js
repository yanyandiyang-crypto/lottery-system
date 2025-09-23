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
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    
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

// @route   GET /api/audit/failed-logins
// @desc    Get failed login attempts (last 24 hours)
// @access  Private (Admin/SuperAdmin)
router.get('/failed-logins', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });
    
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT la.*, u.username, u.full_name, u.email
        FROM login_audit la
        LEFT JOIN users u ON la.user_id = u.id
        WHERE la.login_success = false 
        AND la.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY la.created_at DESC
        LIMIT 100
      `);
      
      res.json({
        success: true,
        data: {
          failedLogins: result.rows,
          totalCount: result.rows.length
        }
      });
    } finally {
      client.release();
      await pool.end();
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
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });
    
    const client = await pool.connect();
    
    try {
      // Get failed logins in last 24 hours
      const failedLoginsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM login_audit 
        WHERE login_success = false 
        AND created_at >= NOW() - INTERVAL '24 hours'
      `);
      
      // Get successful logins in last 24 hours
      const successfulLoginsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM login_audit 
        WHERE login_success = true 
        AND created_at >= NOW() - INTERVAL '24 hours'
      `);
      
      // Get failed transactions in last 24 hours
      const failedTransactionsResult = await client.query(`
        SELECT COUNT(*) as count
        FROM balance_transactions 
        WHERE status = 'failed' 
        AND "createdAt" >= NOW() - INTERVAL '24 hours'
      `);
      
      // Get unique IPs with failed logins
      const suspiciousIPsResult = await client.query(`
        SELECT ip_address, COUNT(*) as attempts
        FROM login_audit 
        WHERE login_success = false 
        AND created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY ip_address
        HAVING COUNT(*) > 5
        ORDER BY attempts DESC
      `);
      
      // Get recent audit activities
      const recentAuditResult = await client.query(`
        SELECT al.*, u.username, u.full_name
        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `);
      
      res.json({
        success: true,
        data: {
          failedLogins24h: parseInt(failedLoginsResult.rows[0].count),
          successfulLogins24h: parseInt(successfulLoginsResult.rows[0].count),
          failedTransactions24h: parseInt(failedTransactionsResult.rows[0].count),
          suspiciousIPs: suspiciousIPsResult.rows,
          recentAuditActivities: recentAuditResult.rows
        }
      });
    } finally {
      client.release();
      await pool.end();
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
