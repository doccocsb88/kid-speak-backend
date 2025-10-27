// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { getGeminiResponse } = require('../services/geminiService');
const { getOpenAIResponse, getOpenAIResponseV2 } = require('../services/openaiService');
const { textToSpeech, getAvailableVoices, getAvailableModels } = require('../services/ttsService');
const databaseService = require('../services/databaseService');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateChatMessage } = require('../middleware/validation');

// Store chat history per user session (in-memory for now)
const userChatHistory = new Map();

// Start new chat session
router.post('/start-session', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topic, difficultyLevel = 'beginner' } = req.body;
    
    // Create new chat session in database
    const session = await databaseService.createChatSession(userId, topic, difficultyLevel);
    
    // Clear in-memory chat history for this user
    userChatHistory.set(userId, []);
    
    res.json({
      success: true,
      message: 'Bắt đầu phiên trò chuyện mới',
      data: {
        sessionId: session.id,
        topic: session.topic,
        difficultyLevel: session.difficulty_level,
        createdAt: session.created_at
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi bắt đầu phiên trò chuyện',
      error: error.message
    });
  }
});

// Send message with authentication
router.post('/send-message', optionalAuth, validateChatMessage, async (req, res) => {
  try {
    const { 
      message, 
      provider = 'openai', 
      topic, 
      difficultyLevel = 'beginner', 
      includeAudio = false, 
      voice = 'alloy', 
      model = 'gpt-4o-mini-tts', // NEW: Default to gpt-4o-mini-tts for instructions support
      options = null, // Accept options from client
      chatHistory: clientChatHistory = null, // NEW: Accept chatHistory from client
      userInfo: clientUserInfo = null // NEW: Accept userInfo from client
    } = req.body;
    const userId = req.user?.id; // Optional authentication
    
    // Use client chatHistory if provided, otherwise use server-side history
    let chatHistory = clientChatHistory || userChatHistory.get(userId) || [];
    
    // Add user message to history
    chatHistory.push({ sender: 'user', text: message });
    
    // Prepare user info for AI services
    // Prioritize client-provided userInfo, then fallback to authenticated user, then default
    const userInfo = clientUserInfo || (userId ? {
      id: userId,
      name: req.user.name,
      age: req.user.age || 8 // Default age for kids
    } : {
      name: 'Guest',
      age: 8
    });
    
    // Debug logging after variables are initialized
    console.log('[chatRoutes] ========== RECEIVED REQUEST ==========');
    console.log('[chatRoutes] typeof topic:', typeof topic);
    console.log('[chatRoutes] topic:', topic);
    console.log('[chatRoutes] topic?.id:', topic?.id);
    console.log('[chatRoutes] topic?.title:', topic?.title);
    console.log('[chatRoutes] userInfo:', userInfo);
    console.log('[chatRoutes] ======================================');
    
    // Get AI response
    let aiResponse;
    let responseData = {};
    
    if (provider === 'openai') {
      if (includeAudio) {
        // Use V2 function that includes audio with custom voice, model, and options
        const responseWithAudio = await getOpenAIResponseV2(message, chatHistory, topic, userInfo, false, voice, model, options);
        aiResponse = responseWithAudio.text;
        responseData = {
          response: aiResponse,
          audio: responseWithAudio.audio,
          audioFormat: responseWithAudio.audioFormat,
          voice: responseWithAudio.voice,
          model: responseWithAudio.model,
          engagementLevel: responseWithAudio.engagementLevel,
          style: responseWithAudio.style,
          options: responseWithAudio.options
        };
      } else {
        // Use regular function with options
        const responseWithoutAudio = await getOpenAIResponse(message, chatHistory, topic, userInfo, false, options);
        aiResponse = responseWithoutAudio.text;
        responseData = {
          response: aiResponse,
          audio: responseWithoutAudio.audio,
          audioFormat: responseWithoutAudio.audioFormat,
          voice: responseWithoutAudio.voice,
          model: responseWithoutAudio.model,
          engagementLevel: responseWithoutAudio.engagementLevel,
          style: responseWithoutAudio.style,
          options: responseWithoutAudio.options
        };
      }
    } else {
      aiResponse = await getGeminiResponse(message, chatHistory, topic, userInfo);
      responseData = {
        response: aiResponse,
        audio: null,
        audioFormat: null,
        voice: null,
        model: null
      };
    }
    
    // Add AI response to history
    chatHistory.push({ sender: 'ai', text: aiResponse });
    
    // Update in-memory history only if client didn't provide chatHistory
    if (userId && !clientChatHistory) {
      userChatHistory.set(userId, chatHistory);
    }
    
    // Save messages to database if user is authenticated
    if (userId) {
      // Get current session or create new one
      let sessionId = req.body.sessionId;
      if (!sessionId) {
        const session = await databaseService.createChatSession(userId, topic, difficultyLevel);
        sessionId = session.id;
      }
      
      // Save user message
      await databaseService.saveMessage(sessionId, 'user', message);
      
      // Save AI response
      await databaseService.saveMessage(sessionId, 'assistant', aiResponse);
    }
    
    res.json({
      success: true,
      data: {
        ...responseData,
        provider,
        sessionId: userId ? req.body.sessionId : null,
        chatHistoryLength: chatHistory.length,
        includeAudio: includeAudio
      }
    });
    
  } catch (error) {
    console.error(`Error getting ${req.body.provider || 'openai'} response:`, error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy phản hồi từ AI',
      error: error.message
    });
  }
});

