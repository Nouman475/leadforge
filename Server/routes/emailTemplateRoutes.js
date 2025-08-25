const express = require('express');
const emailTemplateController = require('../controllers/emailTemplateController');
const router = express.Router();

// GET /api/email-templates - Get all email templates with filtering
router.get('/', emailTemplateController.getAllTemplates);

// GET /api/email-templates/stats - Get template statistics
router.get('/stats', emailTemplateController.getTemplateStats);

// GET /api/email-templates/:id - Get single template by ID
router.get('/:id', emailTemplateController.getTemplateById);

// POST /api/email-templates - Create new email template
router.post('/', emailTemplateController.createTemplate);

// POST /api/email-templates/:id/clone - Clone email template
router.post('/:id/clone', emailTemplateController.cloneTemplate);

// POST /api/email-templates/:id/increment-usage - Increment template usage count
router.post('/:id/increment-usage', emailTemplateController.incrementUsage);

// PUT /api/email-templates/:id - Update email template
router.put('/:id', emailTemplateController.updateTemplate);

// DELETE /api/email-templates/:id - Delete email template
router.delete('/:id', emailTemplateController.deleteTemplate);

module.exports = router;
