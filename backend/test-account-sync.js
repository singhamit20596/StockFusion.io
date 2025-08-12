// Test script to verify account creation and sync functionality
const axios = require('axios');

const API_BASE = 'http://localhost:5001';

async function testAccountCreationAndSync() {
  try {
    console.log('🧪 Testing Account Creation and Sync...');
    
    // Step 1: Create Account
    console.log('\n📝 Step 1: Creating account...');
    const accountData = {
      name: 'Test Demo Account',
      type: 'investment',
      balance: 10000
    };
    
    const accountResponse = await axios.post(`${API_BASE}/api/accounts`, accountData);
    console.log('✅ Account created:', accountResponse.data);
    
    const accountId = accountResponse.data.data.id;
    
    // Step 2: Sync with Demo Credentials
    console.log('\n🔄 Step 2: Syncing with demo credentials...');
    const syncCredentials = {
      username: 'demo@groww.com',
      password: 'demo123',
      pin: '1234'
    };
    
    try {
      const syncResponse = await axios.post(`${API_BASE}/api/accounts/${accountId}/sync`, syncCredentials);
      console.log('✅ Sync successful:', syncResponse.data);
      
      // Check if we got portfolio data
      if (syncResponse.data.success && syncResponse.data.data) {
        console.log('📊 Portfolio Summary:');
        console.log(`   - Total Stocks: ${syncResponse.data.data.summary.totalStocks}`);
        console.log(`   - Total Value: ₹${syncResponse.data.data.summary.totalValue}`);
        console.log(`   - Total Investment: ₹${syncResponse.data.data.summary.totalInvestment}`);
        console.log(`   - Profit/Loss: ₹${syncResponse.data.data.summary.totalProfitLoss}`);
      }
      
    } catch (syncError) {
      console.log('❌ Sync failed:', syncError.response?.data || syncError.message);
    }
    
    // Step 3: Test Invalid Credentials
    console.log('\n🧪 Step 3: Testing invalid credentials...');
    const invalidCredentials = {
      username: 'invalid@test.com',
      password: 'wrong',
      pin: '0000'
    };
    
    try {
      const invalidSyncResponse = await axios.post(`${API_BASE}/api/accounts/${accountId}/sync`, invalidCredentials);
      console.log('⚠️ Unexpected success with invalid credentials:', invalidSyncResponse.data);
    } catch (invalidSyncError) {
      console.log('✅ Correctly failed with invalid credentials:', invalidSyncError.response?.data?.message);
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAccountCreationAndSync();
