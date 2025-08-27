const express = require("express");
const leadController = require("../controllers/leadController");
const upload = require("../config/multer");
const router = express.Router();

// GET /api/leads - Get all leads with filtering and pagination
router.get("/", leadController.getAllLeads);

// GET /api/leads/stats - Get lead statistics
router.get("/stats", leadController.getLeadStats);

// GET /api/leads/:id - Get single lead by ID
router.get("/:id", leadController.getLeadById);

// POST /api/leads - Create new lead
router.post("/", leadController.createLead);

// POST /api/leads/bulk - Bulk create leads
router.post("/bulk", upload.single("file"), leadController.bulkCreateLeads);

// PUT /api/leads/:id - Update lead
router.put("/:id", leadController.updateLead);

// DELETE /api/leads/:id - Delete lead
router.delete("/:id", leadController.deleteLead);

module.exports = router;
