// src/server.js
require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const app = express();

/**
 * @swagger
 * /api/hello:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns a simple greeting message to verify the API is working
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HelloResponse'
 *             example:
 *               message: "Hello from Group 2 👋"
 */
app.get('/api/hello', (_req, res) => {
  res.json({ message: 'Hello from Group 2 👋' });
});

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Movies API - Group 2'
}));

// Optional: make the base URL redirect to /api-docs
app.get('/', (_req, res) => res.redirect('/api-docs'));

// Mount API routes
const movieByYearRouter = require('./routes/moviebyyear');
const movieRoutes = require('./routes/movies');
app.use('/api/v1', movieByYearRouter);
app.use('/api/v1', movieRoutes);

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

