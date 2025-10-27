// src/services/ttsService.js
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Build TTS instructions from options and engagement metadata
 * @param {object} opts - Sanitized options from client
 * @param {string} engagementLevel - Current engagement level (WARM_UP, CORE, CHALLENGE, REENGAGE, WRAP_UP)
 * @param {string} style - Voice style hint
 * @returns {string} - Natural language instructions for TTS model
 */
function buildTTSInstructions(opts = {}, engagementLevel = 'CORE', style = 'default') {
  const instructions = [];

  // 1. Speaking rate & pacing
  if (opts.speaking_rate === 'slow') {
    instructions.push('Speak slowly and clearly, suitable for young children learning English.');
  } else if (opts.speaking_rate === 'fast') {
    instructions.push('Speak at a brisk, energetic pace.');
  } else {
    instructions.push('Speak at a moderate, natural pace.');
  }

  // 2. Pauses between sentences
  if (opts.pause_ms_between_sentences >= 500) {
    instructions.push('Add clear, deliberate pauses between sentences to help comprehension.');
  } else if (opts.pause_ms_between_sentences >= 300) {
    instructions.push('Add natural pauses between sentences.');
  }

  // 3. Tone based on engagement level
  switch (engagementLevel) {
    case 'WARM_UP':
      instructions.push('Use a warm, friendly, welcoming tone to greet the student.');
      break;
    case 'CORE':
      instructions.push('Use a clear, patient, encouraging teaching tone.');
      break;
    case 'CHALLENGE':
      instructions.push('Use an enthusiastic, exciting tone to motivate the student.');
      break;
    case 'REENGAGE':
      instructions.push('Use a playful, energetic, attention-grabbing tone to recapture interest.');
      break;
    case 'WRAP_UP':
      instructions.push('Use a warm, proud, celebratory tone for the summary.');
      break;
    default:
      instructions.push('Use a friendly, encouraging tone.');
  }

  // 4. Emotional qualities based on age and pedagogy
  const age = opts.age_gate || 6;
  if (age <= 7) {
    instructions.push('Use gentle, nurturing intonation like speaking to a young child.');
  } else if (age >= 10) {
    instructions.push('Use confident, clear intonation suitable for pre-teens.');
  }

  // 5. Additional modifiers from options
  if (opts.reengage_style === 'playful' && engagementLevel === 'REENGAGE') {
    instructions.push('Add playful, sing-song quality to grab attention.');
  } else if (opts.reengage_style === 'calm') {
    instructions.push('Maintain a calm, steady rhythm.');
  }

  // 6. Phonics/pronunciation emphasis
  if (opts.phonics_hints || opts.ipa_pronunciation) {
    instructions.push('Emphasize clear pronunciation of each word, especially key vocabulary.');
  }

  return instructions.join(' ');
}

/**
 * Convert text to speech using OpenAI's TTS API (gpt-4o-mini-tts)
 * @param {string} text - The text to convert to speech
 * @param {string} voice - The voice to use (alloy, echo, fable, onyx, nova, shimmer, ash, sage, coral)
 * @param {string} model - The model to use (default: gpt-4o-mini-tts)
 * @param {object} options - TTS generation options
 * @param {object} options.conversationOptions - Sanitized options from client (speaking_rate, pause_ms, etc.)
 * @param {string} options.engagementLevel - Current engagement level
 * @param {string} options.style - Voice style hint
 * @returns {Promise<Buffer>} - Audio buffer
 */
async function textToSpeech(text, voice = 'alloy', model = 'gpt-4o-mini-tts', options = {}) {
  try {
    // Ensure text is a string
    if (typeof text !== 'string') {
      text = String(text || '');
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required for TTS');
    }

    // Build instructions from options
    const conversationOpts = options.conversationOptions || {};
    const engagementLevel = options.engagementLevel || 'CORE';
    const style = options.style || 'default';
    
    const instructions = buildTTSInstructions(conversationOpts, engagementLevel, style);

    // Log for debugging
    console.log('\n========== TTS REQUEST (gpt-4o-mini-tts) ==========');
    console.log('Voice:', voice);
    console.log('Model:', model);
    console.log('Engagement Level:', engagementLevel);
    console.log('Instructions:', instructions);
    console.log('Text length:', text.length, 'chars');
    console.log('===================================================\n');

    // Call OpenAI TTS API with instructions parameter
    const requestPayload = {
      model: model,
      voice: voice,
      input: text,
      instructions: instructions,
      response_format: 'mp3',
    };

    const response = await openai.audio.speech.create(requestPayload);

    // Convert the response to buffer
    const buffer = Buffer.from(await response.arrayBuffer());
    
    console.log('✅ TTS generation successful. Audio size:', buffer.length, 'bytes\n');
    
    return buffer;
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    throw new Error(`TTS generation failed: ${error.message}`);
  }
}

// Cache for TTS options to prevent repeated function calls
let cachedVoices = null;
let cachedModels = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache duration

/**
 * Get available voices for TTS with caching
 * @returns {Array<string>} - Array of available voice names
 */
function getAvailableVoices() {
  // Check if we have valid cached data
  if (cachedVoices && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
    console.log('📦 Using cached voices');
    return cachedVoices;
  }

  try {
    console.log('Getting available voices...');
    // Valid OpenAI TTS voices as of 2024
    // Reference: https://platform.openai.com/docs/guides/text-to-speech
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'ash', 'sage', 'coral'];
    
    // Cache the result
    cachedVoices = voices;
    cacheTime = Date.now();
    console.log('✅ Voices cached successfully');
    
    return voices;
  } catch (error) {
    console.error('Error in getAvailableVoices:', error);
    throw error;
  }
}

/**
 * Get available models for TTS with caching
 * @returns {Array<string>} - Array of available model names
 */
function getAvailableModels() {
  // Check if we have valid cached data
  if (cachedModels && cacheTime && (Date.now() - cacheTime) < CACHE_DURATION) {
    console.log('📦 Using cached models');
    return cachedModels;
  }

  try {
    console.log('Getting available models...');
    const models = ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts'];
    
    // Cache the result
    cachedModels = models;
    cacheTime = Date.now();
    console.log('✅ Models cached successfully');
    
    return models;
  } catch (error) {
    console.error('Error in getAvailableModels:', error);
    throw error;
  }
}

/**
 * Clear TTS options cache (useful for testing or when options might have changed)
 */
function clearTTSCache() {
  console.log('🗑️ Clearing TTS options cache');
  cachedVoices = null;
  cachedModels = null;
  cacheTime = null;
}

module.exports = {
  textToSpeech,
  buildTTSInstructions,
  getAvailableVoices,
  getAvailableModels,
  clearTTSCache,
};
