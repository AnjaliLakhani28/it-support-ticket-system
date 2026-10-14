// NFR-N1: security middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Secure HTTP headers. The CSP is relaxed only as far as the existing
// single-page frontend needs (inline script). upgradeInsecureRequests and
// HSTS are disabled because the app is served over plain HTTP on EC2/ALB.
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      upgradeInsecureRequests: null,
    },
  },
  strictTransportSecurity: false,
});

// Limits how many write requests (POST/PUT) one IP can make,
// protecting against ticket spam and brute-force abuse.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.WRITE_RATE_LIMIT) || 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.method === 'GET',
  message: { message: 'Too many requests, please try again later' },
});

module.exports = { securityHeaders, writeLimiter };
