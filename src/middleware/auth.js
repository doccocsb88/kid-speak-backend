const jwt = require('jsonwebtoken');
const databaseService = require('../services/databaseService');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token không được cung cấp',
        error: 'NO_TOKEN'
      });
    }
    
    // Verify token
    const decoded = await databaseService.verifyToken(token);
    
    // Check if user still exists and is active
    const user = await databaseService.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc người dùng không tồn tại',
        error: 'INVALID_TOKEN'
      });
    }
    
    // Add user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
      error: 'INVALID_TOKEN'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = await databaseService.verifyToken(token);
      const user = await databaseService.getUserById(decoded.id);
      
      if (user) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.name
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Middleware to check if user is authenticated (for protected routes)
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Cần đăng nhập để truy cập tính năng này',
      error: 'AUTHENTICATION_REQUIRED'
    });
  }
  next();
};

// Middleware to check user role (if you implement roles later)
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Cần đăng nhập để truy cập tính năng này',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // For now, all users have the same role
    // You can extend this later with a roles system
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAuth,
  requireRole
};
