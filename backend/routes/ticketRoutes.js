const express = require('express');
const router = express.Router();
const {
  createTicket, getTickets, resolveTicket, assignTicket,
  updatePriority, getOverdueTickets, addComment, getActivity
} = require('../controllers/ticketController');

router.post('/', createTicket);
// FR-N1 - must be registered before '/:userId' so "overdue" is not read as a userId
router.get('/overdue', getOverdueTickets);
router.get('/:userId', getTickets);
router.put('/:id/resolve', resolveTicket);
router.put('/:id/assign', assignTicket);
router.put('/:id/priority', updatePriority);
// FR-N2
router.post('/:id/comments', addComment);
router.get('/:id/activity', getActivity);
module.exports = router;
