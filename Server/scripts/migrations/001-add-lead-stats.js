const { QueryInterface, Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Helper function to add column if it doesn't exist
      const addColumnIfNotExists = async (tableName, columnName, columnDefinition) => {
        try {
          const tableDescription = await queryInterface.describeTable(tableName);
          if (!tableDescription[columnName]) {
            await queryInterface.addColumn(tableName, columnName, columnDefinition, { transaction });
            console.log(`✅ Added column: ${columnName}`);
          } else {
            console.log(`⏭️  Column already exists: ${columnName}`);
          }
        } catch (error) {
          console.error(`❌ Error adding column ${columnName}:`, error.message);
          throw error;
        }
      };

      // Helper function to add index if it doesn't exist
      const addIndexIfNotExists = async (tableName, fields, indexName) => {
        try {
          const indexes = await queryInterface.showIndex(tableName);
          const indexExists = indexes.some(index => 
            index.name === indexName || 
            (Array.isArray(fields) ? 
              JSON.stringify(index.fields.map(f => f.attribute).sort()) === JSON.stringify(fields.sort()) :
              index.fields.some(f => f.attribute === fields)
            )
          );
          
          if (!indexExists) {
            await queryInterface.addIndex(tableName, fields, { 
              name: indexName,
              transaction 
            });
            console.log(`✅ Added index: ${indexName}`);
          } else {
            console.log(`⏭️  Index already exists: ${indexName}`);
          }
        } catch (error) {
          console.error(`❌ Error adding index ${indexName}:`, error.message);
          // Don't throw for index errors, just log them
        }
      };

      // Add statistics columns to leads table
      await addColumnIfNotExists('leads', 'emails_sent_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });

      await addColumnIfNotExists('leads', 'emails_failed_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });

      await addColumnIfNotExists('leads', 'emails_opened_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });

      await addColumnIfNotExists('leads', 'emails_clicked_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });

      await addColumnIfNotExists('leads', 'last_email_at', {
        type: Sequelize.DATE,
        allowNull: true
      });

      await addColumnIfNotExists('leads', 'last_template_id', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'email_templates',
          key: 'id'
        }
      });

      await addColumnIfNotExists('leads', 'unsubscribed', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });

      await addColumnIfNotExists('leads', 'unsubscribed_at', {
        type: Sequelize.DATE,
        allowNull: true
      });

      // Add indexes for performance
      await addIndexIfNotExists('leads', ['lead_score'], 'leads_lead_score_idx');
      await addIndexIfNotExists('leads', ['last_email_at'], 'leads_last_email_at_idx');
      await addIndexIfNotExists('leads', ['unsubscribed'], 'leads_unsubscribed_idx');

      await transaction.commit();
      console.log('✅ Migration 001-add-lead-stats completed successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('leads', ['unsubscribed']);
    await queryInterface.removeIndex('leads', ['last_email_at']);
    await queryInterface.removeIndex('leads', ['lead_score']);

    // Remove columns
    await queryInterface.removeColumn('leads', 'unsubscribed_at');
    await queryInterface.removeColumn('leads', 'unsubscribed');
    await queryInterface.removeColumn('leads', 'lead_score');
    await queryInterface.removeColumn('leads', 'last_template_id');
    await queryInterface.removeColumn('leads', 'last_email_at');
    await queryInterface.removeColumn('leads', 'emails_clicked_count');
    await queryInterface.removeColumn('leads', 'emails_opened_count');
    await queryInterface.removeColumn('leads', 'emails_failed_count');
    await queryInterface.removeColumn('leads', 'emails_sent_count');
  }
};
