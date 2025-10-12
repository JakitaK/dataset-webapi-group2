// src/server.js
const express = require('express');
const app = express();

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Group 2 👋' });
});

// CHANGE: make "/" go to "/api/hello"
app.get('/', (_req, res) => res.redirect(307, '/api/hello'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
