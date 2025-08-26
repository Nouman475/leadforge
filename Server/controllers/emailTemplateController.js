const { EmailTemplate } = require('../models');
const { Op } = require('sequelize');
const Joi = require('joi');

// Validation schemas
const templateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string().valid('introduction', 'followup', 'proposal', 'meeting', 'thankyou', 'reminder', 'custom').required(),
  tone: Joi.string().valid('professional', 'friendly', 'casual', 'formal', 'persuasive').required(),
  subject: Joi.string().max(200).optional().allow(''),
  content: Joi.string().required(),
  is_active: Joi.boolean().optional()
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  category: Joi.string().valid('introduction', 'followup', 'proposal', 'meeting', 'thankyou', 'reminder', 'custom').optional(),
  tone: Joi.string().valid('professional', 'friendly', 'casual', 'formal', 'persuasive').optional(),
  subject: Joi.string().max(200).optional().allow(''),
  content: Joi.string().optional(),
  is_active: Joi.boolean().optional()
});

class EmailTemplateController {
  // Get all email templates with filtering
  async getAllTemplates(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        tone, 
        search, 
        is_active = true,
        sortBy = 'created_at', 
        sortOrder = 'DESC' 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Filter by active status
      if (is_active !== 'all') {
        whereClause.is_active = is_active === 'true' || is_active === true;
      }

      // Filter by category
      if (category && category !== 'all') {
        whereClause.category = category;
      }

      // Filter by tone
      if (tone && tone !== 'all') {
        whereClause.tone = tone;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { subject: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const { count, rows } = await EmailTemplate.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]]
      });

      res.json({
        success: true,
        data: {
          templates: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email templates',
        message: error.message
      });
    }
  }

  // Get single template by ID
  async getTemplateById(req, res) {
    try {
      const { id } = req.params;
      
      const template = await EmailTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Email template not found'
        });
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch email template',
        message: error.message
      });
    }
  }

  // Create new email template
  async createTemplate(req, res) {
    try {
      const { error, value } = templateSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const template = await EmailTemplate.create(value);
      
      res.status(201).json({
        success: true,
        message: 'Email template created successfully',
        data: template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create email template',
        message: error.message
      });
    }
  }

  // Update email template
  async updateTemplate(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateTemplateSchema.validate(req.body);
      
      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details.map(detail => detail.message)
        });
      }

      const template = await EmailTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Email template not found'
        });
      }

      await template.update(value);
      
      res.json({
        success: true,
        message: 'Email template updated successfully',
        data: template
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update email template',
        message: error.message
      });
    }
  }

  // Delete email template
  async deleteTemplate(req, res) {
    try {
      const { id } = req.params;
      
      const template = await EmailTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Email template not found'
        });
      }

      await template.destroy();
      
      res.json({
        success: true,
        message: 'Email template deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete email template',
        message: error.message
      });
    }
  }

  // Clone email template
  async cloneTemplate(req, res) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Template name is required for cloning'
        });
      }

      const originalTemplate = await EmailTemplate.findByPk(id);
      
      if (!originalTemplate) {
        return res.status(404).json({
          success: false,
          error: 'Email template not found'
        });
      }

      const clonedTemplate = await EmailTemplate.create({
        name,
        category: originalTemplate.category,
        tone: originalTemplate.tone,
        subject: originalTemplate.subject,
        content: originalTemplate.content,
        is_active: true,
        usage_count: 0
      });

      res.status(201).json({
        success: true,
        message: 'Email template cloned successfully',
        data: clonedTemplate
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to clone email template',
        message: error.message
      });
    }
  }

  // Get template statistics
  async getTemplateStats(req, res) {
    try {
      const categoryStats = await EmailTemplate.findAll({
        attributes: [
          'category',
          [EmailTemplate.sequelize.fn('COUNT', EmailTemplate.sequelize.col('id')), 'count']
        ],
        group: ['category'],
        where: { is_active: true }
      });

      const toneStats = await EmailTemplate.findAll({
        attributes: [
          'tone',
          [EmailTemplate.sequelize.fn('COUNT', EmailTemplate.sequelize.col('id')), 'count']
        ],
        group: ['tone'],
        where: { is_active: true }
      });

      const total = await EmailTemplate.count({ where: { is_active: true } });
      const totalUsage = await EmailTemplate.sum('usage_count');

      res.json({
        success: true,
        data: {
          total,
          totalUsage: totalUsage || 0,
          byCategory: categoryStats.reduce((acc, stat) => {
            acc[stat.category] = parseInt(stat.dataValues.count);
            return acc;
          }, {}),
          byTone: toneStats.reduce((acc, stat) => {
            acc[stat.tone] = parseInt(stat.dataValues.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch template statistics',
        message: error.message
      });
    }
  }

  // Increment template usage count
  async incrementUsage(req, res) {
    try {
      const { id } = req.params;
      
      const template = await EmailTemplate.findByPk(id);
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Email template not found'
        });
      }

      await template.increment('usage_count');
      
      res.json({
        success: true,
        message: 'Template usage count updated',
        data: { usage_count: template.usage_count + 1 }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update template usage',
        message: error.message
      });
    }
  }
}

module.exports = new EmailTemplateController();
