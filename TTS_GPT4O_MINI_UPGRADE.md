# TTS Upgrade: gpt-4o-mini-tts với Instructions Parameter

**Ngày cập nhật:** 2025-10-15  
**Model:** `gpt-4o-mini-tts` (OpenAI's newest text-to-speech model)  
**Tính năng mới:** `instructions` parameter cho phép điều khiển chi tiết giọng nói

---

## 🎯 Tổng quan

Nâng cấp hệ thống TTS từ `tts-1` / `tts-1-hd` sang `gpt-4o-mini-tts` để tận dụng parameter `instructions` mới cho phép điều khiển:

✅ **Speed of speech** (tốc độ nói)  
✅ **Pauses between sentences** (khoảng dừng giữa câu)  
✅ **Tone & emotional range** (giọng điệu & cảm xúc)  
✅ **Intonation** (ngữ điệu)  
✅ **Accent** (giọng địa phương)  
✅ **Whispering** (thì thầm)

---

## 📋 Những thay đổi chính

### 1. **ttsService.js** - Core TTS Logic

#### ✨ Thêm `buildTTSInstructions()`

Function mới để map từ `options` (client-provided) → `instructions` (natural language string):

```javascript
function buildTTSInstructions(opts, engagementLevel, style) {
  // Maps options to natural language instructions
  // Example output: "Speak slowly and clearly, suitable for young children 
  // learning English. Add clear pauses between sentences. Use a warm, 
  // friendly, welcoming tone to greet the student."
}
```

**Mapping logic:**

| Option | Instructions Generated |
|--------|------------------------|
| `speaking_rate: 'slow'` | "Speak slowly and clearly, suitable for young children learning English." |
| `speaking_rate: 'fast'` | "Speak at a brisk, energetic pace." |
| `pause_ms_between_sentences >= 500` | "Add clear, deliberate pauses between sentences to help comprehension." |
| `engagementLevel: 'REENGAGE'` | "Use a playful, energetic, attention-grabbing tone to recapture interest." |
| `age_gate: 6` | "Use gentle, nurturing intonation like speaking to a young child." |
| `phonics_hints: true` | "Emphasize clear pronunciation of each word, especially key vocabulary." |

#### 🔧 Update `textToSpeech()`

```javascript
// OLD signature
async function textToSpeech(text, voice, model)

// NEW signature
async function textToSpeech(text, voice, model, options)
// options = {
//   conversationOptions: { speaking_rate, pause_ms_between_sentences, ... },
//   engagementLevel: 'WARM_UP' | 'CORE' | 'CHALLENGE' | 'REENGAGE' | 'WRAP_UP',
//   style: 'soft-friendly' | 'playful' | 'energetic' | ...
// }
```

**API Call Format:**

```javascript
const response = await openai.audio.speech.create({
  model: 'gpt-4o-mini-tts',
  voice: voice,
  input: text,
  instructions: buildTTSInstructions(opts, engagementLevel, style), // ⬅️ NEW!
  response_format: 'mp3',
});
```

#### 📦 Updated Available Models

```javascript
const models = ['tts-1', 'tts-1-hd', 'gpt-4o-mini-tts'];
```

---

### 2. **openaiService.js** - AI Response Logic

#### 🗑️ Removed from System Prompt

**Before:**
```javascript
`Voice policy: ${opts.voice_policy} — fixed: ${opts.voice_fixed}; 
 Speaking rate: ${opts.speaking_rate}; Pause(ms): ${opts.pause_ms_between_sentences}`
```

**After:**
```javascript
// NOTE: speaking_rate & pause_ms_between_sentences are TTS params 
// (handled by instructions in TTS API)
```

**Lý do:** TTS parameters không ảnh hưởng đến text generation, chỉ ảnh hưởng đến audio generation. Đưa vào system prompt là lãng phí tokens.

#### 🔄 Updated `getOpenAIResponseV2()`

```javascript
// OLD: Không truyền options vào TTS
const audioBuffer = await textToSpeech(textResponse.text, selectedVoice, model);

// NEW: Truyền đầy đủ context vào TTS
const audioBuffer = await textToSpeech(textResponse.text, selectedVoice, model, {
  conversationOptions: opts,
  engagementLevel: textResponse.meta?.level || 'CORE',
  style: textResponse.meta?.style || 'default',
});
```

---

### 3. **chatRoutes.js** - API Endpoints

#### 🔧 Updated Default Model

```javascript
// Line 56
model = 'gpt-4o-mini-tts', // NEW: Default to gpt-4o-mini-tts
```

#### 🆕 Enhanced `/text-to-speech` Endpoint

**OLD:**
```javascript
POST /api/chat/text-to-speech
Body: { text, voice, model }
```

**NEW:**
```javascript
POST /api/chat/text-to-speech
Body: {
  text: string,
  voice?: string = 'alloy',
  model?: string = 'gpt-4o-mini-tts',
  options?: object,              // ⬅️ NEW! Conversation options
  engagementLevel?: string = 'CORE',  // ⬅️ NEW!
  style?: string = 'default'          // ⬅️ NEW!
}
```

**Example request:**
```json
{
  "text": "Hello! How are you today?",
  "voice": "coral",
  "model": "gpt-4o-mini-tts",
  "options": {
    "speaking_rate": "slow",
    "pause_ms_between_sentences": 500,
  },
  "engagementLevel": "WARM_UP",
  "style": "soft-friendly"
}
```

---

## 🧪 Testing

### Test Script: `test-tts-instructions.js`

```bash
cd backend
node test-tts-instructions.js
```

**Output:**
- Generates 4 test audio files với different options
- Saves vào `backend/test-outputs/`
- Logs generated instructions cho mỗi test case

**Test cases:**
1. ✅ Slow speaking with pauses (WARM_UP)
2. ✅ Playful reengage tone (REENGAGE)
3. ✅ Fast energetic challenge (CHALLENGE)
4. ✅ Calm wrap-up summary (WRAP_UP)

---

## 📊 So sánh Before/After

| Aspect | Before (tts-1) | After (gpt-4o-mini-tts) |
|--------|----------------|-------------------------|
| **Model** | `tts-1`, `tts-1-hd` | `gpt-4o-mini-tts` |
| **Speed control** | ❌ Không có | ✅ Via instructions |
| **Pause control** | ❌ Không có | ✅ Via instructions |
| **Tone control** | ❌ Chỉ qua voice selection | ✅ Dynamic qua instructions |
| **Context-aware** | ❌ Không | ✅ Engagement level aware |
| **Age-appropriate** | ❌ Không | ✅ Age-based intonation |
| **System prompt pollution** | ⚠️ TTS params trong prompt | ✅ Clean separation |

---

## 🎛️ Options → Instructions Mapping

### Speaking Rate

```javascript
'slow'   → "Speak slowly and clearly, suitable for young children"
'normal' → "Speak at a moderate, natural pace"
'fast'   → "Speak at a brisk, energetic pace"
```

### Pauses

```javascript
pause_ms >= 500 → "Add clear, deliberate pauses between sentences"
pause_ms >= 300 → "Add natural pauses between sentences"
```

### Engagement Levels

```javascript
'WARM_UP'   → "warm, friendly, welcoming tone"
'CORE'      → "clear, patient, encouraging teaching tone"
'CHALLENGE' → "enthusiastic, exciting tone to motivate"
'REENGAGE'  → "playful, energetic, attention-grabbing tone"
'WRAP_UP'   → "warm, proud, celebratory tone"
```

### Age-based Intonation

```javascript
age <= 7  → "gentle, nurturing intonation like speaking to young child"
age >= 10 → "confident, clear intonation suitable for pre-teens"
```

---

## 🚀 API Usage Examples

### Example 1: Send message with audio (full options)

```javascript
POST /api/chat/send-message
{
  "message": "Hello teacher!",
  "provider": "openai",
  "includeAudio": true,
  "voice": "coral",
  "model": "gpt-4o-mini-tts",
  "options": {
    "speaking_rate": "slow",
    "pause_ms_between_sentences": 500,
    "age_gate": 6,
    "reengage_style": "playful",
    "phonics_hints": true
  },
  "userInfo": {
    "name": "Alice",
    "age": 7
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hello Alice! How are you today?",
    "audio": "<Buffer...>",
    "audioFormat": "mp3",
    "voice": "coral",
    "model": "gpt-4o-mini-tts",
    "engagementLevel": "WARM_UP",
    "style": "soft-friendly"
  }
}
```

### Example 2: Standalone TTS with options

```javascript
POST /api/chat/text-to-speech
{
  "text": "Great job! You're doing amazing!",
  "voice": "nova",
  "model": "gpt-4o-mini-tts",
  "options": {
    "speaking_rate": "fast",
    "pause_ms_between_sentences": 200
  },
  "engagementLevel": "CHALLENGE",
  "style": "energetic"
}
```

**Response:** Audio buffer (audio/mpeg)

---

## 📝 Client Integration Guide

### Mobile (React Native)

```javascript
// conversationService.js
const sendMessage = async (message, options) => {
  const response = await fetch(`${API_BASE_URL}/chat/send-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      includeAudio: true,
      model: 'gpt-4o-mini-tts', // Use new model
      options: {
        speaking_rate: options.speakingRate || 'slow',
        pause_ms_between_sentences: options.pauseMs || 500,
        age_gate: userAge,
        // ... other options
      },
      userInfo: {
        name: userName,
        age: userAge
      }
    })
  });
  
  return response.json();
};
```

### Frontend (React)

```javascript
// Similar to mobile, adjust for web APIs
const playTTS = async (text, options) => {
  const response = await fetch('/api/chat/text-to-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: text,
      model: 'gpt-4o-mini-tts',
      options: options,
      engagementLevel: 'CORE',
      style: 'default'
    })
  });
  
  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
};
```

---

## ⚠️ Important Notes

### 1. Model Availability

`gpt-4o-mini-tts` is a **preview model**. If not available in your OpenAI account:
- API will return error
- Test script includes fallback to `tts-1-hd`
- Check OpenAI dashboard for model access

### 2. Cost Considerations

- `gpt-4o-mini-tts` may have different pricing than `tts-1`
- Check [OpenAI Pricing](https://openai.com/pricing) for latest rates
- Instructions parameter không tăng cost (chỉ là metadata)

### 3. Backwards Compatibility

- API still accepts `tts-1` and `tts-1-hd`
- Old clients without `options` parameter will still work
- Default behavior: fallback to basic generation without instructions

### 4. Instructions Limitations

- OpenAI model interprets instructions as **guidance, not strict commands**
- Actual output may vary based on model's understanding
- Complex instructions may not be fully followed
- Test với real audio để verify quality

---

## 🐛 Troubleshooting

### Error: "Model gpt-4o-mini-tts not found"

**Solution:** Model chưa available trong account. Options:
1. Wait for general availability
2. Request access từ OpenAI
3. Fallback to `tts-1-hd` temporarily

```javascript
// Add fallback logic
try {
  audioBuffer = await textToSpeech(text, voice, 'gpt-4o-mini-tts', options);
} catch (err) {
  if (err.message.includes('gpt-4o-mini-tts')) {
    console.warn('Fallback to tts-1-hd');
    audioBuffer = await textToSpeech(text, voice, 'tts-1-hd', options);
  } else {
    throw err;
  }
}
```

### Instructions không có hiệu ứng

**Possible reasons:**
1. Instructions quá phức tạp → Simplify
2. Model không support feature đó → Adjust expectations
3. Conflict giữa instructions → Review generated string

**Debug:**
```javascript
console.log('Generated instructions:', instructions);
```

---

## 📚 References

- [OpenAI Text-to-Speech Guide](https://platform.openai.com/docs/guides/text-to-speech)
- [gpt-4o Audio Models](https://platform.openai.com/docs/models/gpt-4o-audio)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/audio/createSpeech)

---

## ✅ Checklist

- [x] Update `ttsService.js` with `buildTTSInstructions()`
- [x] Update `textToSpeech()` signature to accept options
- [x] Remove TTS params from system prompt in `openaiService.js`
- [x] Update `getOpenAIResponseV2()` to pass full context
- [x] Update default model in `chatRoutes.js`
- [x] Enhance `/text-to-speech` endpoint
- [x] Add `gpt-4o-mini-tts` to available models
- [x] Create test script
- [x] Create documentation
- [ ] Test with real OpenAI account
- [ ] Update mobile client
- [ ] Update frontend client
- [ ] Monitor costs & quality

---

**Status:** ✅ Implementation Complete - Ready for Testing