// Switch AI provider
router.post('/switch-provider', optionalAuth, (req, res) => {
  const { provider } = req.body;
  if (!provider || !['gemini', 'openai'].includes(provider)) {
    return res.status(400).json({ 
      success: false,
      message: 'Provider hợp lệ (gemini hoặc openai) là bắt buộc',
      error: 'INVALID_PROVIDER'
    });
  }
  
  // Clear chat history when switching providers
  const userId = req.user?.id;
  if (userId) {
    userChatHistory.delete(userId);
  }
  
  res.json({ 
    success: true,
    message: `Chuyển sang ${provider} thành công`,
    data: { provider }
  });
});

// Get current provider info
router.get('/provider-info', optionalAuth, (req, res) => {
  const userId = req.user?.id;
  const chatHistory = userId ? userChatHistory.get(userId) || [] : [];
  
  res.json({ 
    success: true,
    data: {
      availableProviders: ['gemini', 'openai'],
      currentProvider: 'openai', // Default provider
      chatHistoryLength: chatHistory.length,
      isAuthenticated: !!userId
    }
  });
});

// Text-to-Speech endpoint
router.post('/text-to-speech', async (req, res) => {
  const { 
    text, 
    voice = 'alloy', 
    model = 'gpt-4o-mini-tts',
    options = null, // Accept options for TTS instructions
    engagementLevel = 'CORE',
    style = 'default'
  } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  try {
    // Build TTS options with conversation context
    const ttsOptions = {
      conversationOptions: options || {},
      engagementLevel: engagementLevel,
      style: style
    };
    
    const audioBuffer = await textToSpeech(text, voice, model, ttsOptions);
    
    // Set appropriate headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech', message: error.message });
  }
});

// Get TTS options
router.get('/tts-options', (req, res) => {
  try {
    const voices = getAvailableVoices();
    const models = getAvailableModels();
    
    res.json({
      success: true,
      data: {
        voices: voices,
        models: models
      }
    });
  } catch (error) {
    console.error('Error getting TTS options:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy tùy chọn TTS',
      error: error.message 
    });
  }
});

// Get user's chat sessions (authenticated users only)
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    
    const sessions = await databaseService.getUserChatSessions(userId, parseInt(limit), parseInt(offset));
    
    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: sessions.length
        }
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách phiên trò chuyện',
      error: error.message
    });
  }
});

// Get chat messages for a specific session
router.get('/sessions/:sessionId/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;
    
    // Verify session belongs to user
    const session = await databaseService.getChatSession(sessionId, userId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phiên trò chuyện',
        error: 'SESSION_NOT_FOUND'
      });
    }
    
    const messages = await databaseService.getChatMessages(sessionId, userId, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        session,
        messages
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy tin nhắn',
      error: error.message
    });
  }
});

// End chat session
router.post('/sessions/:sessionId/end', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { satisfaction } = req.body;
    
    const session = await databaseService.endChatSession(sessionId, userId, satisfaction);
    
    // Clear in-memory chat history for this user
    userChatHistory.delete(userId);
    
    res.json({
      success: true,
      message: 'Kết thúc phiên trò chuyện thành công',
      data: {
        session
      }
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi kết thúc phiên trò chuyện',
      error: error.message
    });
  }
});

// Clear chat history for current user
router.post('/clear-history', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    
    // Clear in-memory chat history
    userChatHistory.delete(userId);
    
    res.json({
      success: true,
      message: 'Xóa lịch sử trò chuyện thành công'
    });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa lịch sử trò chuyện',
      error: error.message
    });
  }
});

module.exports = router;