// credentials-api/src/server.js
// Credentials API server - handles authentication, password management, and verification

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const openRoutes = require('./routes/open');
const closedRoutes = require('./routes/closed');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${req.method} ${req.path}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Body:', JSON.stringify(req.body, null, 2));
        }
        next();
    });
}

// Routes
app.use('/', openRoutes);      // Public routes (no auth required)
app.use('/', closedRoutes);    // Protected routes (JWT required)

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🔐 Credentials API running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

module.exports = app;
