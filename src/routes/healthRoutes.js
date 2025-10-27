const express = require('express');

const router = express.Router();

// Simple health check endpoint (without database)
router.get('/health', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Backend is running',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Database info endpoint (for debugging)
router.get('/db-info', async (req, res) => {
  try {
    const databaseService = require('../services/databaseService');
    const pool = require('../config/database');
    
    // Get database version
    const versionResult = await pool.query('SELECT version()');
    
    // Get table count
    const tablesResult = await pool.query(`
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    // Get connection pool info
    const poolInfo = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount
    };
    
    res.json({
      database_version: versionResult.rows[0].version,
      table_count: tablesResult.rows[0].table_count,
      pool_info: poolInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
