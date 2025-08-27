const {
  Lead,
  EmailCampaign,
  EmailHistory,
  EmailTemplate,
} = require("../models");
const { Op } = require("sequelize");
const moment = require("moment");

class DashboardController {
  constructor() {
    // Bind all methods to preserve 'this' context
    this.getDashboardStats = this.getDashboardStats.bind(this);
    this.getLeadFunnel = this.getLeadFunnel.bind(this);
    this.getEmailPerformanceOverTime =
      this.getEmailPerformanceOverTime.bind(this);
    this.getTemplateUsage = this.getTemplateUsage.bind(this);
  }

  // Get comprehensive dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const { period = "30" } = req.query; // days
      const startDate = moment().subtract(parseInt(period), "days").toDate();

      // Lead statistics
      const leadStats = await this.getLeadStats(startDate);

      // Email campaign statistics
      const campaignStats = await this.getCampaignStats(startDate);

      // Email performance statistics
      const emailStats = await this.getEmailStats(startDate);

      // Recent activity
      const recentActivity = await this.getRecentActivity();

      // Growth metrics
      const growthMetrics = await this.getGrowthMetrics(startDate);

      res.json({
        success: true,
        data: {
          leads: leadStats,
          campaigns: campaignStats,
          emails: emailStats,
          recentActivity,
          growth: growthMetrics,
          period: parseInt(period),
        },
      });
    } catch (error) {
      console.error("❌ Dashboard error:", error);
      console.error("Stack trace:", error.stack);
      res.status(500).json({
        success: false,
        error: "Failed to fetch dashboard statistics",
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }

  // Get lead statistics
  async getLeadStats(startDate) {
    const total = await Lead.count();
    const newLeads = await Lead.count({
      where: { created_at: { [Op.gte]: startDate } },
    });

    const statusDistribution = await Lead.findAll({
      attributes: [
        "status",
        [Lead.sequelize.fn("COUNT", Lead.sequelize.col("id")), "count"],
      ],
      group: ["status"],
    });

    const statusStats = {
      total,
      new: 0,
      contacted: 0,
      qualified: 0,
      proposal: 0,
      closed: 0,
    };

    statusDistribution.forEach((stat) => {
      statusStats[stat.status] = parseInt(stat.dataValues.count);
    });

    const conversionRate =
      total > 0 ? ((statusStats.closed / total) * 100).toFixed(2) : 0;

    return {
      ...statusStats,
      newLeads,
      conversionRate: parseFloat(conversionRate),
    };
  }

  // Get campaign statistics
  async getCampaignStats(startDate) {
    const totalCampaigns = await EmailCampaign.count();
    const recentCampaigns = await EmailCampaign.count({
      where: { created_at: { [Op.gte]: startDate } },
    });

    const statusDistribution = await EmailCampaign.findAll({
      attributes: [
        "status",
        [
          EmailCampaign.sequelize.fn(
            "COUNT",
            EmailCampaign.sequelize.col("id")
          ),
          "count",
        ],
      ],
      group: ["status"],
    });

    const statusStats = {
      draft: 0,
      scheduled: 0,
      sending: 0,
      completed: 0,
      failed: 0,
    };

    statusDistribution.forEach((stat) => {
      statusStats[stat.status] = parseInt(stat.dataValues.count);
    });

    return {
      total: totalCampaigns,
      recent: recentCampaigns,
      byStatus: statusStats,
    };
  }

  // Get email performance statistics
  async getEmailStats(startDate) {
    // Get all email counts without date filter first to show total stats
    const totalSent = await EmailHistory.count({
      where: { status: "sent" },
    });

    const totalFailed = await EmailHistory.count({
      where: { status: "failed" },
    });

    const totalOpened = await EmailHistory.count({
      where: { status: "opened" },
    });

    const totalClicked = await EmailHistory.count({
      where: { status: "clicked" },
    });

    // Also get recent stats for the period
    const recentSent = await EmailHistory.count({
      where: {
        status: "sent",
        sent_at: { [Op.gte]: startDate },
      },
    });

    const recentFailed = await EmailHistory.count({
      where: {
        status: "failed",
        created_at: { [Op.gte]: startDate },
      },
    });

    const openRate =
      totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : 0;
    const clickRate =
      totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : 0;
    const deliveryRate =
      totalSent + totalFailed > 0
        ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2)
        : 0;

    return {
      totalSent,
      totalFailed,
      totalOpened,
      totalClicked,
      recentSent,
      recentFailed,
      openRate: parseFloat(openRate),
      clickRate: parseFloat(clickRate),
      deliveryRate: parseFloat(deliveryRate),
    };
  }

  // Get recent activity
  async getRecentActivity() {
    const recentLeads = await Lead.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
      attributes: ["id", "name", "email", "status", "created_at"],
    });

    const recentCampaigns = await EmailCampaign.findAll({
      limit: 5,
      order: [["created_at", "DESC"]],
      attributes: ["id", "name", "status", "emails_sent", "created_at"],
    });

    const recentEmails = await EmailHistory.findAll({
      limit: 10,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Lead,
          as: "lead",
          attributes: ["name", "email"],
        },
      ],
      attributes: [
        "id",
        "recipient_name",
        "subject",
        "status",
        "sent_at",
        "created_at",
      ],
    });

    return {
      leads: recentLeads,
      campaigns: recentCampaigns,
      emails: recentEmails,
    };
  }

  // Get growth metrics
  async getGrowthMetrics(startDate) {
    const currentPeriodStart = startDate;
    const previousPeriodStart = moment(startDate)
      .subtract(moment().diff(startDate, "days"), "days")
      .toDate();

    // Lead growth
    const currentLeads = await Lead.count({
      where: { created_at: { [Op.gte]: currentPeriodStart } },
    });

    const previousLeads = await Lead.count({
      where: {
        created_at: {
          [Op.gte]: previousPeriodStart,
          [Op.lt]: currentPeriodStart,
        },
      },
    });

    const leadGrowth =
      previousLeads > 0
        ? (((currentLeads - previousLeads) / previousLeads) * 100).toFixed(2)
        : currentLeads > 0
        ? 100
        : 0;

    // Email growth
    const currentEmails = await EmailHistory.count({
      where: {
        status: "sent",
        sent_at: { [Op.gte]: currentPeriodStart },
      },
    });

    const previousEmails = await EmailHistory.count({
      where: {
        status: "sent",
        sent_at: {
          [Op.gte]: previousPeriodStart,
          [Op.lt]: currentPeriodStart,
        },
      },
    });

    const emailGrowth =
      previousEmails > 0
        ? (((currentEmails - previousEmails) / previousEmails) * 100).toFixed(2)
        : currentEmails > 0
        ? 100
        : 0;

    return {
      leads: {
        current: currentLeads,
        previous: previousLeads,
        growth: parseFloat(leadGrowth),
      },
      emails: {
        current: currentEmails,
        previous: previousEmails,
        growth: parseFloat(emailGrowth),
      },
    };
  }

  // Get lead funnel data
  async getLeadFunnel(req, res) {
    try {
      const { period = "30" } = req.query;
      const startDate = moment().subtract(parseInt(period), "days").toDate();

      const funnelData = await Lead.findAll({
        attributes: [
          "status",
          [Lead.sequelize.fn("COUNT", Lead.sequelize.col("id")), "count"],
        ],
        where: { created_at: { [Op.gte]: startDate } },
        group: ["status"],
      });

      const funnel = {
        new: 0,
        contacted: 0,
        qualified: 0,
        proposal: 0,
        closed: 0,
      };

      funnelData.forEach((item) => {
        funnel[item.status] = parseInt(item.dataValues.count);
      });

      // Calculate conversion rates
      const total = Object.values(funnel).reduce(
        (sum, count) => sum + count,
        0
      );
      const conversions = {
        newToContacted:
          funnel.new > 0
            ? ((funnel.contacted / funnel.new) * 100).toFixed(2)
            : 0,
        contactedToQualified:
          funnel.contacted > 0
            ? ((funnel.qualified / funnel.contacted) * 100).toFixed(2)
            : 0,
        qualifiedToProposal:
          funnel.qualified > 0
            ? ((funnel.proposal / funnel.qualified) * 100).toFixed(2)
            : 0,
        proposalToClosed:
          funnel.proposal > 0
            ? ((funnel.closed / funnel.proposal) * 100).toFixed(2)
            : 0,
        overallConversion:
          total > 0 ? ((funnel.closed / total) * 100).toFixed(2) : 0,
      };

      res.json({
        success: true,
        data: {
          funnel,
          conversions: Object.fromEntries(
            Object.entries(conversions).map(([key, value]) => [
              key,
              parseFloat(value),
            ])
          ),
          total,
          period: parseInt(period),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch lead funnel data",
        message: error.message,
      });
    }
  }

  // Get email performance over time
  async getEmailPerformanceOverTime(req, res) {
    try {
      const { period = "30" } = req.query;
      const startDate = moment().subtract(parseInt(period), "days").toDate();

      const dailyStats = await EmailHistory.findAll({
        attributes: [
          [
            EmailHistory.sequelize.fn(
              "DATE",
              EmailHistory.sequelize.col("sent_at")
            ),
            "date",
          ],
          "status",
          [
            EmailHistory.sequelize.fn(
              "COUNT",
              EmailHistory.sequelize.col("id")
            ),
            "count",
          ],
        ],
        where: {
          sent_at: { [Op.gte]: startDate },
          status: { [Op.in]: ["sent", "failed", "opened", "clicked"] },
        },
        group: [
          EmailHistory.sequelize.fn(
            "DATE",
            EmailHistory.sequelize.col("sent_at")
          ),
          "status",
        ],
        order: [
          [
            EmailHistory.sequelize.fn(
              "DATE",
              EmailHistory.sequelize.col("sent_at")
            ),
            "ASC",
          ],
        ],
      });

      // Process data for chart
      const chartData = {};
      dailyStats.forEach((stat) => {
        const date = stat.dataValues.date;
        if (!chartData[date]) {
          chartData[date] = { sent: 0, failed: 0, opened: 0, clicked: 0 };
        }
        chartData[date][stat.status] = parseInt(stat.dataValues.count);
      });

      res.json({
        success: true,
        data: {
          chartData,
          period: parseInt(period),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch email performance data",
        message: error.message,
      });
    }
  }

  // Get template usage statistics
  async getTemplateUsage(req, res) {
    try {
      const templateUsage = await EmailTemplate.findAll({
        attributes: ["id", "name", "category", "usage_count"],
        order: [["usage_count", "DESC"]],
        limit: 10,
      });

      const categoryUsage = await EmailTemplate.findAll({
        attributes: [
          "category",
          [
            EmailTemplate.sequelize.fn(
              "SUM",
              EmailTemplate.sequelize.col("usage_count")
            ),
            "total_usage",
          ],
        ],
        group: ["category"],
        order: [
          [
            EmailTemplate.sequelize.fn(
              "SUM",
              EmailTemplate.sequelize.col("usage_count")
            ),
            "DESC",
          ],
        ],
      });

      res.json({
        success: true,
        data: {
          topTemplates: templateUsage,
          categoryUsage: categoryUsage.map((item) => ({
            category: item.category,
            usage: parseInt(item.dataValues.total_usage),
          })),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to fetch template usage statistics",
        message: error.message,
      });
    }
  }
}

module.exports = new DashboardController();
