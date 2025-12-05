const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const { sequelize } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Import routes
const leadRoutes = require("./routes/leadRoutes");
const emailTemplateRoutes = require("./routes/emailTemplateRoutes");
const emailCampaignRoutes = require("./routes/emailCampaignRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const webhookRoutes = require("./routes/webhookRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
});

// Middleware
app.use(helmet());
// app.use(morgan('combined'));
app.use(limiter);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    memory: process.memoryUsage(),
    message: "LeadForge Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Routes
app.use("/api/leads", leadRoutes);
app.use("/api/email-templates", emailTemplateRoutes);
app.use("/api/email-campaigns", emailCampaignRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/webhooks", webhookRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `The requested route ${req.originalUrl} does not exist`,
  });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync database models
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✅ Database models synchronized");

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 LeadForge Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Unable to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

startServer();
