import { AppDataSource } from '../config/database';
import fs from 'fs';
import path from 'path';

const runMigrations = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Running database migrations...');
    
    const migrationsPath = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    const queryRunner = AppDataSource.createQueryRunner();
    
    // Create migrations tracking table if it doesn't exist
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    for (const file of migrationFiles) {
      const migrationName = file.replace('.sql', '');
      
      // Check if migration already executed
      const existingMigration = await queryRunner.query(
        'SELECT * FROM migrations WHERE name = $1',
        [migrationName]
      );
      
      if (existingMigration.length === 0) {
        console.log(`Executing migration: ${migrationName}`);
        const migrationContent = fs.readFileSync(
          path.join(migrationsPath, file),
          'utf-8'
        );
        
        await queryRunner.query(migrationContent);
        await queryRunner.query(
          'INSERT INTO migrations (name) VALUES ($1)',
          [migrationName]
        );
        
        console.log(`Migration completed: ${migrationName}`);
      } else {
        console.log(`Migration already executed: ${migrationName}`);
      }
    }
    
    await queryRunner.release();
    console.log('All migrations completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
};

if (require.main === module) {
  runMigrations();
}

export { runMigrations };