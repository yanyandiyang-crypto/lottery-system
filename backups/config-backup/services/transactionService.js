const { Pool } = require('pg');
const logger = require('../utils/logger');

class TransactionService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  /**
   * Safely create a ticket with atomic balance deduction
   * Uses database transactions with FOR UPDATE locking
   */
  async createTicketWithBalanceDeduction(ticketData, userData, clientIP = null, userAgent = null) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Lock user balance row for update
      const balanceResult = await client.query(
        'SELECT current_balance FROM user_balances WHERE user_id = $1 FOR UPDATE',
        [userData.id]
      );
      
      if (balanceResult.rows.length === 0) {
        throw new Error('User balance not found');
      }
      
      const { current_balance } = balanceResult.rows[0];
      
      // 2. Check sufficient balance
      if (current_balance < ticketData.totalAmount) {
        throw new Error(`Insufficient balance. Required: ₱${ticketData.totalAmount}, Available: ₱${current_balance}`);
      }
      
      // 3. Check bet limits per draw - REMOVED: Using per-number limits instead of per-user limits
      // The per-number bet limits are handled in the main ticket creation logic
      
      // 4. Insert balance transaction with pending status
      const transactionResult = await client.query(
        `INSERT INTO balance_transactions 
         (user_id, amount, transaction_type, description, processed_by, status)
         VALUES ($1, $2, 'use', $3, $4, 'pending')
         RETURNING id`,
        [
          userData.id,
          ticketData.totalAmount,
          `Ticket purchase: ${ticketData.ticketNumber}`,
          userData.id
        ]
      );
      
      const transactionId = transactionResult.rows[0].id;
      
      // 6. Insert ticket
      const ticketResult = await client.query(
        `INSERT INTO tickets 
         (ticket_number, user_id, draw_id, total_amount, status, qr_code, template_id, agent_id, bet_date, sequence_number, "updatedAt")
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, NOW(), $8, NOW())
         RETURNING id, ticket_number`,
        [
          ticketData.ticketNumber,
          userData.id,
          ticketData.drawId,
          ticketData.totalAmount,
          ticketData.qrCode,
          ticketData.templateId || 1,
          userData.id,
          'A'
        ]
      );
      
      const ticketId = ticketResult.rows[0].id;
      
      // 7. Update user balance
      await client.query(
        `UPDATE user_balances 
         SET current_balance = current_balance - $1,
             last_updated = NOW()
         WHERE user_id = $2`,
        [ticketData.totalAmount, userData.id]
      );
      
      // 8. Update bet limits
      await client.query(
        `INSERT INTO user_bet_limits (user_id, draw_id, bet_type, current_amount, max_amount)
         VALUES ($1, $2, $3, $4, 1000.00)
         ON CONFLICT (user_id, draw_id, bet_type)
         DO UPDATE SET current_amount = user_bet_limits.current_amount + $4`,
        [userData.id, ticketData.drawId, ticketData.betType, ticketData.totalAmount]
      );
      
      // 9. Mark transaction as completed
      await client.query(
        'UPDATE balance_transactions SET status = $1 WHERE id = $2',
        ['completed', transactionId]
      );
      
      // 10. Log audit trail
      await client.query(
        `INSERT INTO audit_log (table_name, record_id, action, details, user_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'tickets',
          ticketId,
          'INSERT',
          JSON.stringify({
            ticket_number: ticketData.ticketNumber,
            total_amount: ticketData.totalAmount
          }),
          userData.id,
          clientIP || '127.0.0.1',
          userAgent || 'Unknown'
        ]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Ticket created successfully: ${ticketData.ticketNumber} for user ${userData.username}`);
      
      return {
        success: true,
        ticketId,
        ticketNumber: ticketData.ticketNumber,
        remainingBalance: current_balance - ticketData.totalAmount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Transaction failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Log user login attempt
   */
  async logLoginAttempt(userId, ipAddress, userAgent, success, failureReason = null) {
    try {
      await this.pool.query(
        `INSERT INTO login_audit (user_id, ip_address, user_agent, login_success, failure_reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, ipAddress, userAgent, success, failureReason]
      );
    } catch (error) {
      logger.error('Failed to log login attempt:', error.message);
      // Don't throw - login logging shouldn't break the login flow
    }
  }

  /**
   * Get recent failed login attempts for throttling/lockout
   * - recentFailures: failed attempts in the last 30 seconds
   * - totalFailures: failed attempts in the last 24 hours
   */
  async getRecentLoginFailures(userId) {
    try {
      const recentResult = await this.pool.query(
        `SELECT COUNT(*)::int AS count
         FROM login_audit
         WHERE user_id = $1 AND login_success = false AND created_at >= NOW() - INTERVAL '30 seconds'`,
        [userId]
      );

      const totalResult = await this.pool.query(
        `SELECT COUNT(*)::int AS count
         FROM login_audit
         WHERE user_id = $1 AND login_success = false AND created_at >= NOW() - INTERVAL '24 hours'`,
        [userId]
      );

      return {
        recentFailures: recentResult.rows[0]?.count || 0,
        totalFailures: totalResult.rows[0]?.count || 0
      };
    } catch (error) {
      logger.error('Failed to get recent login failures:', error.message);
      return { recentFailures: 0, totalFailures: 0 };
    }
  }

  /**
   * Get user transaction history with pagination
   */
  async getUserTransactionHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    try {
      const result = await this.pool.query(
        `SELECT 
            bt.id,
            bt.user_id,
            bt.amount,
            bt.transaction_type,
            bt.description,
            bt.processed_by,
            bt.status,
            COALESCE(bt."createdAt", bt.created_at) AS "createdAt",
            u.username as processed_by_username
         FROM balance_transactions bt
         LEFT JOIN users u ON bt.processed_by = u.id
         WHERE bt.user_id = $1
         ORDER BY COALESCE(bt."createdAt", bt.created_at) DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      const countResult = await this.pool.query(
        'SELECT COUNT(*) FROM balance_transactions WHERE user_id = $1',
        [userId]
      );
      
      return {
        transactions: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      };
    } catch (error) {
      logger.error('Failed to get transaction history:', error.message);
      throw error;
    }
  }

  /**
   * Get user login audit history
   */
  async getUserLoginHistory(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    
    try {
      const result = await this.pool.query(
        `SELECT * FROM login_audit 
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );
      
      const countResult = await this.pool.query(
        'SELECT COUNT(*) FROM login_audit WHERE user_id = $1',
        [userId]
      );
      
      return {
        logins: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      };
    } catch (error) {
      logger.error('Failed to get login history:', error.message);
      throw error;
    }
  }

  /**
   * Refund a ticket (atomic operation)
   */
  async refundTicket(ticketId, processedBy, reason, clientIP = null) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Get ticket details
      const ticketResult = await client.query(
        'SELECT * FROM tickets WHERE id = $1',
        [ticketId]
      );
      
      if (ticketResult.rows.length === 0) {
        throw new Error('Ticket not found');
      }
      
      const ticket = ticketResult.rows[0];
      
      // 2. Check if ticket can be refunded
      if (ticket.status !== 'pending') {
        throw new Error('Only pending tickets can be refunded');
      }
      
      // 3. Lock user balance for update
      await client.query(
        'SELECT current_balance FROM user_balances WHERE user_id = $1 FOR UPDATE',
        [ticket.user_id]
      );
      
      // 4. Insert refund transaction
      const refundResult = await client.query(
        `INSERT INTO balance_transactions 
         (user_id, amount, transaction_type, description, processed_by, status)
         VALUES ($1, $2, 'refund', $3, $4, 'pending')
         RETURNING id`,
        [
          ticket.user_id,
          ticket.total_amount,
          `Ticket refund: ${ticket.ticket_number} - ${reason}`,
          processedBy
        ]
      );
      
      const transactionId = refundResult.rows[0].id;
      
      // 5. Update user balance
      await client.query(
        `UPDATE user_balances 
         SET current_balance = current_balance + $1,
             last_updated = NOW()
         WHERE user_id = $2`,
        [ticket.total_amount, ticket.user_id]
      );
      
      // 6. Update ticket status
      await client.query(
        'UPDATE tickets SET status = $1 WHERE id = $2',
        ['cancelled', ticketId]
      );
      
      // 7. Mark transaction as completed
      await client.query(
        'UPDATE balance_transactions SET status = $1 WHERE id = $2',
        ['completed', transactionId]
      );
      
      // 8. Log audit trail
      await client.query(
        `INSERT INTO audit_log (table_name, record_id, action, details, user_id, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          'tickets',
          ticketId,
          'UPDATE',
          JSON.stringify({ 
            old_status: 'pending',
            new_status: 'cancelled', 
            refund_reason: reason 
          }),
          processedBy,
          clientIP || '127.0.0.1',
          'System'
        ]
      );
      
      await client.query('COMMIT');
      
      logger.info(`Ticket refunded successfully: ${ticket.ticket_number}`);
      
      return {
        success: true,
        ticketId,
        refundAmount: ticket.total_amount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Refund transaction failed:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get system audit log with filtering
   */
  async getAuditLog(filters = {}, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    if (filters.tableName) {
      paramCount++;
      whereClause += ` AND table_name = $${paramCount}`;
      params.push(filters.tableName);
    }
    
    if (filters.userId) {
      paramCount++;
      whereClause += ` AND user_id = $${paramCount}`;
      params.push(filters.userId);
    }
    
    if (filters.operation) {
      paramCount++;
      whereClause += ` AND operation = $${paramCount}`;
      params.push(filters.operation);
    }
    
    if (filters.startDate) {
      paramCount++;
      whereClause += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      paramCount++;
      whereClause += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
    }
    
    try {
      const result = await this.pool.query(
        `SELECT al.*, u.username, u.full_name
         FROM audit_log al
         LEFT JOIN users u ON al.user_id = u.id
         ${whereClause}
         ORDER BY al.created_at DESC
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );
      
      const countResult = await this.pool.query(
        `SELECT COUNT(*) FROM audit_log al ${whereClause}`,
        params
      );
      
      return {
        auditLogs: result.rows,
        totalCount: parseInt(countResult.rows[0].count),
        currentPage: page,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      };
    } catch (error) {
      logger.error('Failed to get audit log:', error.message);
      throw error;
    }
  }
}

module.exports = new TransactionService();

