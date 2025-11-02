// src/middleware/authMiddleware.js
function checkApiKey(req, res, next) {
  const expected = process.env.API_KEY;     // set later in cloud
  if (!expected) return next();             // no key configured -> allow
  const provided = req.header('x-api-key');
  if (provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = { checkApiKey };
