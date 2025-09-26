// src/app.js
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');

const app = express();

// Middleware
app.use(cors()); // Cho phép các domain khác (frontend) truy cập
app.use(express.json()); // Cho phép Express đọc JSON từ request body

// Routes
app.use('/api/chat', chatRoutes); // Mọi request đến /api/chat sẽ được xử lý bởi chatRoutes

// Basic health check (optional)
app.get('/', (req, res) => {
  res.send('KidsSpeak Backend is running!');
});

module.exports = app;