const { Lead, EmailHistory, EmailTemplate } = require('../models');
const { Op } = require('sequelize');

class LeadScoringService {
  constructor() {
    this.scoringRules = {
      emailOpened: 10,
      emailClicked: 25,
      multipleOpens: 5,  // Additional points for multiple opens
      multipleClicks: 15, // Additional points for multiple clicks
      quickResponse: 20,  // Opened within 1 hour
      engagementDecay: 0.9 // Decay factor for old interactions
    };
  }

  // Calculate and update lead score based on email interactions
  async updateLeadScore(leadId) {
    try {
      const lead = await Lead.findByPk(leadId);
      if (!lead) return;

      // Get all email interactions for this lead
      const emailHistory = await EmailHistory.findAll({
        where: { lead_id: leadId },
        order: [['created_at', 'DESC']],
        include: [{ model: EmailTemplate, as: 'template' }]
      });

      let totalScore = 0;
      const now = new Date();

      for (const email of emailHistory) {
        let emailScore = 0;

        // Base scoring
        if (email.opened_at) {
          emailScore += this.scoringRules.emailOpened;

          // Quick response bonus (opened within 1 hour)
          const timeDiff = new Date(email.opened_at) - new Date(email.sent_at);
          if (timeDiff < 3600000) { // 1 hour in milliseconds
            emailScore += this.scoringRules.quickResponse;
          }
        }

        if (email.clicked_at) {
          emailScore += this.scoringRules.emailClicked;
        }

        // Template category bonuses
        if (email.template) {
          switch (email.template.category) {
            case 'proposal':
              emailScore *= 1.5; // 50% bonus for proposal interactions
              break;
            case 'follow_up':
              emailScore *= 1.2; // 20% bonus for follow-up interactions
              break;
          }
        }

        // Time decay - older interactions worth less
        const daysSinceInteraction = (now - new Date(email.created_at)) / (1000 * 60 * 60 * 24);
        const decayFactor = Math.pow(this.scoringRules.engagementDecay, daysSinceInteraction / 30);
        emailScore *= decayFactor;

        totalScore += emailScore;
      }

      // Frequency bonuses
      const openCount = emailHistory.filter(e => e.opened_at).length;
      const clickCount = emailHistory.filter(e => e.clicked_at).length;

      if (openCount > 1) {
        totalScore += (openCount - 1) * this.scoringRules.multipleOpens;
      }

      if (clickCount > 1) {
        totalScore += (clickCount - 1) * this.scoringRules.multipleClicks;
      }

      // Cap the score at 100
      const finalScore = Math.min(Math.round(totalScore), 100);

      // Update lead score
      await lead.update({ lead_score: finalScore });

      console.log(`📊 Updated lead score for ${lead.email}: ${finalScore}`);
      return finalScore;

    } catch (error) {
      console.error('Error updating lead score:', error);
      return 0;
    }
  }

  // Batch update scores for all leads
  async updateAllLeadScores() {
    try {
      console.log('📊 Starting batch lead score update...');

      const leads = await Lead.findAll({
        where: {
          unsubscribed: false,
          status: { [Op.notIn]: ['closed', 'contact_failed'] }
        }
      });

      let updated = 0;
      for (const lead of leads) {
        await this.updateLeadScore(lead.id);
        updated++;

        // Small delay to avoid overwhelming the database
        if (updated % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`✅ Updated scores for ${updated} leads`);
    } catch (error) {
      console.error('Error in batch score update:', error);
    }
  }

  // Get lead scoring insights
  async getLeadScoreDistribution() {
    try {
      const distribution = await Lead.findAll({
        attributes: [
          'status',
          [Lead.sequelize.fn('AVG', Lead.sequelize.col('lead_score')), 'avg_score'],
          [Lead.sequelize.fn('COUNT', Lead.sequelize.col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      return distribution;
    } catch (error) {
      console.error('Error getting score distribution:', error);
      return [];
    }
  }

  // Identify high-value leads that need attention
  async getHighValueLeads() {
    try {
      const highValueLeads = await Lead.findAll({
        where: {
          lead_score: { [Op.gte]: 70 },
          status: { [Op.notIn]: ['closed', 'unsubscribed', 'contact_failed'] },
          unsubscribed: false
        },
        order: [['lead_score', 'DESC'], ['last_email_at', 'DESC']],
        limit: 20
      });

      return highValueLeads;
    } catch (error) {
      console.error('Error getting high-value leads:', error);
      return [];
    }
  }
}

module.exports = new LeadScoringService();
