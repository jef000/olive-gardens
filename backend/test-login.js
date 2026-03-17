require('dotenv').config();
const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@olivegarden.com',
      password: 'Admin123!'
    });
    console.log('LOGIN SUCCESS:', res.data);
    
    const token = res.data.data.token;
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('ME SUCCESS:', meRes.data);
  } catch (e) {
    console.log('ERROR:', e.response?.data || e.message);
  }
}

test();
