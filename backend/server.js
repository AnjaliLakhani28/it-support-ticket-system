// server.js - entry point: connects to MongoDB and starts listening.
// Run with `node server.js` locally, or via pm2 (see ecosystem.config.js) on EC2.
global.crypto = require('crypto').webcrypto;
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5001;

connectDB();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
