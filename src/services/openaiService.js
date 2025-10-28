// src/services/openaiService.js — Multi-Level Engagement AI Teacher v2.2 (Optimized)
// Author: ChatGPT (2025-10-27) — Token-lean, de-duplicated, topic-dynamic, anti-loop hardened
// Backward compatible exports & signatures

require('dotenv').config();
const OpenAI = require('openai');

// ————————————————————————————————————————————————————————————————————————————
// Initialization (lazy)
// ————————————————————————————————————————————————————————————————————————————
let openai = null;
const initializeOpenAI = () => {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

// ————————————————————————————————————————————————————————————————————————————
// Options Schema (lightweight manual validation) — unchanged API
// ————————————————————————————————————————————————————————————————————————————
const OPTIONS_DEFAULT = {
  // Pedagogy
  grammar_check: true,
  force_repeat: 'soft', // 'off' | 'soft' | 'strict'
  correction_mode: 'explicit', // 'implicit' | 'explicit' | 'sandwich'
  difficulty: 'auto', // 'auto' | 'starters' | 'movers' | 'flyers'
  focus: ['vocabulary', 'pronunciation'],
  target_vocab: [],
  min_examples_per_point: 1,

  // Language shaping
  max_sentence_words: 10,
  max_sentences_per_turn: 2,
  bilingual_support: 'off', // 'off' | 'keyword_gloss' | 'brief_hint'
  ipa_pronunciation: false,
  phonics_hints: false,

  // Engagement & game mechanics
  anti_loop: true,
  reengage_after_seconds: 30,
  // Removed: reengage_style, activity_preference, praise_frequency, challenge_ratio

  // Flow & topic control
  topic_strictness: 'normal', // 'loose' | 'normal' | 'strict'
  open_question_ratio: 0.3, // 0..1
  wrap_up_on_turns: 14,

  // Safety & content
  banned_topics: [],
  profanity_filter: true,
  age_gate: 6,

  // Model params
  temperature_base: 0.6,
  frequency_penalty: 0.4,
  presence_penalty: 0.2,

  // Voice (TTS wrappers use these)
  voice_fixed: 'alloy',
  speaking_rate: 'slow',
  pause_ms_between_sentences: 300,
};

const ENUMS = {
  force_repeat: ['off', 'soft', 'strict'],
  correction_mode: ['implicit', 'explicit', 'sandwich'],
  difficulty: ['auto', 'starters', 'movers', 'flyers'],
  focus: ['vocabulary', 'pronunciation', 'grammar', 'listening', 'speaking'],
  bilingual_support: ['off', 'keyword_gloss', 'brief_hint'],
  speaking_rate: ['slow', 'normal', 'fast'],
};
// const VALID_VOICES = ['sparkle', 'breeze', 'meadow', 'ember', 'wave'];
const VALID_VOICES = ['nova', 'shimmer', 'echo', 'onyx', 'fable', 'alloy', 'ash', 'sage', 'coral'];

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const sanitizeOptions = (raw) => {
  const out = { ...OPTIONS_DEFAULT };
  if (!raw || typeof raw !== 'object') return out;
  const pickEnum = (k, v) => (ENUMS[k]?.includes(v) ? v : OPTIONS_DEFAULT[k]);

  if (typeof raw.grammar_check === 'boolean') out.grammar_check = raw.grammar_check;
  if (raw.force_repeat) out.force_repeat = pickEnum('force_repeat', raw.force_repeat);
  if (raw.correction_mode) out.correction_mode = pickEnum('correction_mode', raw.correction_mode);
  if (raw.difficulty) out.difficulty = pickEnum('difficulty', raw.difficulty);
  if (Array.isArray(raw.focus)) out.focus = raw.focus.filter((f) => ENUMS.focus.includes(f));
  if (Array.isArray(raw.target_vocab)) out.target_vocab = raw.target_vocab.map(String).slice(0, 64);
  if (Number.isFinite(raw.min_examples_per_point)) out.min_examples_per_point = clamp(raw.min_examples_per_point, 0, 10);

  if (Number.isFinite(raw.max_sentence_words)) out.max_sentence_words = clamp(raw.max_sentence_words, 4, 20);
  if (Number.isFinite(raw.max_sentences_per_turn)) out.max_sentences_per_turn = clamp(raw.max_sentences_per_turn, 1, 4);
  if (raw.bilingual_support) out.bilingual_support = pickEnum('bilingual_support', raw.bilingual_support);
  if (typeof raw.ipa_pronunciation === 'boolean') out.ipa_pronunciation = raw.ipa_pronunciation;
  if (typeof raw.phonics_hints === 'boolean') out.phonics_hints = raw.phonics_hints;

  if (typeof raw.anti_loop === 'boolean') out.anti_loop = raw.anti_loop;
  if (Number.isFinite(raw.reengage_after_seconds)) out.reengage_after_seconds = clamp(raw.reengage_after_seconds, 10, 180);

  if (raw.topic_strictness) out.topic_strictness = pickEnum('topic_strictness', raw.topic_strictness) || 'normal';
  if (Number.isFinite(raw.open_question_ratio)) out.open_question_ratio = clamp(raw.open_question_ratio, 0, 1);
  if (Number.isInteger(raw.wrap_up_on_turns)) out.wrap_up_on_turns = clamp(raw.wrap_up_on_turns, 5, 40);

  if (Array.isArray(raw.banned_topics)) out.banned_topics = raw.banned_topics.map(String).slice(0, 32);
  if (typeof raw.profanity_filter === 'boolean') out.profanity_filter = raw.profanity_filter;
  if (Number.isFinite(raw.age_gate)) out.age_gate = clamp(raw.age_gate, 4, 12);

  if (Number.isFinite(raw.temperature_base)) out.temperature_base = clamp(raw.temperature_base, 0, 2);
  if (Number.isFinite(raw.frequency_penalty)) out.frequency_penalty = clamp(raw.frequency_penalty, -2, 2);
  if (Number.isFinite(raw.presence_penalty)) out.presence_penalty = clamp(raw.presence_penalty, -2, 2);

  if (raw.voice_fixed && VALID_VOICES.includes(raw.voice_fixed)) out.voice_fixed = raw.voice_fixed;
  if (raw.speaking_rate) out.speaking_rate = pickEnum('speaking_rate', raw.speaking_rate);
  if (Number.isFinite(raw.pause_ms_between_sentences)) out.pause_ms_between_sentences = clamp(raw.pause_ms_between_sentences, 100, 1000);

  return out;
};

// ————————————————————————————————————————————————————————————————————————————
// Utilities
// ————————————————————————————————————————————————————————————————————————————
const normalize = (s = '') =>
  s.toLowerCase().normalize('NFKD').replace(/[^\w\s\-]/g, '').replace(/\s+/g, ' ').trim();

const SIMPLIFY_MAP = [
  ['how are you', 'how are you'],
  ['hi', 'hi'],
  ['hello', 'hello'],
  ['ok', 'ok'],
  ['okay', 'ok'],
  ['yes', 'yes'],
];
const simplify = (s = '') => {
  const n = normalize(s);
  for (const [key, val] of SIMPLIFY_MAP) if (n === key) return val;
  return n;
};
const isRepeatWithin = (message, history, lookback = 3) => {
  const msg = simplify(message);
  const lastUser = history.filter((m) => m.sender === 'user').slice(-lookback).map((m) => simplify(m.text));
  return lastUser.includes(msg);
};
const countSocialSmallTalk = (history, lookback = 6) => {
  const smallTalkSet = new Set(['hi', 'hello', 'how are you', 'ok', 'yes']);
  return history
    .filter((m) => m.sender === 'user')
    .slice(-lookback)
    .map((m) => simplify(m.text))
    .filter((t) => smallTalkSet.has(t)).length;
};

// ————————————————————————————————————————————————————————————————————————————
// Prompt templates — Optimized & de-duplicated
// ————————————————————————————————————————————————————————————————————————————
const CORE_RULES = (opts = OPTIONS_DEFAULT) => `
ROLE & GOAL:
- You are a kind, skilled English teacher for children (5–11), beginner→intermediate.
- Create a safe, encouraging, playful space that adapts to age and level.
- Teach via the child’s chosen topic; blend vocabulary, grammar, pronunciation, conversation.

AGE ADAPTATION:
- Ages 5–7: 3–5 word sentences, concrete ideas, repetition, playful tone.
- Ages 8–11: longer sentences, richer conversation.

TEACHING METHOD:
- Start warm. Let the child choose a topic (suggest animals/colors/daily life if needed).
- Teach through conversation: introduce new words in context; simple definitions; tie to the child’s life.
- Ask questions: begin yes/no → grow to what/why/how when ready.
- Correct gently by recasting (child: "I goed" → teacher: "Yes, you went!").
- Adjust pacing: slow if confused; energetic if engaged.
- Use positive reinforcement with varied praise.

STYLE:
- Short, simple sentences; warm tone; never robotic.
- Suggest tiny activities/mini-games.
- Repeat key vocabulary naturally.
- End each reply with a clear, concrete task.

LEVEL BEHAVIOR GUIDE:
- [LEVEL:WARM_UP] Greet briefly; teach 1 tiny point; easy task.
- [LEVEL:CORE] Practice target vocab/grammar; max 1 correction; clear task.
- [LEVEL:CHALLENGE] Slightly harder task (fill-blank / A-B-C); keep it fun.
- [LEVEL:REENGAGE] Very short, playful line; immediate mini-game; no open questions.
- [LEVEL:WRAP_UP] Praise + 1-sentence summary; tiny exit task if time.

ANTI-LOOP RULES:
- If the student repeats, do not mirror the same reply. Switch activity or wording.
- Do not repeat the same assistant pattern twice in a row (A/B choice, "repeat after me", fill-blank).
- Vary praise phrases and tasks.
- Maintain a hidden tag {pattern = AB_choice | repeat_after_me | fill_blank | open_q} each turn to avoid repetition.
`;

const LEVEL_INSTRUCTIONS = '';// (kept inside CORE_RULES to avoid duplication)

const TOPIC_PROMPTS = {
  'general-speaking': `TOPIC: General Speaking
Focus: Practice everyday conversations and general speaking skills. Focus on polite expressions, greetings, and basic social interactions.`,

  animals: `TOPIC: Animals
Focus: Learn about pets, farm animals, and wild animals. Talk about animal sounds, habitats, and characteristics. Use fun animal activities and games.`,

  colors: `TOPIC: Colors
Focus: Discover all the beautiful colors around us. Practice identifying colors of objects, mixing colors, and describing things by their colors.`,

dailyActivities: `TOPIC: Daily Activities
Focus: daily routine verbs and time words; sequencing.`,

  family: `TOPIC: Family
Focus: Meet your family members and relatives. Talk about family relationships, family activities, and introduce family members.`,

  food: `TOPIC: Food
Focus: Explore delicious foods and drinks. Discuss favorite foods, healthy eating, meal times, and food preferences.`,

  numbers: `TOPIC: Numbers
Focus: Count from 1 to 20 and learn basic math. Practice counting, simple addition, and number recognition through games and activities.`,

  body: `TOPIC: Body Parts
Focus: Learn about your body and how to take care of it. Identify body parts, discuss body functions, and learn about hygiene and health.`,

  clothes: `TOPIC: Clothes
Focus: Dress up and learn about different clothes. Talk about what to wear for different occasions, weather, and personal style.`,

  weather: `TOPIC: Weather
Focus: Talk about sunny, rainy, and snowy days. Describe weather conditions, seasons, and appropriate activities for different weather.`,

  school: `TOPIC: School
Focus: Learn about school, teachers, and friends. Discuss school activities, subjects, classroom objects, and school life.`,

  toys: `TOPIC: Toys
Focus: Play with your favorite toys and games. Talk about favorite toys, how to play with them, and sharing toys with friends.`,
  history: `TOPIC: History
Focus: Travel back in time to learn about important people and events. Explore simple timelines, inventions, and how life used to be.`,

  geography: `TOPIC: Geography
Focus: countries, maps, and landforms; continents and oceans; compare places.`,

  science: `TOPIC: Science
Focus: experiments, energy, and living things; simple discoveries; how things work.`,
};


const FOLLOW_UP_PROMPTS = { REENGAGE: `Quick playful nudge. Keep it within 1 short sentence.` };

const buildUserContext = (userInfo) => {
  if (!userInfo) return '';
  return `STUDENT INFORMATION:
- Name: ${userInfo.name || 'Student'}
- Age: ${userInfo.age || 'Unknown'} years old
IMPORTANT: Always address the student by their name (${userInfo.name || 'Student'}) when appropriate.`;
};

const replacePromptPlaceholders = (prompt, userInfo, opts) =>
  prompt
    .replace(/{{name}}/g, userInfo?.name || 'Student')
    .replace(/{{age}}/g, userInfo?.age || 'Unknown')
    .replace(/{{MAX_WORDS}}/g, String(opts.max_sentence_words))
    .replace(/{{MAX_SENTENCES}}/g, String(opts.max_sentences_per_turn));

const getTopicId = (topic) => {
  if (!topic) return null;
  return topic.id || topic.title?.toLowerCase().replace(/\s+/g, '-') || null;
};

const buildSessionStateBlock = (chatHistory = []) => {
  const lastUser = (chatHistory.filter((m) => m.sender === 'user').slice(-1)[0]?.text || '').trim();
  const smallTalkCount = countSocialSmallTalk(chatHistory, 6);
  const hint = smallTalkCount >= 3 ? 'Student tends to small-talk; steer gently back to topic.' : '';
  return `SESSION STATE:
- Last student message: ${lastUser || '(none)'}
- Note: ${hint}`;
};

const renderOptionDirectives = (opts) => [
  `Education level: ${opts.difficulty}. Focus: ${opts.focus.join(', ')}`,
  `Correction mode: ${opts.correction_mode}; Repeat policy: ${opts.force_repeat}`,
  `Bilingual: ${opts.bilingual_support}; IPA: ${opts.ipa_pronunciation ? 'on' : 'off'}; Phonics: ${opts.phonics_hints ? 'on' : 'off'}`,
  `Topic strictness: ${opts.topic_strictness}`,
  'Violations not allowed.',
].join('\n');

const buildConditionalConstraints = (opts) => {
  const lines = [];
  if (!opts.grammar_check) lines.push('Skip grammar correction unless a severe misunderstanding occurs.');
  if (opts.force_repeat === 'off') lines.push('Do not force the student to repeat after corrections.');
  if (opts.force_repeat === 'soft') lines.push('After a correction, encourage a repeat once, but do not insist.');
  if (opts.force_repeat === 'strict') lines.push('After any correction, always ask the student to repeat exactly once.');

  if (opts.bilingual_support === 'keyword_gloss') lines.push('After new words, add a one-word Vietnamese gloss in parentheses.');
  if (opts.bilingual_support === 'brief_hint') lines.push('Add one brief Vietnamese hint when necessary. Keep English first.');

  if (opts.ipa_pronunciation) lines.push('Add IPA notation for tricky words sparingly.');
  if (opts.phonics_hints) lines.push('Add simple phonics hints (e.g., "dr- = /dr/").');

  if (opts.topic_strictness === 'strict') lines.push('Do not accept off-topic replies; redirect with a short on-topic task.');
  if (opts.topic_strictness === 'loose') lines.push('Allow light tangents, but return to topic with a task.');

  if (opts.profanity_filter) lines.push('Avoid any profanity or age-inappropriate content.');
  if (opts.banned_topics.length > 0) lines.push(`Avoid these topics entirely: ${opts.banned_topics.join(', ')}.`);

  lines.push(`Keep each reply ≤ ${opts.max_sentences_per_turn} sentence(s), each sentence ≤ ${opts.max_sentence_words} words.`);
  lines.push(`Mix open questions (${Math.round(opts.open_question_ratio * 100)}%) with short activities.`);
  lines.push(`Aim to wrap up around turn ${opts.wrap_up_on_turns} with a brief summary and exit task.`);

  return lines.join('\n');
};

// Prevent repeating the same activity pattern back-to-back based on recent assistant outputs
const buildAssistantPatternRotateConstraint = (chatHistory = []) => {
  const recentAssistant = chatHistory
    .filter((m) => m.sender !== 'user')
    .slice(-2)
    .map((m) => (m.text || '').toLowerCase())
    .join(' || ');
  const avoid = [];
  if (/\ba\)\s|\bb\)\s|\bc\)\s/.test(recentAssistant) || /choose:\s*a\)/.test(recentAssistant)) avoid.push('Avoid AB_choice this turn.');
  if (/repeat after me/.test(recentAssistant)) avoid.push('Avoid repeat_after_me this turn.');
  if (/fill in the blank|____/.test(recentAssistant)) avoid.push('Avoid fill_blank this turn.');
  const header = 'Do not reuse the same activity pattern twice in a row. Rotate patterns.';
  return [header, ...avoid].join('\n');
};

