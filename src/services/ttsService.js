// src/services/ttsService.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert text to speech using OpenAI's TTS API
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer)
 * @param {string} model - The model to use (tts-1, tts-1-hd)
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function textToSpeech(text, voice = 'alloy', model = 'tts-1') {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    const response = await openai.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: 'mp3',
    });

    // Convert the response to buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    throw new Error(`TTS generation failed: ${error.message}`);
  }
}

/**
 * Get available voices for TTS
 * @returns {Array<string>} - Array of available voice names
 */
function getAvailableVoices() {
  return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
}

/**
 * Get available models for TTS
 * @returns {Array<string>} - Array of available model names
 */
function getAvailableModels() {
  return ['tts-1', 'tts-1-hd'];
}

module.exports = {
  textToSpeech,
  getAvailableVoices,
  getAvailableModels,
};
