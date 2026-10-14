// NFR-N4: health check used by the AWS Application Load Balancer target group.
// Returns 200 when the app and database are up, 503 otherwise, so the ALB
// stops sending traffic to an unhealthy instance. `instance` shows which EC2
// server answered - used to prove load balancing.
const os = require('os');
const mongoose = require('mongoose');

// Wrapped in an object so tests can stub the database state
const dbStatus = {
  isConnected: () => mongoose.connection.readyState === 1,
};

const getHealth = (req, res) => {
  const dbConnected = dbStatus.isConnected();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'ok' : 'degraded',
    instance: os.hostname(),
    database: dbConnected ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth, dbStatus };
