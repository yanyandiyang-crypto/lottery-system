const express = require('express');
const backupService = require('../services/backupService');
const logger = require('../utils/logger');

const router = express.Router();

// List all backups
router.get('/list', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({
      success: true,
      data: {
        backups,
        count: backups.length
      }
    });
  } catch (error) {
    logger.error('Failed to list backups', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to list backups',
      error: error.message
    });
  }
});

// Create manual backup
router.post('/create', async (req, res) => {
  try {
    logger.info('Manual backup requested');
    const backup = await backupService.createDatabaseBackup();
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        filename: backup.filename,
        size: `${(backup.size / 1024 / 1024).toFixed(2)}MB`,
        created: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Manual backup failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

// Restore from backup
router.post('/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Security check - only allow .sql files
    if (!filename.endsWith('.sql')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid backup file format'
      });
    }

    logger.info('Manual restore requested', { filename });
    await backupService.restoreFromBackup(filename);
    
    res.json({
      success: true,
      message: 'Database restored successfully',
      data: {
        filename,
        restored: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Manual restore failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to restore backup',
      error: error.message
    });
  }
});

// Cleanup old backups
router.post('/cleanup', async (req, res) => {
  try {
    logger.info('Manual backup cleanup requested');
    const deletedCount = await backupService.cleanupOldBackups();
    
    res.json({
      success: true,
      message: 'Backup cleanup completed',
      data: {
        deletedCount,
        cleaned: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Manual backup cleanup failed', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup backups',
      error: error.message
    });
  }
});

module.exports = router;
