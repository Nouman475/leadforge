const express = require('express');
const { sequelize } = require('./config/database');
const dashboardController = require('./controllers/dashboardController');

async function testDashboard() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create mock request and response objects
    const req = { query: { period: '30' } };
    const res = {
      json: (data) => {
        console.log('✅ Dashboard response:', JSON.stringify(data, null, 2));
        process.exit(0);
      },
      status: (code) => ({
        json: (data) => {
          console.log(`❌ Error ${code}:`, JSON.stringify(data, null, 2));
          process.exit(1);
        }
      })
    };

    // Test the dashboard endpoint
    console.log('🧪 Testing dashboard controller...');
    await dashboardController.getDashboardStats(req, res);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testDashboard();