// ————————————————————————————————————————————————————————————————————————————
// System prompt builder (token-lean, single source of truth)
// ————————————————————————————————————————————————————————————————————————————
const buildTopicBlock = (topic) => {
  const topicId = getTopicId(topic) || 'general-speaking';
  return TOPIC_PROMPTS[topicId] || TOPIC_PROMPTS['general-speaking'];
};

const buildSystemPrompt = (opts, topic, userInfo, chatHistory, isAutoPrompt) => {
  const blocks = [
    CORE_RULES(opts),
    buildUserContext(userInfo),
    buildTopicBlock(topic),
    buildSessionStateBlock(chatHistory),
    renderOptionDirectives(opts),
    'CONDITIONAL CONSTRAINTS:',
    buildConditionalConstraints(opts),
    buildAssistantPatternRotateConstraint(chatHistory),
    'SYSTEM ENFORCER (Self-check): If any rule is violated, rewrite once to comply before replying.',
    'OUTPUT CONTRACT:',
    `- Exactly ${opts.max_sentences_per_turn} sentence(s).`,
    `- Each sentence ≤ ${opts.max_sentence_words} words.`,
    // '- End with a concrete task.',
    // 'Return only the final, corrected line.',
    '— End of teacher rules —',
  ];

  if (isAutoPrompt) {
    blocks.splice(
      3,
      0,
      `REENGAGE: The student hasn't responded for ${opts.reengage_after_seconds}s. Use 1 playful micro-game (A/B or say two words). Be positive.`
    );
  }

  return blocks.filter(Boolean).join('\n');
};

