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

      // Add retry and idempotency columns to email_history
      await addColumnIfNotExists('email_history', 'retry_count', {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false
      });

      await addColumnIfNotExists('email_history', 'message_uuid', {
        type: Sequelize.UUID,
        allowNull: true,
        unique: true
      });

      await addColumnIfNotExists('email_history', 'provider_response', {
        type: Sequelize.TEXT,
        allowNull: true
      });

      await addColumnIfNotExists('email_history', 'bounce_reason', {
        type: Sequelize.STRING,
        allowNull: true
      });

      await addColumnIfNotExists('email_history', 'unsubscribe_token', {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      });

      // Add indexes for webhook lookups
      await addIndexIfNotExists('email_history', ['message_uuid'], 'email_history_message_uuid_idx');
      await addIndexIfNotExists('email_history', ['email_provider_id'], 'email_history_provider_id_idx');
      await addIndexIfNotExists('email_history', ['unsubscribe_token'], 'email_history_unsubscribe_token_idx');

      await transaction.commit();
      console.log('✅ Migration 002-add-email-history-improvements completed successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('email_history', ['unsubscribe_token']);
    await queryInterface.removeIndex('email_history', ['email_provider_id']);
    await queryInterface.removeIndex('email_history', ['message_uuid']);

    // Remove columns
    await queryInterface.removeColumn('email_history', 'unsubscribe_token');
    await queryInterface.removeColumn('email_history', 'bounce_reason');
    await queryInterface.removeColumn('email_history', 'provider_response');
    await queryInterface.removeColumn('email_history', 'message_uuid');
    await queryInterface.removeColumn('email_history', 'retry_count');
  }
};
