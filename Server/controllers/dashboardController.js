const Lead = require('../models/Lead');
const EmailCampaign = require('../models/EmailCampaign');
const EmailHistory = require('../models/EmailHistory');
const EmailTemplate = require('../models/EmailTemplate');
const moment = require('moment');

class DashboardController {
  async getDashboardStats(req, res) {
    try {
      const { period = '30' } = req.query;
      const startDate = moment().subtract(parseInt(period), 'days').toDate();

      const [leadStats, campaignStats, emailStats, recentActivity, growthMetrics] = await Promise.all([
        this.getLeadStats(startDate),
        this.getCampaignStats(startDate),
        this.getEmailStats(startDate),
        this.getRecentActivity(),
        this.getGrowthMetrics(startDate)
      ]);

      res.json({
        success: true,
        data: {
          leads: leadStats,
          campaigns: campaignStats,
          emails: emailStats,
          recentActivity,
          growth: growthMetrics,
          period: parseInt(period)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats', message: error.message });
    }
  }

  async getLeadStats(startDate) {
    const [total, newLeads, statusDistribution] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ created_at: { $gte: startDate } }),
      Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const statusStats = { total, new: 0, contacted: 0, qualified: 0, proposal: 0, closed: 0, lost: 0 };
    statusDistribution.forEach(s => { if (statusStats.hasOwnProperty(s._id)) statusStats[s._id] = s.count; });

    const conversionRate = total > 0 ? ((statusStats.closed / total) * 100).toFixed(2) : 0;

    return { ...statusStats, newLeads, conversionRate: parseFloat(conversionRate) };
  }

  async getCampaignStats(startDate) {
    const [total, recent, statusDistribution] = await Promise.all([
      EmailCampaign.countDocuments(),
      EmailCampaign.countDocuments({ created_at: { $gte: startDate } }),
      EmailCampaign.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);

    const statusStats = { draft: 0, scheduled: 0, sending: 0, completed: 0, failed: 0 };
    statusDistribution.forEach(s => { if (statusStats.hasOwnProperty(s._id)) statusStats[s._id] = s.count; });

    return { total, recent, byStatus: statusStats };
  }

  async getEmailStats(startDate) {
    const [totalSent, totalFailed, totalOpened, totalClicked, recentSent, recentFailed] = await Promise.all([
      EmailHistory.countDocuments({ status: 'sent' }),
      EmailHistory.countDocuments({ status: 'failed' }),
      EmailHistory.countDocuments({ opened_at: { $exists: true, $ne: null } }),
      EmailHistory.countDocuments({ clicked_at: { $exists: true, $ne: null } }),
      EmailHistory.countDocuments({ status: 'sent', sent_at: { $gte: startDate } }),
      EmailHistory.countDocuments({ status: 'failed', created_at: { $gte: startDate } })
    ]);

    const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : 0;
    const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : 0;
    const deliveryRate = (totalSent + totalFailed) > 0 ? ((totalSent / (totalSent + totalFailed)) * 100).toFixed(2) : 0;

    return {
      totalSent,
      totalFailed,
      totalOpened,
      totalClicked,
      recentSent,
      recentFailed,
      openRate: parseFloat(openRate),
      clickRate: parseFloat(clickRate),
      deliveryRate: parseFloat(deliveryRate)
    };
  }

  async getRecentActivity() {
    const [recentLeads, recentCampaigns, recentEmails] = await Promise.all([
      Lead.find().sort({ created_at: -1 }).limit(5).select('name email status created_at'),
      EmailCampaign.find().sort({ created_at: -1 }).limit(5).select('name status emails_sent created_at'),
      EmailHistory.find().sort({ created_at: -1 }).limit(10).populate('lead_id', 'name email').select('recipient_name subject status sent_at created_at')
    ]);

    return { leads: recentLeads, campaigns: recentCampaigns, emails: recentEmails };
  }

  async getGrowthMetrics(startDate) {
    const daysDiff = moment().diff(startDate, 'days');
    const previousPeriodStart = moment(startDate).subtract(daysDiff, 'days').toDate();

    const [currentLeads, previousLeads, currentEmails, previousEmails] = await Promise.all([
      Lead.countDocuments({ created_at: { $gte: startDate } }),
      Lead.countDocuments({ created_at: { $gte: previousPeriodStart, $lt: startDate } }),
      EmailHistory.countDocuments({ status: 'sent', sent_at: { $gte: startDate } }),
      EmailHistory.countDocuments({ status: 'sent', sent_at: { $gte: previousPeriodStart, $lt: startDate } })
    ]);

    const leadGrowth = previousLeads > 0 ? (((currentLeads - previousLeads) / previousLeads) * 100).toFixed(2) : (currentLeads > 0 ? 100 : 0);
    const emailGrowth = previousEmails > 0 ? (((currentEmails - previousEmails) / previousEmails) * 100).toFixed(2) : (currentEmails > 0 ? 100 : 0);

    return {
      leads: { current: currentLeads, previous: previousLeads, growth: parseFloat(leadGrowth) },
      emails: { current: currentEmails, previous: previousEmails, growth: parseFloat(emailGrowth) }
    };
  }

  async getLeadFunnel(req, res) {
    try {
      const { period = '30' } = req.query;
      const startDate = moment().subtract(parseInt(period), 'days').toDate();

      const funnelData = await Lead.aggregate([
        { $match: { created_at: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const funnel = { new: 0, contacted: 0, qualified: 0, proposal: 0, closed: 0, lost: 0 };
      funnelData.forEach(item => { if (funnel.hasOwnProperty(item._id)) funnel[item._id] = item.count; });

      const total = Object.values(funnel).reduce((sum, count) => sum + count, 0);
      const conversions = {
        newToContacted: funnel.new > 0 ? ((funnel.contacted / funnel.new) * 100).toFixed(2) : 0,
        contactedToQualified: funnel.contacted > 0 ? ((funnel.qualified / funnel.contacted) * 100).toFixed(2) : 0,
        qualifiedToProposal: funnel.qualified > 0 ? ((funnel.proposal / funnel.qualified) * 100).toFixed(2) : 0,
        proposalToClosed: funnel.proposal > 0 ? ((funnel.closed / funnel.proposal) * 100).toFixed(2) : 0,
        overallConversion: total > 0 ? ((funnel.closed / total) * 100).toFixed(2) : 0
      };

      res.json({
        success: true,
        data: {
          funnel,
          conversions: Object.fromEntries(Object.entries(conversions).map(([k, v]) => [k, parseFloat(v)])),
          total,
          period: parseInt(period)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch funnel data', message: error.message });
    }
  }

  async getEmailPerformanceOverTime(req, res) {
    try {
      const { period = '30' } = req.query;
      const startDate = moment().subtract(parseInt(period), 'days').toDate();

      const dailyStats = await EmailHistory.aggregate([
        { $match: { sent_at: { $gte: startDate }, status: { $in: ['sent', 'failed', 'opened', 'clicked'] } } },
        {
          $group: {
            _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$sent_at' } }, status: '$status' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ]);

      const chartData = {};
      dailyStats.forEach(stat => {
        const date = stat._id.date;
        if (!chartData[date]) chartData[date] = { sent: 0, failed: 0, opened: 0, clicked: 0 };
        chartData[date][stat._id.status] = stat.count;
      });

      res.json({ success: true, data: { chartData, period: parseInt(period) } });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch performance data', message: error.message });
    }
  }

  async getTemplateUsage(req, res) {
    try {
      const [topTemplates, categoryUsage] = await Promise.all([
        EmailTemplate.find().sort({ usage_count: -1 }).limit(10).select('name category usage_count'),
        EmailTemplate.aggregate([
          { $group: { _id: '$category', total_usage: { $sum: '$usage_count' } } },
          { $sort: { total_usage: -1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          topTemplates,
          categoryUsage: categoryUsage.map(item => ({ category: item._id, usage: item.total_usage }))
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch template usage', message: error.message });
    }
  }
}

module.exports = new DashboardController();
