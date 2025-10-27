// Test script for gpt-4o-mini-tts with instructions parameter
// Tests the new TTS implementation with conversation options

require('dotenv').config();
const { textToSpeech, buildTTSInstructions } = require('./src/services/ttsService');
const fs = require('fs');
const path = require('path');

// Test cases with different options
const testCases = [
  {
    name: 'slow_speaking_with_pauses',
    text: 'Hello! How are you today? Let me teach you about colors.',
    voice: 'coral',
    options: {
      conversationOptions: {
        speaking_rate: 'slow',
        pause_ms_between_sentences: 500,
        age_gate: 6,
        phonics_hints: true,
        ipa_pronunciation: false,
        reengage_style: 'playful'
      },
      engagementLevel: 'WARM_UP',
      style: 'soft-friendly'
    }
  },
  {
    name: 'reengage_playful',
    text: 'Hey! Are you ready for a fun game? Choose A or B!',
    voice: 'echo',
    options: {
      conversationOptions: {
        speaking_rate: 'normal',
        pause_ms_between_sentences: 300,
        age_gate: 8,
        reengage_style: 'playful'
      },
      engagementLevel: 'REENGAGE',
      style: 'playful'
    }
  },
  {
    name: 'challenge_fast',
    text: 'Excellent work! Now try this harder question!',
    voice: 'nova',
    options: {
      conversationOptions: {
        speaking_rate: 'fast',
        pause_ms_between_sentences: 200,
        age_gate: 10,
      },
      engagementLevel: 'CHALLENGE',
      style: 'energetic'
    }
  },
  {
    name: 'wrap_up_calm',
    text: 'Great job today! You learned so many new words. See you next time!',
    voice: 'alloy',
    options: {
      conversationOptions: {
        speaking_rate: 'normal',
        pause_ms_between_sentences: 400,
        age_gate: 7,
      },
      engagementLevel: 'WRAP_UP',
      style: 'warm-summary'
    }
  }
];

async function runTests() {
  console.log('🧪 Testing gpt-4o-mini-tts with instructions parameter\n');
  console.log('='.repeat(60));

  // Create output directory
  const outputDir = path.join(__dirname, 'test-outputs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const testCase of testCases) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log('-'.repeat(60));
    console.log('Text:', testCase.text);
    console.log('Voice:', testCase.voice);
    
    // Build and display instructions
    const instructions = buildTTSInstructions(
      testCase.options.conversationOptions,
      testCase.options.engagementLevel,
      testCase.options.style
    );
    console.log('\n📋 Generated Instructions:');
    console.log(instructions);
    
    try {
      console.log('\n🎤 Generating audio...');
      const startTime = Date.now();
      
      const audioBuffer = await textToSpeech(
        testCase.text,
        testCase.voice,
        'gpt-4o-mini-tts',
        testCase.options
      );
      
      const duration = Date.now() - startTime;
      console.log(`✅ Audio generated in ${duration}ms`);
      console.log(`📊 Audio size: ${audioBuffer.length} bytes`);
      
      // Save audio file
      const filename = `${testCase.name}_${Date.now()}.mp3`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, audioBuffer);
      console.log(`💾 Saved to: ${filepath}`);
      
    } catch (error) {
      console.error(`❌ Error in test "${testCase.name}":`, error.message);
      if (error.message.includes('gpt-4o-mini-tts')) {
        console.log('\n⚠️  Note: gpt-4o-mini-tts may not be available in your account yet.');
        console.log('    Falling back to tts-1-hd for comparison...\n');
        
        try {
          const audioBuffer = await textToSpeech(
            testCase.text,
            testCase.voice,
            'tts-1-hd',
            testCase.options
          );
          
          const filename = `${testCase.name}_fallback_${Date.now()}.mp3`;
          const filepath = path.join(outputDir, filename);
          fs.writeFileSync(filepath, audioBuffer);
          console.log(`💾 Fallback saved to: ${filepath}`);
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError.message);
        }
      }
    }
    
    console.log('='.repeat(60));
  }

  console.log('\n✨ All tests completed!');
  console.log(`📂 Audio files saved in: ${outputDir}`);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

