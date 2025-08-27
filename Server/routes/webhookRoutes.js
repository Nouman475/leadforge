const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Email provider webhook endpoint
router.post('/email-events', webhookController.handleEmailEvent);

// Unsubscribe endpoint
router.get('/unsubscribe/:token', webhookController.handleUnsubscribe);
router.post('/unsubscribe/:token', webhookController.handleUnsubscribe);

module.exports = router;
