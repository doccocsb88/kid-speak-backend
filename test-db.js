const databaseService = require('./src/services/databaseService');
const pool = require('./src/config/database');

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...\n');
  
  try {
    // Test 1: Basic connection
    console.log('1. Testing basic connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully!');
    
    // Test 2: Simple query
    console.log('\n2. Testing simple query...');
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Query executed successfully!');
    console.log('   Current time:', result.rows[0].current_time);
    
    // Test 3: Check if tables exist
    console.log('\n3. Checking database schema...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('⚠️  No tables found. You need to run the schema.sql file first.');
      console.log('   Run: psql "your-database-url" -f src/sql/schema.sql');
    } else {
      console.log('✅ Found tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Test 4: Health check service
    console.log('\n4. Testing database service health check...');
    const healthCheck = await databaseService.healthCheck();
    console.log('✅ Health check result:', healthCheck);
    
    client.release();
    
    console.log('\n🎉 All database tests passed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create your .env file with DATABASE_URL');
    console.log('   2. Run schema.sql to create tables');
    console.log('   3. Start implementing authentication routes');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Check if DATABASE_URL is set in .env file');
    console.log('   2. Verify database credentials');
    console.log('   3. Ensure database is accessible from your network');
    console.log('   4. Check if SSL settings are correct');
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Run the test
testDatabaseConnection();
