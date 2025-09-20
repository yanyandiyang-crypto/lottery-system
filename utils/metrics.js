const prometheus = require('prom-client');
const logger = require('./logger');

// Create a Registry
const register = new prometheus.Registry();

// Add default metrics
prometheus.collectDefaultMetrics({ register });

// Custom metrics for lottery system
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseQueryDuration = new prometheus.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table']
});

const ticketCreationCounter = new prometheus.Counter({
  name: 'tickets_created_total',
  help: 'Total number of tickets created',
  labelNames: ['bet_type', 'draw_time']
});

const balanceTransactionCounter = new prometheus.Counter({
  name: 'balance_transactions_total',
  help: 'Total number of balance transactions',
  labelNames: ['transaction_type', 'user_role']
});

const userLoginCounter = new prometheus.Counter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['user_role', 'status']
});

const drawExecutionCounter = new prometheus.Counter({
  name: 'draws_executed_total',
  help: 'Total number of draws executed',
  labelNames: ['draw_time', 'status']
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseQueryDuration);
register.registerMetric(ticketCreationCounter);
register.registerMetric(balanceTransactionCounter);
register.registerMetric(userLoginCounter);
register.registerMetric(drawExecutionCounter);

// Helper functions for metrics
const recordHttpRequest = (req, res, duration) => {
  const route = req.route ? req.route.path : req.path;
  const method = req.method;
  const statusCode = res.statusCode;

  httpRequestDuration
    .labels(method, route, statusCode)
    .observe(duration);

  httpRequestTotal
    .labels(method, route, statusCode)
    .inc();
};

const recordDatabaseQuery = (operation, table, duration) => {
  databaseQueryDuration
    .labels(operation, table)
    .observe(duration);
};

const recordTicketCreation = (betType, drawTime) => {
  ticketCreationCounter
    .labels(betType, drawTime)
    .inc();
};

const recordBalanceTransaction = (transactionType, userRole) => {
  balanceTransactionCounter
    .labels(transactionType, userRole)
    .inc();
};

const recordUserLogin = (userRole, status) => {
  userLoginCounter
    .labels(userRole, status)
    .inc();
};

const recordDrawExecution = (drawTime, status) => {
  drawExecutionCounter
    .labels(drawTime, status)
    .inc();
};

const updateActiveConnections = (count) => {
  activeConnections.set(count);
};

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
  databaseQueryDuration,
  ticketCreationCounter,
  balanceTransactionCounter,
  userLoginCounter,
  drawExecutionCounter,
  recordHttpRequest,
  recordDatabaseQuery,
  recordTicketCreation,
  recordBalanceTransaction,
  recordUserLogin,
  recordDrawExecution,
  updateActiveConnections
};
