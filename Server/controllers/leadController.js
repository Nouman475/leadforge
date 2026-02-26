const Lead = require("../models/Lead");
const Joi = require("joi");
const XLSX = require("xlsx");

const leadSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  company: Joi.string().max(100).optional().allow(""),
  status: Joi.string().valid("new", "contacted", "qualified", "proposal", "closed", "lost").optional(),
  notes: Joi.string().optional().allow(""),
  source: Joi.string().max(50).optional().allow(""),
  score: Joi.number().min(0).max(100).optional(),
});

const updateLeadSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  company: Joi.string().max(100).optional().allow(""),
  status: Joi.string().valid("new", "contacted", "qualified", "proposal", "closed", "lost").optional(),
  notes: Joi.string().optional().allow(""),
  source: Joi.string().max(50).optional().allow(""),
  score: Joi.number().min(0).max(100).optional(),
});

class LeadController {
  async getAllLeads(req, res) {
    try {
      const { page = 1, limit = 10000000, status, search, sortBy = "created_at", sortOrder = "desc" } = req.query;
      
      const query = {};
      if (status && status !== "all") query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const [leads, count] = await Promise.all([
        Lead.find(query).sort(sort).skip(skip).limit(parseInt(limit)).select("-__v"),
        Lead.countDocuments(query)
      ]);

      res.json({
        success: true,
        data: {
          leads,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch leads", message: error.message });
    }
  }

  async getLeadById(req, res) {
    try {
      const lead = await Lead.findById(req.params.id);
      if (!lead) return res.status(404).json({ success: false, error: "Lead not found" });
      res.json({ success: true, data: lead });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch lead", message: error.message });
    }
  }

  async createLead(req, res) {
    try {
      const { error, value } = leadSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.details.map((d) => d.message),
        });
      }

      const existingLead = await Lead.findOne({ email: value.email });
      if (existingLead) {
        return res.status(409).json({ success: false, error: "Lead with this email already exists" });
      }

      const lead = await Lead.create(value);
      res.status(201).json({ success: true, message: "Lead created successfully", data: lead });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create lead", message: error.message });
    }
  }

  async bulkCreateLeads(req, res) {
    try {
      if (!req.file) return res.status(400).json({ success: false, error: "No file uploaded" });

      const file = req.file;
      let leadData = [];

      if (file.mimetype.includes("spreadsheet") || file.mimetype.includes("excel")) {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        leadData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      } else if (file.mimetype === "text/csv") {
        const csvData = file.buffer.toString("utf8");
        const workbook = XLSX.read(csvData, { type: "string" });
        leadData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
      } else {
        return res.status(400).json({ success: false, error: "Invalid file format" });
      }

      if (!leadData || leadData.length === 0) {
        return res.status(400).json({ success: false, error: "No data found in file" });
      }

      const normalizeKey = (key) => key.toLowerCase().trim().replace(/\s+/g, "");
      const normalizedLeads = leadData.map((lead) => {
        const normalized = {};
        Object.keys(lead).forEach((key) => {
          const nKey = normalizeKey(key);
          if (["name", "fullname", "leadname"].includes(nKey)) normalized.name = lead[key];
          else if (["email", "emailaddress"].includes(nKey)) normalized.email = lead[key];
          else if (["phone", "phonenumber", "mobile"].includes(nKey)) normalized.phone = lead[key];
          else if (["company", "companyname", "organization"].includes(nKey)) normalized.company = lead[key];
          else if (["status", "leadstatus"].includes(nKey)) normalized.status = lead[key]?.toLowerCase() || "new";
          else if (["notes", "comments", "description"].includes(nKey)) normalized.notes = lead[key];
        });
        return normalized;
      });

      const validLeads = [];
      const invalidLeads = [];
      const duplicateEmails = [];
      const existingEmails = new Set((await Lead.find({}, "email")).map(l => l.email.toLowerCase()));

      for (let i = 0; i < normalizedLeads.length; i++) {
        const lead = normalizedLeads[i];
        const rowNumber = i + 2;

        if (!lead.name || !lead.email) {
          invalidLeads.push({ row: rowNumber, data: lead, errors: [!lead.name ? "Name required" : null, !lead.email ? "Email required" : null].filter(Boolean) });
          continue;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
          invalidLeads.push({ row: rowNumber, data: lead, errors: ["Invalid email"] });
          continue;
        }

        const emailLower = lead.email.toLowerCase();
        if (existingEmails.has(emailLower)) {
          duplicateEmails.push({ row: rowNumber, email: lead.email, name: lead.name });
          continue;
        }

        existingEmails.add(emailLower);
        const { error, value } = leadSchema.validate(lead);
        if (error) {
          invalidLeads.push({ row: rowNumber, data: lead, errors: error.details.map(d => d.message) });
          continue;
        }

        validLeads.push({ ...value, status: value.status || "new" });
      }

      if ((invalidLeads.length > 0 || duplicateEmails.length > 0) && !req.body.forceImport) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          summary: { totalRows: leadData.length, validLeads: validLeads.length, invalidLeads: invalidLeads.length, duplicateEmails: duplicateEmails.length },
          invalidLeads,
          duplicateEmails,
          message: "Fix issues or use forceImport=true",
        });
      }

      if (validLeads.length > 0) {
        const createdLeads = await Lead.insertMany(validLeads);
        return res.status(201).json({
          success: true,
          message: `Successfully imported ${createdLeads.length} leads`,
          summary: { totalRows: leadData.length, imported: createdLeads.length, skipped: invalidLeads.length + duplicateEmails.length },
          data: createdLeads,
          ...(invalidLeads.length > 0 && { invalidLeads }),
          ...(duplicateEmails.length > 0 && { duplicateEmails }),
        });
      }

      return res.status(400).json({
        success: false,
        error: "No valid leads to import",
        summary: { totalRows: leadData.length, validLeads: 0, invalidLeads: invalidLeads.length, duplicateEmails: duplicateEmails.length },
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to import leads", message: error.message });
    }
  }

  async updateLead(req, res) {
    try {
      const { error, value } = updateLeadSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: "Validation failed", details: error.details.map(d => d.message) });
      }

      const lead = await Lead.findById(req.params.id);
      if (!lead) return res.status(404).json({ success: false, error: "Lead not found" });

      if (value.email && value.email !== lead.email) {
        const existing = await Lead.findOne({ email: value.email });
        if (existing) return res.status(409).json({ success: false, error: "Email already exists" });
      }

      if (value.status === "contacted" && lead.status !== "contacted") {
        value.last_contacted = new Date();
      }

      Object.assign(lead, value);
      await lead.save();

      res.json({ success: true, message: "Lead updated successfully", data: lead });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to update lead", message: error.message });
    }
  }

  async deleteLead(req, res) {
    try {
      const lead = await Lead.findByIdAndDelete(req.params.id);
      if (!lead) return res.status(404).json({ success: false, error: "Lead not found" });
      res.json({ success: true, message: "Lead deleted successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to delete lead", message: error.message });
    }
  }

  async getLeadStats(req, res) {
    try {
      const stats = await Lead.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const total = await Lead.countDocuments();
      const statusStats = { total, new: 0, contacted: 0, qualified: 0, proposal: 0, closed: 0, lost: 0 };
      
      stats.forEach(stat => {
        if (statusStats.hasOwnProperty(stat._id)) {
          statusStats[stat._id] = stat.count;
        }
      });

      res.json({ success: true, data: statusStats });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to fetch stats", message: error.message });
    }
  }
}

module.exports = new LeadController();
