const { sequelize } = require('../config/database');
const fs = require('fs');
const path = require('path');

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');

    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "migrations" (
        "name" VARCHAR(255) PRIMARY KEY,
        "executed_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      // Check if migration already executed
      const [results] = await sequelize.query(
        'SELECT name FROM migrations WHERE name = ?',
        { replacements: [file] }
      );

      if (results.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${file}`);
      
      const migration = require(path.join(migrationsDir, file));
      await migration.up(sequelize.getQueryInterface(), sequelize.constructor);

      // Mark as executed
      await sequelize.query(
        'INSERT INTO migrations (name) VALUES (?)',
        { replacements: [file] }
      );

      console.log(`✅ Completed migration: ${file}`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
