// Test script to validate frontend API client
import { apiClient, apiRequest } from './src/api/client.ts';

console.log('Testing API client...');

// Set a test token in localStorage
localStorage.setItem('jwt_token', 'test-token');

// Make a test request
async function testApiRequest() {
    console.log('Making test request...');
    
    try {
        const response = await apiRequest('GET', '/api/grid');
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Test the axios client directly
async function testAxiosClient() {
    console.log('Testing axios client directly...');
    
    try {
        const response = await apiClient.get('/api/grid');
        console.log('Axios response:', response);
    } catch (error) {
        console.error('Axios error:', error);
    }
}

console.log('Running tests...');
testApiRequest();
testAxiosClient();
