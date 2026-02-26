const EmailTemplate = require('../models/EmailTemplate');
const Joi = require('joi');

const templateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  category: Joi.string().valid('introduction', 'followup', 'proposal', 'meeting', 'thankyou', 'reminder', 'custom').required(),
  tone: Joi.string().valid('professional', 'friendly', 'casual', 'formal', 'persuasive').required(),
  subject: Joi.string().max(200).optional().allow(''),
  content: Joi.string().required(),
  is_favorite: Joi.boolean().optional()
});

const updateTemplateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  category: Joi.string().valid('introduction', 'followup', 'proposal', 'meeting', 'thankyou', 'reminder', 'custom').optional(),
  tone: Joi.string().valid('professional', 'friendly', 'casual', 'formal', 'persuasive').optional(),
  subject: Joi.string().max(200).optional().allow(''),
  content: Joi.string().optional(),
  is_favorite: Joi.boolean().optional()
});

class EmailTemplateController {
  async getAllTemplates(req, res) {
    try {
      const { page = 1, limit = 10, category, tone, search, is_favorite, sortBy = 'created_at', sortOrder = 'desc' } = req.query;

      const query = {};
      if (category && category !== 'all') query.category = category;
      if (tone && tone !== 'all') query.tone = tone;
      if (is_favorite === 'true') query.is_favorite = true;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [templates, count] = await Promise.all([
        EmailTemplate.find(query).sort(sort).skip(skip).limit(parseInt(limit)),
        EmailTemplate.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          templates,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch templates', message: error.message });
    }
  }

  async getTemplateById(req, res) {
    try {
      const template = await EmailTemplate.findById(req.params.id);
      if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
      res.json({ success: true, data: template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch template', message: error.message });
    }
  }

  async createTemplate(req, res) {
    try {
      const { error, value } = templateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.details.map(d => d.message) });
      }

      const template = await EmailTemplate.create(value);
      res.status(201).json({ success: true, message: 'Template created successfully', data: template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to create template', message: error.message });
    }
  }

  async updateTemplate(req, res) {
    try {
      const { error, value } = updateTemplateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: error.details.map(d => d.message) });
      }

      const template = await EmailTemplate.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
      if (!template) return res.status(404).json({ success: false, error: 'Template not found' });

      res.json({ success: true, message: 'Template updated successfully', data: template });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update template', message: error.message });
    }
  }

  async deleteTemplate(req, res) {
    try {
      const template = await EmailTemplate.findByIdAndDelete(req.params.id);
      if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
      res.json({ success: true, message: 'Template deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to delete template', message: error.message });
    }
  }

  async cloneTemplate(req, res) {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Template name required' });

      const original = await EmailTemplate.findById(req.params.id);
      if (!original) return res.status(404).json({ success: false, error: 'Template not found' });

      const cloned = await EmailTemplate.create({
        name,
        category: original.category,
        tone: original.tone,
        subject: original.subject,
        content: original.content,
        is_favorite: false,
        usage_count: 0
      });

      res.status(201).json({ success: true, message: 'Template cloned successfully', data: cloned });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to clone template', message: error.message });
    }
  }

  async getTemplateStats(req, res) {
    try {
      const [categoryStats, toneStats, total, totalUsage] = await Promise.all([
        EmailTemplate.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
        EmailTemplate.aggregate([{ $group: { _id: '$tone', count: { $sum: 1 } } }]),
        EmailTemplate.countDocuments(),
        EmailTemplate.aggregate([{ $group: { _id: null, total: { $sum: '$usage_count' } } }])
      ]);

      res.json({
        success: true,
        data: {
          total,
          totalUsage: totalUsage[0]?.total || 0,
          byCategory: categoryStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
          byTone: toneStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {})
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch stats', message: error.message });
    }
  }

  async incrementUsage(req, res) {
    try {
      const template = await EmailTemplate.findByIdAndUpdate(
        req.params.id,
        { $inc: { usage_count: 1 }, last_used_at: new Date() },
        { new: true }
      );

      if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
      res.json({ success: true, message: 'Usage count updated', data: { usage_count: template.usage_count } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to update usage', message: error.message });
    }
  }
}

module.exports = new EmailTemplateController();
