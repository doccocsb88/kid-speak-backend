const fs = require('fs');
const path = require('path');
const pool = require('./src/config/database');

async function runMigration() {
  console.log('🔄 Running database migration...\n');
  
  try {
    // Read schema file
    const schemaPath = path.join(__dirname, 'src/sql/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    console.log('📝 Executing schema.sql...');
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully!');
    
    // Verify tables were created
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Created tables:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Test the connection: npm run test-db');
    console.log('   2. Start implementing authentication routes');
    console.log('   3. Test user registration and login');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if DATABASE_URL is set correctly');
    console.log('   2. Verify database permissions');
    console.log('   3. Check if tables already exist');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run migration
runMigration();
