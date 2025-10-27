const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000'; // Adjust port if needed
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123',
  name: 'Test User',
  age: 10,
  languagePreference: 'vi'
};

let authToken = '';

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing health check...');
  try {
    const result = await apiCall('GET', '/health/health');
    console.log('✅ Health check passed:', result);
    return true;
  } catch (error) {
    console.log('❌ Health check failed');
    return false;
  }
}

async function testRegistration() {
  console.log('\n🔍 Testing user registration...');
  try {
    const result = await apiCall('POST', '/auth/register', testUser);
    console.log('✅ Registration successful:', result);
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.error === 'EMAIL_EXISTS') {
      console.log('⚠️  User already exists, continuing with login...');
      return true;
    }
    console.log('❌ Registration failed');
    return false;
  }
}

async function testLogin() {
  console.log('\n🔍 Testing user login...');
  try {
    const result = await apiCall('POST', '/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = result.data.token;
    console.log('✅ Login successful:', {
      user: result.data.user,
      hasToken: !!authToken
    });
    return true;
  } catch (error) {
    console.log('❌ Login failed');
    return false;
  }
}

async function testProfile() {
  console.log('\n🔍 Testing get profile...');
  try {
    const result = await apiCall('GET', '/auth/profile', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Profile retrieved:', result.data.user);
    return true;
  } catch (error) {
    console.log('❌ Get profile failed');
    return false;
  }
}

async function testChatSession() {
  console.log('\n🔍 Testing chat session creation...');
  try {
    const result = await apiCall('POST', '/chat/start-session', {
      topic: 'Animals',
      difficultyLevel: 'beginner'
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Chat session created:', result.data);
    return result.data.data.sessionId;
  } catch (error) {
    console.log('❌ Chat session creation failed');
    return null;
  }
}

async function testSendMessage(sessionId) {
  console.log('\n🔍 Testing send message...');
  try {
    const result = await apiCall('POST', '/chat/send-message', {
      message: 'Hello, how are you?',
      provider: 'openai',
      topic: 'Animals',
      sessionId: sessionId
    }, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Message sent successfully:', {
      response: result.data.data.response.substring(0, 100) + '...',
      sessionId: result.data.data.sessionId
    });
    return true;
  } catch (error) {
    console.log('❌ Send message failed');
    return false;
  }
}

async function testGetSessions() {
  console.log('\n🔍 Testing get chat sessions...');
  try {
    const result = await apiCall('GET', '/chat/sessions', null, {
      'Authorization': `Bearer ${authToken}`
    });
    console.log('✅ Chat sessions retrieved:', {
      count: result.data.data.sessions.length,
      sessions: result.data.data.sessions.map(s => ({
        id: s.id,
        topic: s.topic,
        messageCount: s.message_count
      }))
    });
    return true;
  } catch (error) {
    console.log('❌ Get chat sessions failed');
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🔍 Testing unauthorized access...');
  try {
    await apiCall('GET', '/auth/profile');
    console.log('❌ Unauthorized access should have failed');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
      return true;
    }
    console.log('❌ Unexpected error for unauthorized access');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Authentication API Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Registration', fn: testRegistration },
    { name: 'Login', fn: testLogin },
    { name: 'Get Profile', fn: testProfile },
    { name: 'Unauthorized Access', fn: testUnauthorizedAccess },
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
    }
  }
  
  // Test chat functionality if authentication works
  if (authToken) {
    console.log('\n🔍 Testing Chat Functionality...');
    
    const chatTests = [
      { name: 'Create Chat Session', fn: testChatSession },
      { name: 'Send Message', fn: () => testSendMessage(null) },
      { name: 'Get Chat Sessions', fn: testGetSessions },
    ];
    
    for (const test of chatTests) {
      try {
        const result = await test.fn();
        if (result) passed++;
        total++;
      } catch (error) {
        console.log(`❌ ${test.name} failed with error:`, error.message);
        total++;
      }
    }
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Authentication system is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }
  
  console.log('\n📝 Next steps:');
  console.log('   1. Test with frontend integration');
  console.log('   2. Test with different user scenarios');
  console.log('   3. Test error handling edge cases');
  console.log('   4. Deploy to production and test');
}

// Run tests
runTests().catch(console.error);
