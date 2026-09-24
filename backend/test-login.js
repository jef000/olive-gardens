require('dotenv').config();
const axios = require('axios');

/**
 * Manual login smoke test.
 *
 * Usage: TEST_EMAIL=admin@example.com TEST_PASSWORD='...' node test-login.js
 * No credentials are hardcoded in this file.
 */
async function test() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    console.error('❌ Set TEST_EMAIL and TEST_PASSWORD environment variables to run this smoke test.');
    process.exit(1);
  }

  const baseUrl = process.env.API_URL || 'http://localhost:5000/api';

  try {
    const res = await axios.post(`${baseUrl}/auth/login`, { email, password });
    console.log('LOGIN SUCCESS:', res.data.message || 'ok');

    const token = res.data.data?.token;
    if (!token) return;

    const meRes = await axios.get(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('ME SUCCESS:', meRes.data.data?.user?.email || 'ok');
  } catch (error) {
    console.log('ERROR:', error.response?.data || error.message);
  }
}

test();
