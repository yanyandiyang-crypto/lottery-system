const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    
    // Ensure backup directory exists
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Backup directory created', { path: this.backupDir });
    }
  }

  async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = path.join(this.backupDir, filename);

    return new Promise((resolve, reject) => {
      // Extract database connection details from DATABASE_URL
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        reject(new Error('DATABASE_URL not found in environment variables'));
        return;
      }

      // Parse DATABASE_URL (format: postgresql://user:password@host:port/database)
      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.substring(1); // Remove leading slash
      const username = url.username;
      const password = url.password;

      // Set PGPASSWORD environment variable for pg_dump
      const env = { ...process.env, PGPASSWORD: password };
      
      const command = `pg_dump -h ${host} -p ${port} -U ${username} -d ${database} > "${filepath}"`;
      
      logger.info('Starting database backup', { filename, command: command.replace(password, '***') });
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          logger.error('Database backup failed', { error: error.message, stderr });
          reject(error);
        } else {
          // Check if file was created and has content
          if (fs.existsSync(filepath)) {
            const stats = fs.statSync(filepath);
            if (stats.size > 0) {
              logger.info('Database backup created successfully', { 
                filename, 
                filepath, 
                size: `${(stats.size / 1024 / 1024).toFixed(2)}MB` 
              });
              resolve({ filename, filepath, size: stats.size });
            } else {
              logger.error('Backup file is empty', { filename });
              reject(new Error('Backup file is empty'));
            }
          } else {
            logger.error('Backup file was not created', { filename });
            reject(new Error('Backup file was not created'));
          }
        }
      });
    });
  }

  async cleanupOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.sql'));
      
      // Keep only last 7 days of local backups
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 7);
      
      let deletedCount = 0;
      for (const file of backupFiles) {
        const filepath = path.join(this.backupDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filepath);
          deletedCount++;
          logger.info('Old backup file deleted', { file });
        }
      }
      
      if (deletedCount > 0) {
        logger.info('Backup cleanup completed', { deletedCount, totalFiles: backupFiles.length });
      }
      
      return deletedCount;
    } catch (error) {
      logger.error('Backup cleanup failed', { error: error.message });
      return 0;
    }
  }

  async scheduleBackups() {
    logger.info('Initializing backup scheduler');
    
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting scheduled daily backup');
        
        const backup = await this.createDatabaseBackup();
        await this.cleanupOldBackups();
        
        logger.info('Scheduled daily backup completed successfully', { 
          filename: backup.filename,
          size: `${(backup.size / 1024 / 1024).toFixed(2)}MB`
        });
      } catch (error) {
        logger.error('Scheduled daily backup failed', { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    // Weekly full backup on Sunday at 1 AM
    cron.schedule('0 1 * * 0', async () => {
      try {
        logger.info('Starting scheduled weekly backup');
        
        const backup = await this.createDatabaseBackup();
        
        logger.info('Scheduled weekly backup completed successfully', { 
          filename: backup.filename,
          size: `${(backup.size / 1024 / 1024).toFixed(2)}MB`
        });
      } catch (error) {
        logger.error('Scheduled weekly backup failed', { error: error.message });
      }
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'UTC'
    });

    logger.info('Backup scheduler initialized', { 
      dailySchedule: '0 2 * * * (2 AM daily)',
      weeklySchedule: '0 1 * * 0 (1 AM Sunday)',
      timezone: process.env.TZ || 'UTC'
    });
  }

  async restoreFromBackup(filename) {
    const filepath = path.join(this.backupDir, filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }

    return new Promise((resolve, reject) => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        reject(new Error('DATABASE_URL not found in environment variables'));
        return;
      }

      const url = new URL(dbUrl);
      const host = url.hostname;
      const port = url.port || '5432';
      const database = url.pathname.substring(1);
      const username = url.username;
      const password = url.password;

      const env = { ...process.env, PGPASSWORD: password };
      const command = `psql -h ${host} -p ${port} -U ${username} -d ${database} < "${filepath}"`;
      
      logger.info('Starting database restore', { filename, command: command.replace(password, '***') });
      
      exec(command, { env }, (error, stdout, stderr) => {
        if (error) {
          logger.error('Database restore failed', { error: error.message, stderr });
          reject(error);
        } else {
          logger.info('Database restored successfully', { filename });
          resolve();
        }
      });
    });
  }

  async listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.sql'))
        .map(file => {
          const filepath = path.join(this.backupDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created);

      return backupFiles;
    } catch (error) {
      logger.error('Failed to list backups', { error: error.message });
      return [];
    }
  }
}

module.exports = new BackupService();
