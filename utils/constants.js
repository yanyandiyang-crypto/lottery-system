/**
 * Application Constants
 * Centralized constants for better maintainability
 */

// User Roles
const USER_ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
  AREA_COORDINATOR: 'area_coordinator',
  COORDINATOR: 'coordinator',
  AGENT: 'agent'
};
// Ticket Status
const TICKET_STATUS = {
  PENDING: 'pending',
  VALIDATED: 'validated',
  CLAIMED: 'claimed',
  PENDING_APPROVAL: 'pending_approval',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

// Draw Status
const DRAW_STATUS = {
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Bet Types
const BET_TYPES = {
  STRAIGHT: 'straight',
  RAMBOLITO: 'rambolito',
  COMBINATION: 'combination'
};

// Prize Structure (default values)
const PRIZE_STRUCTURE = {
  STRAIGHT: 4500,  // ₱4,500 per peso bet
  RAMBOLITO: 750   // ₱750 per peso bet
};

// Audit Actions
const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_TICKET: 'CREATE_TICKET',
  CLAIM_REQUESTED: 'CLAIM_REQUESTED',
  CLAIM_APPROVED: 'CLAIM_APPROVED',
  CLAIM_REJECTED: 'CLAIM_REJECTED',
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  DRAW_CREATED: 'DRAW_CREATED',
  DRAW_COMPLETED: 'DRAW_COMPLETED'
};

// API Response Messages
const RESPONSE_MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Insufficient permissions',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  DUPLICATE_ENTRY: 'Resource already exists'
};

// Validation Rules
const VALIDATION_RULES = {
  TICKET_NUMBER_LENGTH: 17,
  MIN_PASSWORD_LENGTH: 6,
  MAX_USERNAME_LENGTH: 50,
  MAX_FULLNAME_LENGTH: 100,
  MIN_BET_AMOUNT: 1,
  MAX_BET_AMOUNT: 10000
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

// Date Formats
const DATE_FORMATS = {
  DATE_ONLY: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  TIME_ONLY: 'HH:mm:ss'
};

// Cache TTL (in seconds)
const CACHE_TTL = {
  SHORT: 300,    // 5 minutes
  MEDIUM: 1800,  // 30 minutes
  LONG: 3600     // 1 hour
};

module.exports = {
  USER_ROLES,
  TICKET_STATUS,
  DRAW_STATUS,
  BET_TYPES,
  PRIZE_STRUCTURE,
  AUDIT_ACTIONS,
  RESPONSE_MESSAGES,
  VALIDATION_RULES,
  PAGINATION,
  DATE_FORMATS,
  CACHE_TTL
};
