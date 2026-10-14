// FR-N3: Agent dashboard routes, mounted at /api/agent
const express = require('express');
const router = express.Router();
const { getDashboardTickets, getDashboardStats } = require('../controllers/agentController');

router.get('/tickets', getDashboardTickets);
router.get('/stats', getDashboardStats);

module.exports = router;
