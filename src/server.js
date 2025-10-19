// src/server.js
require('dotenv').config();
const express = require('express');
const app = express();

// --- Swagger UI @ /api-docs ---
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const openapiDocument = YAML.load('./project_files/openapi.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

// Optional: make the base URL redirect to /api-docs
app.get('/', (_req, res) => res.redirect('/api-docs'));


// health/sanity route
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Group 2 👋' });
});

// Mount API routes
const movieByYearRouter = require('./routes/moviebyyear');
app.use('/api/v1', movieByYearRouter);

// allow Render/Heroku to set PORT, default to 3000 for local dev
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

// graceful shutdown
const pool = require('./db');
const shutdown = async () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('HTTP server closed');
  });
  try {
    await pool.end();
    console.log('PG pool closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown', err);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

