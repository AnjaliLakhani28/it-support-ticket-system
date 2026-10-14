const express = require('express');
const router = express.Router();
const {
  createTicket, getTickets, resolveTicket, assignTicket,
  updatePriority, getOverdueTickets, addComment, getActivity
} = require('../controllers/ticketController');
const { validateObjectId, validateTicketInput } = require('../middleware/validation');

// NFR-N2: every :id is checked to be a valid ObjectId before reaching a controller
router.param('id', validateObjectId);

router.post('/', validateTicketInput, createTicket);
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
