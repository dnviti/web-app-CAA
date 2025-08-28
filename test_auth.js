const axios = require('axios');

// Set up the same interceptor as the frontend
axios.interceptors.request.use(
    (config) => {
        const token = global.token;
        console.log('🌐 Axios interceptor triggered for:', config.url);
        console.log('🌐 Token found:', !!token);
        console.log('🌐 Token preview:', token ? token.substring(0, 50) + '...' : 'None');
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🌐 Added Authorization header');
        }
        
        return config;
    },
    (error) => {
        console.error('🌐 Request interceptor error:', error);
        return Promise.reject(error);
    }
);

async function testAuthFlow() {
    console.log('\n=== TESTING AUTHENTICATION FLOW ===\n');
    
    try {
        // Test 1: Login
        console.log('1. Testing login...');
        const loginResponse = await axios.post('http://localhost:6542/api/auth/login', {
            username: 'admin',
            password: 'admin123'
        });
        
        console.log('✅ Login successful!');
        console.log('   Status:', loginResponse.status);
        console.log('   Has token:', !!loginResponse.data.token);
        console.log('   Has refresh token:', !!loginResponse.data.refresh_token);
        console.log('   Username:', loginResponse.data.user?.username);
        
        // Store token globally for interceptor
        global.token = loginResponse.data.token;
        
        // Test 2: Test protected endpoint with token
        console.log('\n2. Testing protected grid endpoint with token...');
        const gridResponse = await axios.get('http://localhost:6542/api/grid');
        
        console.log('✅ Grid API successful!');
        console.log('   Status:', gridResponse.status);
        console.log('   Data keys:', Object.keys(gridResponse.data || {}));
        
        // Test 3: Test auth verify endpoint
        console.log('\n3. Testing auth verify endpoint...');
        const verifyResponse = await axios.get('http://localhost:6542/api/auth/verify');
        
        console.log('✅ Auth verify successful!');
        console.log('   Status:', verifyResponse.status);
        console.log('   Username:', verifyResponse.data?.username);
        
    } catch (error) {
        console.error('❌ Test failed:');
        console.error('   Message:', error.message);
        console.error('   Status:', error.response?.status);
        console.error('   Data:', error.response?.data);
    }
    
    console.log('\n=== TEST COMPLETE ===\n');
}

testAuthFlow();
