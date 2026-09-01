const express = require('express');
const router = express.Router();
const { createTicket, getTickets, resolveTicket, assignTicket } = require('../controllers/ticketController');
router.post('/', createTicket);
router.get('/:userId', getTickets);
router.put('/:id/resolve', resolveTicket);
router.put('/:id/assign', assignTicket);
module.exports = router;