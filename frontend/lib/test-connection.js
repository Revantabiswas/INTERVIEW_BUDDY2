import api from './api';

// Simple function to test backend connectivity
export async function testBackendConnection() {
  try {
    console.log('Testing backend connection to port 5000...');
    // Try to get documents list as a simple test
    const response = await api.documents.getAll();
    console.log('Successfully connected to backend at port 5000!');
    console.log('Response data:', response.data);
    return true;
  } catch (error) {
    console.error('Backend connection test failed:');
    console.error('Error details:', error.userMessage || error.message);
    console.error('Please make sure the backend server is running on port 5000');
    return false;
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined' && window.runConnectionTest) {
  testBackendConnection()
    .then(success => console.log(`Connection test ${success ? 'passed' : 'failed'}`))
    .catch(err => console.error('Test threw an exception:', err));
}
