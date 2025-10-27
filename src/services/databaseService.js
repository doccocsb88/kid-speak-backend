const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class DatabaseService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
  }

  // User operations
  async createUser(userData) {
    const { email, password, name, languagePreference } = userData;
    
    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (email, password_hash, name, language_preference)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, name, age, language_preference, created_at
    `;
    const values = [email, passwordHash, name, languagePreference || 'vi'];
    
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Email already exists');
      }
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND is_active = true';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async getUserById(id) {
    const query = 'SELECT id, email, name, age, language_preference, avatar_url, created_at FROM users WHERE id = $1 AND is_active = true';
    const result = await pool.query(query, [id]);
    return result.rows[0];
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

  // Chat session operations
  async createChatSession(userId, topic, difficultyLevel = 'beginner') {
    const query = `
      INSERT INTO chat_sessions (user_id, topic, difficulty_level)
      VALUES ($1, $2, $3)
      RETURNING id, topic, difficulty_level, created_at
    `;
    const result = await pool.query(query, [userId, topic, difficultyLevel]);
    return result.rows[0];
  }

  async getChatSession(sessionId, userId) {
    const query = `
      SELECT cs.*, u.name as user_name 
      FROM chat_sessions cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.id = $1 AND cs.user_id = $2
    `;
    const result = await pool.query(query, [sessionId, userId]);
    return result.rows[0];
  }

  async getUserChatSessions(userId, limit = 20, offset = 0) {
    const query = `
      SELECT cs.*, 
             COUNT(cm.id) as message_count,
             MAX(cm.timestamp) as last_message_time
      FROM chat_sessions cs
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cs.user_id = $1
      GROUP BY cs.id
      ORDER BY cs.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows;
  }

  async endChatSession(sessionId, userId, satisfaction = null) {
    const query = `
      UPDATE chat_sessions 
      SET session_status = 'completed', 
          ended_at = NOW(),
          user_satisfaction = $3
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [sessionId, userId, satisfaction]);
    return result.rows[0];
  }

  // Chat message operations
  async saveMessage(sessionId, role, content, messageType = 'text', audioUrl = null) {
    const query = `
      INSERT INTO chat_messages (session_id, role, content, message_type, audio_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, timestamp
    `;
    const result = await pool.query(query, [sessionId, role, content, messageType, audioUrl]);
    
    // Update session message count
    await pool.query(
      'UPDATE chat_sessions SET total_messages = total_messages + 1 WHERE id = $1',
      [sessionId]
    );
    
    return result.rows[0];
  }

  async getChatMessages(sessionId, userId, limit = 50) {
    const query = `
      SELECT cm.* 
      FROM chat_messages cm
      JOIN chat_sessions cs ON cm.session_id = cs.id
      WHERE cm.session_id = $1 AND cs.user_id = $2
      ORDER BY cm.timestamp ASC
      LIMIT $3
    `;
    const result = await pool.query(query, [sessionId, userId, limit]);
    return result.rows;
  }

  async updateMessageCorrection(messageId, isCorrected, correctionFeedback = null) {
    const query = `
      UPDATE chat_messages 
      SET is_corrected = $2, correction_feedback = $3
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [messageId, isCorrected, correctionFeedback]);
    return result.rows[0];
  }

  // User progress operations
  async updateUserProgress(userId, topic, score, isCompleted = false) {
    const query = `
      INSERT INTO user_progress (user_id, topic, score, total_sessions, completed_sessions)
      VALUES ($1, $2, $3, 1, $4)
      ON CONFLICT (user_id, topic) 
      DO UPDATE SET 
        score = user_progress.score + $3,
        total_sessions = user_progress.total_sessions + 1,
        completed_sessions = user_progress.completed_sessions + $4,
        last_activity = NOW(),
        updated_at = NOW()
      RETURNING *
    `;
    const result = await pool.query(query, [userId, topic, score, isCompleted ? 1 : 0]);
    return result.rows[0];
  }

  async getUserProgress(userId) {
    const query = `
      SELECT topic, level, score, total_sessions, completed_sessions, last_activity
      FROM user_progress
      WHERE user_id = $1
      ORDER BY last_activity DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // User preferences operations
  async createUserPreferences(userId, preferences) {
    const { preferredTopics, difficultyPreference, notificationSettings, learningGoals } = preferences;
    
    const query = `
      INSERT INTO user_preferences (user_id, preferred_topics, difficulty_preference, notification_settings, learning_goals)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        preferred_topics = $2,
        difficulty_preference = $3,
        notification_settings = $4,
        learning_goals = $5,
        updated_at = NOW()
      RETURNING *
    `;
    
    const values = [
      userId, 
      preferredTopics || [], 
      difficultyPreference || 'beginner',
      JSON.stringify(notificationSettings || {}),
      learningGoals
    ];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getUserPreferences(userId) {
    const query = 'SELECT * FROM user_preferences WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Analytics and reporting
  async getUserStats(userId) {
    const query = `
      SELECT 
        COUNT(DISTINCT cs.id) as total_sessions,
        COUNT(DISTINCT cm.id) as total_messages,
        AVG(cs.user_satisfaction) as avg_satisfaction,
        COUNT(DISTINCT up.topic) as topics_learned,
        SUM(up.score) as total_score
      FROM users u
      LEFT JOIN chat_sessions cs ON u.id = cs.user_id
      LEFT JOIN chat_messages cm ON cs.id = cm.session_id
      LEFT JOIN user_progress up ON u.id = up.user_id
      WHERE u.id = $1
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Health check
  async healthCheck() {
    try {
      await pool.query('SELECT 1');
      return { status: 'healthy', database: 'connected' };
    } catch (error) {
      return { status: 'unhealthy', database: 'disconnected', error: error.message };
    }
  }
}

module.exports = new DatabaseService();
