const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, requiresAuth = false) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: requiresAuth ? { Authorization: `Bearer ${authToken}` } : {},
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    log(`✅ ${method.toUpperCase()} ${endpoint} - Success`, 'green');
    return response.data;
  } catch (error) {
    log(`❌ ${method.toUpperCase()} ${endpoint} - Failed: ${error.response?.data?.message || error.message}`, 'red');
    return null;
  }
}

async function runTests() {
  log('\n🧪 Starting API Tests for Olive Garden Admin Dashboard\n', 'cyan');

  // Test 1: Health Check
  log('📍 Testing Health Endpoint...', 'blue');
  await testEndpoint('get', '/health');

  // Test 2: Login
  log('\n📍 Testing Authentication...', 'blue');
  const loginResult = await testEndpoint('post', '/auth/login', {
    email: 'admin@olivegarden.com',
    password: 'Admin123!',
  });

  if (loginResult && loginResult.data && loginResult.data.token) {
    authToken = loginResult.data.token;
    log('🔑 Authentication token obtained', 'green');
  } else {
    log('⚠️  Failed to obtain auth token. Some tests will be skipped.', 'yellow');
    return;
  }

  // Test 3: Get Current User
  log('\n📍 Testing User Profile...', 'blue');
  await testEndpoint('get', '/auth/me', null, true);

  // Test 4: Users API
  log('\n📍 Testing Users API...', 'blue');
  await testEndpoint('get', '/users', null, true);
  await testEndpoint('get', '/users/stats/summary', null, true);

  // Test 5: Bookings API
  log('\n📍 Testing Bookings API...', 'blue');
  await testEndpoint('get', '/bookings', null, true);
  await testEndpoint('get', '/bookings/stats/summary', null, true);
  
  const bookingData = {
    client_name: 'Test Client',
    client_email: 'test@example.com',
    client_phone: '+254700000000',
    event_name: 'Test Event',
    event_type: 'Workshop',
    venue: 'Therapy Room',
    event_date: '2024-03-15',
    start_time: '10:00',
    end_time: '16:00',
    total_amount: 50000,
    deposit_amount: 20000,
    guest_count: 30,
  };
  
  const newBooking = await testEndpoint('post', '/bookings', bookingData, true);
  
  if (newBooking && newBooking.data && newBooking.data.booking) {
    const bookingId = newBooking.data.booking.id;
    log(`📝 Created booking with ID: ${bookingId}`, 'green');
    
    await testEndpoint('get', `/bookings/${bookingId}`, null, true);
    await testEndpoint('put', `/bookings/${bookingId}`, { status: 'confirmed' }, true);
  }

  // Test 6: Gallery API
  log('\n📍 Testing Gallery API...', 'blue');
  await testEndpoint('get', '/gallery', null, false);
  await testEndpoint('get', '/gallery/stats/summary', null, true);
  await testEndpoint('get', '/gallery/album/Main Arena', null, false);
  
  const galleryData = {
    title: 'Test Image',
    description: 'Test image description',
    url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed',
    thumbnail_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400',
    album: 'Main Arena',
    category: 'Test',
    tags: ['test', 'demo'],
    is_featured: false,
    is_published: true,
  };
  
  const newImage = await testEndpoint('post', '/gallery', galleryData, true);
  
  if (newImage && newImage.data && newImage.data.image) {
    const imageId = newImage.data.image.id;
    log(`🖼️  Created gallery image with ID: ${imageId}`, 'green');
    
    await testEndpoint('get', `/gallery/${imageId}`, null, false);
    await testEndpoint('patch', `/gallery/${imageId}/featured`, null, true);
  }

  // Test 7: Analytics API
  log('\n📍 Testing Analytics API...', 'blue');
  await testEndpoint('get', '/analytics/overview', null, true);
  await testEndpoint('get', '/analytics/revenue', null, true);
  await testEndpoint('get', '/analytics/bookings/trends', null, true);
  await testEndpoint('get', '/analytics/engagement', null, true);
  await testEndpoint('get', '/analytics/dashboard', null, true);
  
  const analyticsEvent = {
    event_type: 'page_view',
    event_category: 'engagement',
    event_action: 'view',
    event_label: 'Dashboard Page',
    page_url: '/admin/dashboard',
    page_title: 'Dashboard',
  };
  
  await testEndpoint('post', '/analytics/track', analyticsEvent, true);

  log('\n✨ API Tests Completed!\n', 'cyan');
}

runTests().catch((error) => {
  log(`\n💥 Test suite error: ${error.message}`, 'red');
  process.exit(1);
});
