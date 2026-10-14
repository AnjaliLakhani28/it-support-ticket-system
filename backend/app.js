// app.js - builds and exports the Express application.
// Kept separate from server.js so tests can import the app without
// opening a port or connecting to MongoDB.
const path = require('path');
const express = require('express');
const cors = require('cors');
const ticketRoutes = require('./routes/ticketRoutes');
const agentRoutes = require('./routes/agentRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use('/api/agent', agentRoutes); // FR-N3
app.use(express.static(path.join(__dirname, '../frontend')));

module.exports = app;
