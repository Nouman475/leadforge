const { Lead } = require("../models");
const { Op } = require("sequelize");
const Joi = require("joi");
const XLSX = require("xlsx");
// Validation schemas
const leadSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  company: Joi.string().max(100).optional().allow(""),
  status: Joi.string()
    .valid("new", "contacted", "qualified", "proposal", "closed")
    .optional(),
  notes: Joi.string().optional().allow(""),
  source: Joi.string().max(50).optional().allow(""),
  lead_score: Joi.number().min(0).max(100).optional(),
});

const updateLeadSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().min(10).max(20).optional().allow(""),
  company: Joi.string().max(100).optional().allow(""),
  status: Joi.string()
    .valid("new", "contacted", "qualified", "proposal", "closed")
    .optional(),
  notes: Joi.string().optional().allow(""),
  source: Joi.string().max(50).optional().allow(""),
  lead_score: Joi.number().min(0).max(100).optional(),
});

class LeadController {
  // Get all leads with filtering and pagination
  async getAllLeads(req, res) {
    try {
      const {
        page = 1,
        limit = 10000000,
        status,
        search,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Filter by status
      if (status && status !== "all") {
        whereClause.status = status;
      }

      // Search functionality
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { company: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Lead.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        attributes: { exclude: ["updated_at"] },
      });

      res.json({
        success: true,
        data: {
          leads: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalItems: count,
            itemsPerPage: parseInt(limit),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch leads",
        message: error.message,
      });
    }
  }

  // Get single lead by ID
  async getLeadById(req, res) {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: "Lead not found",
        });
      }

      res.json({
        success: true,
        data: lead,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch lead",
        message: error.message,
      });
    }
  }

  // Create new lead
  async createLead(req, res) {
    try {
      const { error, value } = leadSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.details.map((detail) => detail.message),
        });
      }

      // Check if email already exists
      const existingLead = await Lead.findOne({
        where: { email: value.email },
      });
      if (existingLead) {
        return res.status(409).json({
          success: false,
          error: "Lead with this email already exists",
        });
      }

      const lead = await Lead.create(value);

      res.status(201).json({
        success: true,
        message: "Lead created successfully",
        data: lead,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to create lead",
        message: error.message,
      });
    }
  }

  // Bulk add leads
  async bulkCreateLeads(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      const file = req.file;
      let leadData = [];

      // Parse Excel or CSV file
      if (
        file.mimetype ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.mimetype === "application/vnd.ms-excel"
      ) {
        // Handle Excel files
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        leadData = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.mimetype === "text/csv") {
        // Handle CSV files
        const csvData = file.buffer.toString("utf8");
        const workbook = XLSX.read(csvData, { type: "string" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        leadData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        return res.status(400).json({
          success: false,
          error:
            "Invalid file format. Please upload Excel (.xlsx) or CSV files only.",
        });
      }

      if (!leadData || leadData.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No data found in the uploaded file",
        });
      }

      // Normalize column names (handle case variations and spaces)
      const normalizeKey = (key) => {
        return key.toLowerCase().trim().replace(/\s+/g, "");
      };

      const normalizedLeads = leadData.map((lead) => {
        const normalizedLead = {};
        Object.keys(lead).forEach((key) => {
          const normalizedKey = normalizeKey(key);
          switch (normalizedKey) {
            case "name":
            case "fullname":
            case "leadname":
              normalizedLead.name = lead[key];
              break;
            case "email":
            case "emailaddress":
              normalizedLead.email = lead[key];
              break;
            case "phone":
            case "phonenumber":
            case "mobile":
              normalizedLead.phone = lead[key];
              break;
            case "company":
            case "companyname":
            case "organization":
              normalizedLead.company = lead[key];
              break;
            case "status":
            case "leadstatus":
              normalizedLead.status = lead[key]
                ? lead[key].toLowerCase()
                : "new";
              break;
            case "notes":
            case "comments":
            case "description":
              normalizedLead.notes = lead[key];
              break;
            default:
              break;
          }
        });
        return normalizedLead;
      });

      // Validate and process leads
      const validLeads = [];
      const invalidLeads = [];
      const duplicateEmails = [];
      const existingEmails = new Set();

      // Get existing emails from database to check for duplicates
      const existingLeadsEmails = await Lead.findAll({
        attributes: ["email"],
        raw: true,
      });
      existingLeadsEmails.forEach((lead) =>
        existingEmails.add(lead.email.toLowerCase())
      );

      for (let i = 0; i < normalizedLeads.length; i++) {
        const lead = normalizedLeads[i];
        const rowNumber = i + 2; // +2 because Excel rows start from 1 and first row is usually header

        // Validate required fields
        if (!lead.name || !lead.email) {
          invalidLeads.push({
            row: rowNumber,
            data: lead,
            errors: [
              !lead.name ? "Name is required" : null,
              !lead.email ? "Email is required" : null,
            ].filter(Boolean),
          });
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(lead.email)) {
          invalidLeads.push({
            row: rowNumber,
            data: lead,
            errors: ["Invalid email format"],
          });
          continue;
        }

        // Check for duplicate emails
        const emailLower = lead.email.toLowerCase();
        if (existingEmails.has(emailLower)) {
          duplicateEmails.push({
            row: rowNumber,
            email: lead.email,
            name: lead.name,
          });
          continue;
        }

        // Add email to existing set to check for duplicates within the file
        existingEmails.add(emailLower);

        // Validate lead against schema
        const { error, value } = leadSchema.validate(lead);
        if (error) {
          invalidLeads.push({
            row: rowNumber,
            data: lead,
            errors: error.details.map((detail) => detail.message),
          });
          continue;
        }

        validLeads.push({
          ...value,
          status: value.status || "new",
        });
      }

      // If there are validation errors and user didn't force import
      if (
        (invalidLeads.length > 0 || duplicateEmails.length > 0) &&
        !req.body.forceImport
      ) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          summary: {
            totalRows: leadData.length,
            validLeads: validLeads.length,
            invalidLeads: invalidLeads.length,
            duplicateEmails: duplicateEmails.length,
          },
          invalidLeads,
          duplicateEmails,
          message:
            "Fix the issues above or use forceImport=true to import only valid leads",
        });
      }

      // Insert valid leads into database
      if (validLeads.length > 0) {
        const createdLeads = await Lead.bulkCreate(validLeads, {
          validate: true,
          returning: true,
        });

        return res.status(201).json({
          success: true,
          message: `Successfully imported ${createdLeads.length} leads`,
          summary: {
            totalRows: leadData.length,
            imported: createdLeads.length,
            skipped: invalidLeads.length + duplicateEmails.length,
          },
          data: createdLeads,
          ...(invalidLeads.length > 0 && { invalidLeads }),
          ...(duplicateEmails.length > 0 && { duplicateEmails }),
        });
      } else {
        return res.status(400).json({
          success: false,
          error: "No valid leads found to import",
          summary: {
            totalRows: leadData.length,
            validLeads: 0,
            invalidLeads: invalidLeads.length,
            duplicateEmails: duplicateEmails.length,
          },
        });
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to import leads",
        message: error.message,
      });
    }
  }

  // Update lead
  async updateLead(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = updateLeadSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: error.details.map((detail) => detail.message),
        });
      }

      const lead = await Lead.findByPk(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: "Lead not found",
        });
      }

      // Check email uniqueness if email is being updated
      if (value.email && value.email !== lead.email) {
        const existingLead = await Lead.findOne({
          where: { email: value.email },
        });
        if (existingLead) {
          return res.status(409).json({
            success: false,
            error: "Lead with this email already exists",
          });
        }
      }

      // Update last_contacted if status is being changed to contacted
      if (value.status === "contacted" && lead.status !== "contacted") {
        value.last_contacted = new Date();
      }

      await lead.update(value);

      res.json({
        success: true,
        message: "Lead updated successfully",
        data: lead,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to update lead",
        message: error.message,
      });
    }
  }

  // Delete lead
  async deleteLead(req, res) {
    try {
      const { id } = req.params;

      const lead = await Lead.findByPk(id);

      if (!lead) {
        return res.status(404).json({
          success: false,
          error: "Lead not found",
        });
      }

      await lead.destroy();

      res.json({
        success: true,
        message: "Lead deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to delete lead",
        message: error.message,
      });
    }
  }

  // Get lead statistics
  async getLeadStats(req, res) {
    try {
      const stats = await Lead.findAll({
        attributes: [
          "status",
          [Lead.sequelize.fn("COUNT", Lead.sequelize.col("id")), "count"],
        ],
        group: ["status"],
      });

      const total = await Lead.count();

      const statusStats = {
        total,
        new: 0,
        contacted: 0,
        qualified: 0,
        proposal: 0,
        closed: 0,
      };

      stats.forEach((stat) => {
        statusStats[stat.status] = parseInt(stat.dataValues.count);
      });

      res.json({
        success: true,
        data: statusStats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch lead statistics",
        message: error.message,
      });
    }
  }
}

module.exports = new LeadController();
