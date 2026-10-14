// NFR-N2: central error handling - malformed JSON gets 400, unknown API
// routes get 404, and unexpected errors return a generic 500 message
// (no stack traces leaked to the client).
function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Malformed JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
