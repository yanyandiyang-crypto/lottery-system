const { randomUUID } = require('crypto');

module.exports = function requestId(req, res, next) {
  const id = req.headers['x-request-id'] || randomUUID();
  req.requestId = id;
  res.set('X-Request-Id', id);
  next();
};


