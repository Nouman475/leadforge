const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const router = express.Router();

// GET /api/dashboard - Get comprehensive dashboard statistics
router.get('/', dashboardController.getDashboardStats);

// GET /api/dashboard/funnel - Get lead funnel data
router.get('/funnel', dashboardController.getLeadFunnel);

// GET /api/dashboard/email-performance - Get email performance over time
router.get('/email-performance', dashboardController.getEmailPerformanceOverTime);

// GET /api/dashboard/template-usage - Get template usage statistics
router.get('/template-usage', dashboardController.getTemplateUsage);

module.exports = router;
