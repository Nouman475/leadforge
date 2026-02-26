const express = require('express');
const router = express.Router();
const emailCampaignController = require('../controllers/emailCampaignController');

// GET /api/email-campaigns - Get all email campaigns with filtering
router.get('/', emailCampaignController.getAllCampaigns);

// GET /api/email-campaigns/track/open/:id - Track email opens (pixel)
router.get('/track/open/:id', emailCampaignController.trackEmailOpen);

// GET /api/email-campaigns/track/click/:id - Track email clicks
router.get('/track/click/:id', emailCampaignController.trackEmailClick);

// GET /api/email-campaigns/history - Get all email history
router.get('/history', emailCampaignController.getAllEmailHistory);

// GET /api/email-campaigns/:id/stats - Get campaign statistics
router.get('/:id/stats', emailCampaignController.getCampaignStats);

// GET /api/email-campaigns/:id/history - Get email history for a campaign
router.get('/:id/history', emailCampaignController.getCampaignEmailHistory);

// GET /api/email-campaigns/:id - Get single campaign by ID
router.get('/:id', emailCampaignController.getCampaignById);

// POST /api/email-campaigns - Create and send bulk email campaign
router.post('/', emailCampaignController.createCampaign);

// PUT /api/email-campaigns/:id - Update email campaign
router.put('/:id', emailCampaignController.updateCampaign);

// DELETE /api/email-campaigns/:id - Delete email campaign
router.delete('/:id', emailCampaignController.deleteCampaign);

module.exports = router;
