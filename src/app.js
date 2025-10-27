// src/app.js
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const testAuthRoutes = require('./routes/testAuthRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// CORS configuration for both local and production environments
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',  // Local development
      'http://127.0.0.1:3000',  // Alternative local development
      'https://kid-speak-frontend.vercel.app',  // Production frontend (if deployed)
      'https://kid-speak.vercel.app',  // Alternative production frontend
      'https://kid-speak-fontend-lrzqgpm64-vu-van-hais-projects.vercel.app',  // Current deployed frontend
      // Add your frontend domain here when deployed
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // For development, allow any localhost origin
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else if (origin.includes('vercel.app')) {
        // Allow any Vercel deployment for flexibility
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions)); // Apply CORS configuration
app.use(express.json()); // Cho phép Express đọc JSON từ request body

// Routes
app.use('/api/chat', chatRoutes); // Mọi request đến /api/chat sẽ được xử lý bởi chatRoutes
app.use('/api/auth', authRoutes); // Use real auth routes
app.use('/api/test-auth', testAuthRoutes); // Test authentication routes
app.use('/api/health', healthRoutes); // Health check routes

// Basic health check (optional)
app.get('/', (req, res) => {
  res.send('KidsSpeak Backend is running!');
});

module.exports = app;