// ————————————————————————————————————————————————————————————————————————————
// Core response function (Text only)
// ————————————————————————————————————————————————————————————————————————————
const ENGAGEMENT_LEVEL = {
  WARM_UP: 'WARM_UP',
  CORE: 'CORE',
  CHALLENGE: 'CHALLENGE',
  REENGAGE: 'REENGAGE',
  WRAP_UP: 'WRAP_UP',
};

const pickVoiceForLevel = (level, opts) => {
  // If a fixed voice is explicitly provided, use it; otherwise choose per engagement level
  if (opts.voice_fixed) return { voice: opts.voice_fixed, style: 'default' };
  switch (level) {
    case ENGAGEMENT_LEVEL.WARM_UP: return { voice: 'shimmer', style: 'soft-friendly' };
    case ENGAGEMENT_LEVEL.CORE: return { voice: 'alloy', style: 'clear-slow' };
    case ENGAGEMENT_LEVEL.CHALLENGE: return { voice: 'nova', style: 'energetic' };
    case ENGAGEMENT_LEVEL.REENGAGE: return { voice: 'echo', style: 'playful' };
    case ENGAGEMENT_LEVEL.WRAP_UP: return { voice: 'alloy', style: 'warm-summary' };
    default: return { voice: 'nova', style: 'friendly' };
  }
};

