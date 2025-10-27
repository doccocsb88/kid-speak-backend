# KidSpeak Authentication API Documentation

## Overview
This document describes the authentication API endpoints for the KidSpeak application.

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-backend-url.vercel.app/api`

## Authentication
Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication Routes (`/api/auth`)

#### 1. Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "John Doe",
  "age": 10,
  "languagePreference": "vi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "age": 10,
      "languagePreference": "vi",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

#### 2. Login User
**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "age": 10,
      "languagePreference": "vi",
      "avatarUrl": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "preferences": {
      "preferredTopics": [],
      "difficultyPreference": "beginner",
      "notificationSettings": {},
      "learningGoals": ""
    },
    "token": "jwt-token"
  }
}
```

#### 3. Get User Profile
**GET** `/api/auth/profile`

Get current user's profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "age": 10,
      "languagePreference": "vi",
      "avatarUrl": null,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "preferences": {
      "preferredTopics": [],
      "difficultyPreference": "beginner",
      "notificationSettings": {},
      "learningGoals": ""
    },
    "stats": {
      "totalSessions": 5,
      "totalMessages": 50,
      "avgSatisfaction": 4.2,
      "topicsLearned": 3,
      "totalScore": 150
    }
  }
}
```

#### 4. Update User Profile
**PUT** `/api/auth/profile`

Update user profile information.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "age": 11,
  "languagePreference": "en",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật profile thành công",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Smith",
      "age": 11,
      "languagePreference": "en",
      "avatarUrl": "https://example.com/avatar.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### 5. Update User Preferences
**PUT** `/api/auth/preferences`

Update user preferences and settings.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "preferredTopics": ["animals", "colors", "numbers"],
  "difficultyPreference": "intermediate",
  "notificationSettings": {
    "emailNotifications": true,
    "pushNotifications": false
  },
  "learningGoals": "Learn basic English vocabulary"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật tùy chọn thành công",
  "data": {
    "preferences": {
      "id": "uuid",
      "userId": "uuid",
      "preferredTopics": ["animals", "colors", "numbers"],
      "difficultyPreference": "intermediate",
      "notificationSettings": {
        "emailNotifications": true,
        "pushNotifications": false
      },
      "learningGoals": "Learn basic English vocabulary",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### 6. Change Password
**PUT** `/api/auth/change-password`

Change user password.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đổi mật khẩu thành công"
}
```

#### 7. Logout
**POST** `/api/auth/logout`

Logout user (client-side token removal).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

### Chat Routes (`/api/chat`)

#### 1. Start Chat Session
**POST** `/api/chat/start-session`

Start a new chat session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "topic": "Animals",
  "difficultyLevel": "beginner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bắt đầu phiên trò chuyện mới",
  "data": {
    "sessionId": "uuid",
    "topic": "Animals",
    "difficultyLevel": "beginner",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Send Message
**POST** `/api/chat/send-message`

Send a message in chat (works with or without authentication).

**Headers (Optional):**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "provider": "openai",
  "topic": "Animals",
  "difficultyLevel": "beginner",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hello! I'm doing great, thank you for asking!",
    "provider": "openai",
    "sessionId": "uuid",
    "chatHistoryLength": 2
  }
}
```

#### 3. Get Chat Sessions
**GET** `/api/chat/sessions`

Get user's chat sessions.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 20)
- `offset` (optional): Number of sessions to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "uuid",
        "topic": "Animals",
        "difficultyLevel": "beginner",
        "sessionStatus": "active",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "endedAt": null,
        "totalMessages": 5,
        "userSatisfaction": null,
        "messageCount": 5,
        "lastMessageTime": "2024-01-15T10:35:00.000Z"
      }
    ],
    "pagination": {
      "limit": 20,
      "offset": 0,
      "total": 1
    }
  }
}
```

#### 4. Get Chat Messages
**GET** `/api/chat/sessions/:sessionId/messages`

Get messages for a specific chat session.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "uuid",
      "topic": "Animals",
      "difficultyLevel": "beginner",
      "sessionStatus": "active",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "endedAt": null,
      "totalMessages": 2,
      "userSatisfaction": null,
      "userName": "John Doe"
    },
    "messages": [
      {
        "id": "uuid",
        "role": "user",
        "content": "Hello, how are you?",
        "messageType": "text",
        "audioUrl": null,
        "timestamp": "2024-01-15T10:30:00.000Z",
        "isCorrected": false,
        "correctionFeedback": null
      },
      {
        "id": "uuid",
        "role": "assistant",
        "content": "Hello! I'm doing great, thank you for asking!",
        "messageType": "text",
        "audioUrl": null,
        "timestamp": "2024-01-15T10:30:05.000Z",
        "isCorrected": false,
        "correctionFeedback": null
      }
    ]
  }
}
```

#### 5. End Chat Session
**POST** `/api/chat/sessions/:sessionId/end`

End a chat session.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "satisfaction": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Kết thúc phiên trò chuyện thành công",
  "data": {
    "session": {
      "id": "uuid",
      "topic": "Animals",
      "difficultyLevel": "beginner",
      "sessionStatus": "completed",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "endedAt": "2024-01-15T10:35:00.000Z",
      "totalMessages": 10,
      "userSatisfaction": 5
    }
  }
}
```

#### 6. Clear Chat History
**POST** `/api/chat/clear-history`

Clear in-memory chat history for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Xóa lịch sử trò chuyện thành công"
}
```

### Health Check Routes (`/api/health`)

#### 1. Health Check
**GET** `/api/health/health`

Check application and database health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "uptime": 3600
}
```

#### 2. Database Info
**GET** `/api/health/db-info`

Get database information and statistics.

**Response:**
```json
{
  "database_version": "PostgreSQL 15.0",
  "table_count": 5,
  "pool_info": {
    "totalCount": 10,
    "idleCount": 8,
    "waitingCount": 0
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message in Vietnamese",
  "error": "ERROR_CODE"
}
```

**Common Error Codes:**
- `EMAIL_EXISTS`: Email already registered
- `INVALID_CREDENTIALS`: Wrong email or password
- `INVALID_TOKEN`: Invalid or expired JWT token
- `AUTHENTICATION_REQUIRED`: Token required but not provided
- `USER_NOT_FOUND`: User doesn't exist
- `SESSION_NOT_FOUND`: Chat session doesn't exist
- `INVALID_PROVIDER`: Invalid AI provider
- `VALIDATION_ERROR`: Input validation failed

## Testing

Run the authentication tests:
```bash
npm run test-auth
```

This will test all authentication endpoints and chat functionality.

## Security Notes

1. **Password Requirements**: Minimum 6 characters with at least 1 lowercase, 1 uppercase, and 1 number
2. **JWT Expiration**: Tokens expire after 7 days
3. **Password Hashing**: Uses bcrypt with salt rounds of 10
4. **Input Validation**: All inputs are validated and sanitized
5. **CORS**: Configured for specific origins only
