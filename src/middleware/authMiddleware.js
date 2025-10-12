// src/middleware/authMiddleware.js
// Simple placeholder for future Auth^2 sprint.
// If no API_KEY is set, it lets everything through (so nothing breaks).

function checkApiKey(req, res, next) {
  const key = req.header('x-api-key');
  const expected = process.env.API_KEY; // set this later in cloud env

  if (!expected) return next();              // no key configured -> allow
  if (key !== expected) return res.status(401).json({ error: 'Unauthorized' });

  next();
}

module.exports = { checkApiKey };
