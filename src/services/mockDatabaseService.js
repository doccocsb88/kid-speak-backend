// src/services/mockDatabaseService.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class MockDatabaseService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.users = new Map(); // In-memory storage for testing
    this.userPreferences = new Map();
    this.nextUserId = 1;
  }

  // User operations
  async createUser(userData) {
    const { email, password, name, languagePreference } = userData;
    
    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('Email already exists');
    }
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const user = {
      id: `user-${this.nextUserId++}`,
      email,
      password_hash: passwordHash,
      name: name || null,
      age: null,
      language_preference: languagePreference || 'vi',
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.users.set(email, user);
    return user;
  }

  async getUserByEmail(email) {
    return this.users.get(email) || null;
  }

  async getUserById(id) {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return null;
  }

  async validatePassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return null;
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    return isValid ? user : null;
  }

  async generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name
    };
    
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
  }

  async verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // User preferences operations
  async createUserPreferences(userId, preferences) {
    const prefs = {
      id: `pref-${userId}`,
      user_id: userId,
      preferred_topics: preferences.preferredTopics || [],
      difficulty_preference: preferences.difficultyPreference || 'beginner',
      notification_settings: preferences.notificationSettings || {},
      learning_goals: preferences.learningGoals || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.userPreferences.set(userId, prefs);
    return prefs;
  }

  async getUserPreferences(userId) {
    return this.userPreferences.get(userId) || null;
  }

  // Mock stats for testing
  async getUserStats(userId) {
    return {
      totalSessions: 0,
      totalMessages: 0,
      avgSatisfaction: 0,
      topicsLearned: 0,
      totalScore: 0
    };
  }

  // Chat session operations (mock)
  async createChatSession(userId, topic, difficultyLevel = 'beginner') {
    return {
      id: `session-${Date.now()}`,
      user_id: userId,
      topic,
      difficulty_level: difficultyLevel,
      session_status: 'active',
      created_at: new Date().toISOString(),
      ended_at: null,
      total_messages: 0,
      user_satisfaction: null
    };
  }

  async getChatSession(sessionId, userId) {
    return {
      id: sessionId,
      user_id: userId,
      topic: 'Test Topic',
      difficulty_level: 'beginner',
      session_status: 'active',
      created_at: new Date().toISOString(),
      ended_at: null,
      total_messages: 0,
      user_satisfaction: null,
      user_name: 'Test User'
    };
  }

  async getUserChatSessions(userId, limit = 20, offset = 0) {
    return [];
  }

  async createChatMessage(sessionId, role, content, messageType = 'text') {
    return {
      id: `msg-${Date.now()}`,
      session_id: sessionId,
      role,
      content,
      message_type: messageType,
      audio_url: null,
      timestamp: new Date().toISOString(),
      is_corrected: false,
      correction_feedback: null
    };
  }

  async getChatMessages(sessionId, limit = 50, offset = 0) {
    return [];
  }

  async updateChatSession(sessionId, updates) {
    return {
      id: sessionId,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }

  // User progress operations (mock)
  async createUserProgress(userId, topic, level = 1) {
    return {
      id: `progress-${Date.now()}`,
      user_id: userId,
      topic,
      level,
      score: 0,
      total_sessions: 0,
      completed_sessions: 0,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  async getUserProgress(userId, topic) {
    return null;
  }

  async updateUserProgress(userId, topic, updates) {
    return {
      id: `progress-${Date.now()}`,
      user_id: userId,
      topic,
      level: 1,
      score: 0,
      total_sessions: 0,
      completed_sessions: 0,
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...updates
    };
  }
}

module.exports = new MockDatabaseService();
