// server.js (updated)
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const contactRoutes = require('./routes/contact');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security & parsing
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// CORS - restrict in production
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: FRONTEND_ORIGIN }));

// Rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || '50', 10),
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Routes
app.use('/api/contact', contactRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Optional: avoid mongoose deprecation warnings for strictQuery if you want explicit behavior
// mongoose.set('strictQuery', true); // or false, depending on your preference

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('FATAL: MONGO_URI missing in environment. Exiting.');
  process.exit(1);
}

// Start the Express server
function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} (${NODE_ENV})`);
  });
}

// Try to connect to MongoDB, but allow continuing in development when desired.
async function connectAndStart() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('📦 Connected to MongoDB');
    startServer();
  } catch (err) {
    console.error('MongoDB connection error:', err);
    // Control behavior via EXIT_ON_DB_FAILURE env var (set to 'false' to continue without DB)
    const exitOnDbFail = process.env.EXIT_ON_DB_FAILURE !== 'false';
    if (exitOnDbFail) {
      process.exit(1);
    } else {
      console.warn('Continuing without MongoDB because EXIT_ON_DB_FAILURE=false');
      startServer();
    }
  }
}

connectAndStart();
