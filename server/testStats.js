const axios = require('axios');
require('dotenv').config();

const port = process.env.PORT || 5000;
const baseUrl = `http://localhost:${port}`;

async function testStats() {
    try {
        console.log(`Testing /api/stats endpoint at ${baseUrl}...`);
        const response = await axios.get(`${baseUrl}/api/stats`);
        console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
        console.error('Status:', error.response?.status);
    }
}

testStats();
