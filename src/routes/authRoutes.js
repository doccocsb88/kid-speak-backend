const express = require('express');
const databaseService = require('../services/mockDatabaseService');
const { validateRegistration, validateLogin } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register endpoint
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { email, password, username, languagePreference } = req.body;
    
    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng',
        error: 'EMAIL_EXISTS'
      });
    }
    
    // Create new user
    const newUser = await databaseService.createUser({
      email,
      password,
      name: username,
      languagePreference
    });
    
    // Generate JWT token
    const token = await databaseService.generateToken(newUser);
    
    // Create user preferences
    await databaseService.createUserPreferences(newUser.id, {
      preferredTopics: [],
      difficultyPreference: 'beginner',
      notificationSettings: {},
      learningGoals: ''
    });
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          age: newUser.age,
          languagePreference: newUser.language_preference,
          createdAt: newUser.created_at
        },
        token
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

// Login endpoint
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials
    const user = await databaseService.validatePassword(email, password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không đúng',
        error: 'INVALID_CREDENTIALS'
      });
    }
    
    // Generate JWT token
    const token = await databaseService.generateToken(user);
    
    // Get user preferences
    const preferences = await databaseService.getUserPreferences(user.id);
    
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          languagePreference: user.language_preference,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at
        },
        preferences: preferences || {
          preferredTopics: [],
          difficultyPreference: 'beginner',
          notificationSettings: {},
          learningGoals: ''
        },
        token
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

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user info
    const user = await databaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Get user preferences
    const preferences = await databaseService.getUserPreferences(userId);
    
    // Get user stats
    const stats = await databaseService.getUserStats(userId);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          languagePreference: user.language_preference,
          avatarUrl: user.avatar_url,
          createdAt: user.created_at
        },
        preferences: preferences || {
          preferredTopics: [],
          difficultyPreference: 'beginner',
          notificationSettings: {},
          learningGoals: ''
        },
        stats: stats || {
          totalSessions: 0,
          totalMessages: 0,
          avgSatisfaction: 0,
          topicsLearned: 0,
          totalScore: 0
        }
      }
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin profile',
      error: error.message
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, languagePreference, avatarUrl } = req.body;
    
    // Update user info (mock implementation)
    const user = await databaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Update user in mock database
    user.name = username;
    user.language_preference = languagePreference;
    user.avatar_url = avatarUrl;
    user.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          age: user.age,
          language_preference: user.language_preference,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        }
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật profile',
      error: error.message
    });
  }
});

// Update user preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferredTopics, difficultyPreference, notificationSettings, learningGoals } = req.body;
    
    const preferences = await databaseService.createUserPreferences(userId, {
      preferredTopics,
      difficultyPreference,
      notificationSettings,
      learningGoals
    });
    
    res.json({
      success: true,
      message: 'Cập nhật tùy chọn thành công',
      data: {
        preferences
      }
    });
    
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật tùy chọn',
      error: error.message
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password hash (mock implementation)
    const user = await databaseService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
        error: 'USER_NOT_FOUND'
      });
    }
    
    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không đúng',
        error: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in mock database
    user.password_hash = newPasswordHash;
    user.updated_at = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu',
      error: error.message
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token from storage
    res.json({
      success: true,
      message: 'Đăng xuất thành công'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất',
      error: error.message
    });
  }
});

module.exports = router;
