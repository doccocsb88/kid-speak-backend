// src/routes/testAuthRoutes.js
const express = require('express');
const router = express.Router();

// Simple test registration endpoint (without database)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, age } = req.body;
    
    // Simple validation
    if (!email || !password || !name || !age) {
      return res.status(400).json({
        success: false,
        message: 'Tất cả các trường là bắt buộc',
        error: 'MISSING_FIELDS'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
        error: 'WEAK_PASSWORD'
      });
    }
    
    // Mock successful registration
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công (test mode)',
      data: {
        user: {
          id: 'test-user-id',
          email: email,
          name: name,
          age: age,
          languagePreference: 'vi',
          createdAt: new Date().toISOString()
        },
        token: 'test-jwt-token'
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký',
      error: error.message
    });
  }
});

// Simple test login endpoint (without database)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email và mật khẩu là bắt buộc',
        error: 'MISSING_CREDENTIALS'
      });
    }
    
    // Mock successful login
    res.json({
      success: true,
      message: 'Đăng nhập thành công (test mode)',
      data: {
        user: {
          id: 'test-user-id',
          email: email,
          name: 'Test User',
          age: 10,
          languagePreference: 'vi',
          avatarUrl: null,
          createdAt: new Date().toISOString()
        },
        preferences: {
          preferredTopics: [],
          difficultyPreference: 'beginner',
          notificationSettings: {},
          learningGoals: ''
        },
        token: 'test-jwt-token'
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập',
      error: error.message
    });
  }
});

module.exports = router;