const estimateEngagementLevel = (chatHistory = [], opts) => {
  const lastAssistant = chatHistory.filter((m) => m.sender !== 'user').slice(-1)[0]?.text || '';
  const wasChallenge = /\[LEVEL:CHALLENGE\]/.test(lastAssistant);
  const turns = chatHistory.length;
  if (turns >= opts.wrap_up_on_turns) return ENGAGEMENT_LEVEL.WRAP_UP;
  if (wasChallenge) return ENGAGEMENT_LEVEL.CORE;
  const idleReengage = false; // gate from caller if needed
  if (idleReengage) return ENGAGEMENT_LEVEL.REENGAGE;
  const challengeRatio = 0.4; // fixed ratio; previously user-configurable
  return Math.random() < challengeRatio ? ENGAGEMENT_LEVEL.CHALLENGE : ENGAGEMENT_LEVEL.CORE;
};

// Keep a short anti-loop header for reuse in tests / exports parity
const ANTI_LOOP_RULES = `
ANTI-LOOP RULES:
- If the student repeats a message, do NOT mirror the same reply. Switch activity or use a different wording.
- Do not repeat the same assistant pattern twice (A/B choice, "repeat after me", fill-in-the-blank).
- Vary praise phrases and tasks.
`;

// ————————————————————————————————————————————————————————————————————————————
// Core response function (Text only)
// ————————————————————————————————————————————————————————————————————————————
const getOpenAIResponse = async (
  message,
  chatHistory = [],
  topic = null,
  userInfo = null,
  isFollowUp = false,
  options = null
) => {
  try {
    const openaiClient = initializeOpenAI();
    const opts = sanitizeOptions(options);

    const isAutoPrompt = typeof message === 'string' && message.includes('[AUTO_PROMPT]');
    const level = estimateEngagementLevel(chatHistory, opts);
    const { voice: chosenVoice, style: chosenStyle } = pickVoiceForLevel(level, opts);

    // Build final system prompt (lean, non-duplicated)
    const systemPrompt = buildSystemPrompt(opts, topic, userInfo, chatHistory, isAutoPrompt);

    // Avoid duplicating the latest user message if already in history
    const lastHistoryMessage = chatHistory.length > 0 ? chatHistory[chatHistory.length - 1] : null;
    const isMessageAlreadyInHistory =
      lastHistoryMessage && lastHistoryMessage.sender === 'user' && lastHistoryMessage.text === message;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.map((entry) => ({
        role: entry.sender === 'user' ? 'user' : 'assistant',
        content: entry.text,
      })),
      ...(isMessageAlreadyInHistory ? [] : [{ role: 'user', content: message }]),
    ];

    // Logging (debug)
    console.log('\n========== OPENAI REQUEST ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Model:', 'gpt-3.5-turbo');
    console.log('Topic ID:', getTopicId(topic));
    console.log('Is Follow-up:', isFollowUp);
    console.log('Is Auto-prompt:', isAutoPrompt);
    console.log('Engagement Level:', level);
    console.log('Voice:', chosenVoice, 'Style:', chosenStyle);
    console.log('Last applied options:', JSON.stringify(opts, null, 2));
    console.log('\nMessages sent to OpenAI:');
    console.log(JSON.stringify(messages, null, 2));
    console.log('====================================\n');

    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 180,
      temperature: level === ENGAGEMENT_LEVEL.CHALLENGE ? Math.min(1.2, opts.temperature_base + 0.1) : opts.temperature_base,
      presence_penalty: opts.presence_penalty,
      frequency_penalty: opts.frequency_penalty,
    });

    const textResponse = completion.choices[0].message.content;

    console.log('\n========== OPENAI RESPONSE ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Response ID:', completion.id);
    console.log('Model:', completion.model);
    console.log('Tokens Used - Prompt:', completion.usage?.prompt_tokens);
    console.log('Tokens Used - Completion:', completion.usage?.completion_tokens);
    console.log('Tokens Used - Total:', completion.usage?.total_tokens);
    console.log('Finish Reason:', completion.choices[0].finish_reason);
    console.log('\nText Response:\n', textResponse);
    console.log('Engagement Level:', level);
    console.log('=====================================\n');

    return {
      text: textResponse,
      audio: null,
      audioFormat: null,
      voice: chosenVoice,
      meta: { level, style: chosenStyle },
    };
  } catch (err) {
    console.error('[openaiService] Error:', err);
    throw err;
  }
};

