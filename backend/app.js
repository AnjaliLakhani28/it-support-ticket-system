// app.js - builds and exports the Express application.
// Kept separate from server.js so tests can import the app without
// opening a port or connecting to MongoDB.
const os = require('os');
const path = require('path');
const express = require('express');
const cors = require('cors');
const ticketRoutes = require('./routes/ticketRoutes');
const agentRoutes = require('./routes/agentRoutes');
const { getHealth } = require('./controllers/healthController');
const { securityHeaders, writeLimiter } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);              // real client IP behind the AWS load balancer
app.disable('x-powered-by');
app.use(securityHeaders);               // NFR-N1
app.use(cors());
app.use(express.json({ limit: '10kb' })); // NFR-N1: reject oversized payloads

// Tells you which EC2 instance served each response (load-balancing evidence)
app.use((req, res, next) => {
  res.set('X-Served-By', os.hostname());
  next();
});

app.get('/api/health', getHealth);      // NFR-N4
app.use('/api', writeLimiter);          // NFR-N1
app.use('/api/tickets', ticketRoutes);
app.use('/api/agent', agentRoutes);     // FR-N3
app.use('/api', notFound);
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(errorHandler);

module.exports = app;
