// src/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { getGeminiResponse } = require('../services/geminiService');
const { getOpenAIResponse } = require('../services/openaiService');
const { textToSpeech, getAvailableVoices, getAvailableModels } = require('../services/ttsService');

let chatHistory = []; // Lưu lịch sử chat tạm thời trên server

router.post('/send-message', async (req, res) => {
  const { message, provider = 'openai', topic } = req.body; // Include topic information
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    chatHistory.push({ sender: 'user', text: message }); // Thêm tin nhắn của user vào lịch sử
    
    let aiResponse;
    if (provider === 'openai') {
      aiResponse = await getOpenAIResponse(message, chatHistory, topic);
    } else {
      aiResponse = await getGeminiResponse(message, chatHistory, topic);
    }
    
    chatHistory.push({ sender: 'ai', text: aiResponse }); // Thêm tin nhắn của AI vào lịch sử
    res.json({ response: aiResponse, provider });
  } catch (error) {
    console.error(`Error getting ${provider} response:`, error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

// New endpoint to switch AI provider
router.post('/switch-provider', (req, res) => {
  const { provider } = req.body;
  if (!provider || !['gemini', 'openai'].includes(provider)) {
    return res.status(400).json({ error: 'Valid provider (gemini or openai) is required' });
  }
  
  // Clear chat history when switching providers
  chatHistory = [];
  res.json({ message: `Switched to ${provider}`, provider });
});

// Get current provider info
router.get('/provider-info', (req, res) => {
  res.json({ 
    availableProviders: ['gemini', 'openai'],
    currentProvider: 'openai', // Default provider
    chatHistoryLength: chatHistory.length
  });
});

// Text-to-Speech endpoint
router.post('/text-to-speech', async (req, res) => {
  const { text, voice = 'alloy', model = 'tts-1' } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  try {
    const audioBuffer = await textToSpeech(text, voice, model);
    
    // Set appropriate headers for audio response
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    
    res.send(audioBuffer);
  } catch (error) {
    console.error('TTS Error:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

// Get TTS options
router.get('/tts-options', (req, res) => {
  res.json({
    voices: getAvailableVoices(),
    models: getAvailableModels()
  });
});

module.exports = router;