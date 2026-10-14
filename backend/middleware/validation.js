// NFR-N2: input validation - bad input always gets a clear 400, never a 500
const mongoose = require('mongoose');

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Account'];

// Used with router.param('id') - rejects malformed MongoDB ObjectIds early
function validateObjectId(req, res, next, id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid ticket ID format' });
  }
  next();
}

// Validates the body for POST /api/tickets
function validateTicketInput(req, res, next) {
  const { title, description, category, userId } = req.body || {};
  const errors = [];

  if (!title || !String(title).trim()) errors.push('title is required');
  else if (String(title).length > 100) errors.push('title must be 100 characters or fewer');

  if (!description || !String(description).trim()) errors.push('description is required');
  else if (String(description).length > 2000) errors.push('description must be 2000 characters or fewer');

  if (!CATEGORIES.includes(category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);

  if (!userId || !String(userId).trim()) errors.push('userId is required');

  if (errors.length) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
}

module.exports = { validateObjectId, validateTicketInput };
