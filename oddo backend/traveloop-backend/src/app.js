require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const tripsRoutes = require('./routes/trips');
const stopsRoutes = require('./routes/stops');
const budgetRoutes = require('./routes/budget');
const packingRoutes = require('./routes/packing');
const notesRoutes = require('./routes/notes');
const invoiceRoutes = require('./routes/invoice');
const searchRoutes = require('./routes/search');
const communityRoutes = require('./routes/community');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & parsing middleware ──
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ──
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health check ──
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Route mounting — EXACT ORDER, no deviations ──
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/trips/:tripId/stops', stopsRoutes);      // mergeParams: true in stopsRoutes
app.use('/api/trips/:tripId/budget', budgetRoutes);    // mergeParams: true — handles /budget AND /expenses sub-routes
app.use('/api/trips/:tripId/packing', packingRoutes);  // mergeParams: true
app.use('/api/trips/:tripId/notes', notesRoutes);      // mergeParams: true
app.use('/api/trips/:tripId/invoice', invoiceRoutes);  // mergeParams: true
app.use('/api/search', searchRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

// ⚠️ DO NOT add a second mount for /api/trips/:tripId/expenses
// Expense routes are already inside budgetRoutes at path /expenses

// ── 404 handler ──
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// ── Global error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

app.listen(PORT, () => console.log(`Traveloop backend running on port ${PORT}`));

module.exports = app;
