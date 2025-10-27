const { body, validationResult } = require('express-validator');

// Validation middleware for registration
const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên người dùng phải có từ 2 đến 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ0-9\s_]+$/)
    .withMessage('Tên người dùng chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch dưới'),
  
  body('age')
    .optional()
    .isInt({ min: 3, max: 18 })
    .withMessage('Tuổi phải từ 3 đến 18'),
  
  body('languagePreference')
    .optional()
    .isIn(['vi', 'en'])
    .withMessage('Ngôn ngữ chỉ được là vi hoặc en'),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Validation middleware for login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu không được để trống'),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Validation middleware for profile update
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Tên người dùng phải có từ 2 đến 50 ký tự')
    .matches(/^[a-zA-ZÀ-ỹ0-9\s_]+$/)
    .withMessage('Tên người dùng chỉ được chứa chữ cái, số, khoảng trắng và dấu gạch dưới'),
  
  body('age')
    .optional()
    .isInt({ min: 3, max: 18 })
    .withMessage('Tuổi phải từ 3 đến 18'),
  
  body('languagePreference')
    .optional()
    .isIn(['vi', 'en'])
    .withMessage('Ngôn ngữ chỉ được là vi hoặc en'),
  
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('URL avatar không hợp lệ'),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Validation middleware for password change
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mật khẩu hiện tại không được để trống'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu mới phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số'),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

// Validation middleware for chat message
const validateChatMessage = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Tin nhắn không được để trống')
    .isLength({ max: 1000 })
    .withMessage('Tin nhắn không được quá 1000 ký tự'),
  
  // Topic is now an object, not a string - skip validation or validate as object
  body('topic')
    .optional()
    .custom((value) => {
      // Allow null, undefined, or object with id field
      if (value === null || value === undefined) return true;
      if (typeof value === 'object' && (value.id || value.title)) return true;
      throw new Error('Topic must be an object with id or title field');
    }),
  
  body('difficultyLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Độ khó chỉ được là beginner, intermediate hoặc advanced'),
  
  // Handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: errors.array().map(error => ({
          field: error.path,
          message: error.msg
        }))
      });
    }
    next();
  }
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validateChatMessage
};