// ————————————————————————————————————————————————————————————————————————————
// V2 Response function (with integrated TTS)
// ————————————————————————————————————————————————————————————————————————————
const getOpenAIResponseV2 = async (
  message,
  chatHistory = [],
  topic = null,
  userInfo = null,
  isFollowUp = false,
  voice = 'alloy',
  model = 'gpt-4o-mini-tts',
  options = null
) => {
  try {
    const textResponse = await getOpenAIResponse(message, chatHistory, topic, userInfo, isFollowUp, options);
    const { textToSpeech } = require('./ttsService');
    const selectedVoice = textResponse.voice || voice;
    const opts = sanitizeOptions(options);

    const audioBuffer = await textToSpeech(textResponse.text, selectedVoice, model, {
      conversationOptions: opts,
      engagementLevel: textResponse.meta?.level || 'CORE',
      style: textResponse.meta?.style || 'default',
    });

    return {
      text: textResponse.text,
      audio: audioBuffer,
      audioFormat: 'mp3',
      voice: selectedVoice,
      model,
      engagementLevel: textResponse.meta?.level || 'CORE',
      style: textResponse.meta?.style || 'default',
      options,
    };
  } catch (err) {
    console.error('[openaiService] Error in getOpenAIResponseV2:', err);
    throw err;
  }
};

module.exports = {
  getOpenAIResponse,
  getOpenAIResponseV2,
  // Expose some pieces for testing / external orchestration
  TOPIC_PROMPTS,          // now topic-only snippets
  FOLLOW_UP_PROMPTS,
  getTopicId,
  replacePromptPlaceholders,
  buildUserContext,
  ANTI_LOOP_RULES,
  ENGAGEMENT_LEVEL,
  estimateEngagementLevel,
  isRepeatWithin,
  pickVoiceForLevel,
  // NEW exports
  sanitizeOptions,
  OPTIONS_DEFAULT,
  VALID_VOICES,
};
