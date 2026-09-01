global.crypto = require('crypto').webcrypto;
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/tickets', ticketRoutes);
app.use(express.static(require('path').join(__dirname, '../frontend')));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});