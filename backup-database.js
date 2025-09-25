const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  try {
    console.log('=== CREATING DATABASE BACKUP ===');
    
    const backupDir = path.join(__dirname, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    console.log(`Creating backup: ${backupFile}`);
    
    // Backup all tables
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {}
    };
    
    // Backup Users
    console.log('Backing up users...');
    const users = await prisma.user.findMany();
    backup.tables.users = users;
    console.log(`✅ Backed up ${users.length} users`);
    
    // Backup Draws
    console.log('Backing up draws...');
    const draws = await prisma.draw.findMany();
    backup.tables.draws = draws;
    console.log(`✅ Backed up ${draws.length} draws`);
    
    // Backup Tickets
    console.log('Backing up tickets...');
    const tickets = await prisma.ticket.findMany();
    backup.tables.tickets = tickets;
    console.log(`✅ Backed up ${tickets.length} tickets`);
    
    // Backup Bets
    console.log('Backing up bets...');
    const bets = await prisma.bet.findMany();
    backup.tables.bets = bets;
    console.log(`✅ Backed up ${bets.length} bets`);
    
    // Backup Sales
    console.log('Backing up sales...');
    const sales = await prisma.sale.findMany();
    backup.tables.sales = sales;
    console.log(`✅ Backed up ${sales.length} sales`);
    
    // Backup User Balances
    console.log('Backing up user balances...');
    const userBalances = await prisma.userBalance.findMany();
    backup.tables.userBalances = userBalances;
    console.log(`✅ Backed up ${userBalances.length} user balances`);
    
    // Backup Balance Transactions
    console.log('Backing up balance transactions...');
    const balanceTransactions = await prisma.balanceTransaction.findMany();
    backup.tables.balanceTransactions = balanceTransactions;
    console.log(`✅ Backed up ${balanceTransactions.length} balance transactions`);
    
    // Backup Winning Tickets
    console.log('Backing up winning tickets...');
    const winningTickets = await prisma.winningTicket.findMany();
    backup.tables.winningTickets = winningTickets;
    console.log(`✅ Backed up ${winningTickets.length} winning tickets`);
    
    // Backup Regions
    console.log('Backing up regions...');
    const regions = await prisma.region.findMany();
    backup.tables.regions = regions;
    console.log(`✅ Backed up ${regions.length} regions`);
    
    // Backup Templates (if exists)
    let templates = [];
    try {
      console.log('Backing up templates...');
      templates = await prisma.template.findMany();
      backup.tables.templates = templates;
      console.log(`✅ Backed up ${templates.length} templates`);
    } catch (error) {
      console.log('⚠️  Templates table not found, skipping...');
      backup.tables.templates = [];
    }
    
    // Backup Current Bet Totals (if exists)
    let currentBetTotals = [];
    try {
      console.log('Backing up current bet totals...');
      currentBetTotals = await prisma.currentBetTotal.findMany();
      backup.tables.currentBetTotals = currentBetTotals;
      console.log(`✅ Backed up ${currentBetTotals.length} current bet totals`);
    } catch (error) {
      console.log('⚠️  Current bet totals table not found, skipping...');
      backup.tables.currentBetTotals = [];
    }
    
    // Backup User Bet Limits (if exists)
    let userBetLimits = [];
    try {
      console.log('Backing up user bet limits...');
      userBetLimits = await prisma.userBetLimit.findMany();
      backup.tables.userBetLimits = userBetLimits;
      console.log(`✅ Backed up ${userBetLimits.length} user bet limits`);
    } catch (error) {
      console.log('⚠️  User bet limits table not found, skipping...');
      backup.tables.userBetLimits = [];
    }
    
    // Backup Prize Configurations (if exists)
    let prizeConfigurations = [];
    try {
      console.log('Backing up prize configurations...');
      prizeConfigurations = await prisma.prizeConfiguration.findMany();
      backup.tables.prizeConfigurations = prizeConfigurations;
      console.log(`✅ Backed up ${prizeConfigurations.length} prize configurations`);
    } catch (error) {
      console.log('⚠️  Prize configurations table not found, skipping...');
      backup.tables.prizeConfigurations = [];
    }
    
    // Write backup to file
    console.log('\nWriting backup to file...');
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    // Get file size
    const stats = fs.statSync(backupFile);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup file: ${backupFile}`);
    console.log(`📊 File size: ${fileSizeInMB} MB`);
    console.log(`📅 Backup date: ${new Date().toLocaleString()}`);
    
    // Create a summary
    const summary = {
      backupFile: backupFile,
      timestamp: new Date().toISOString(),
      summary: {
        users: users.length,
        draws: draws.length,
        tickets: tickets.length,
        bets: bets.length,
        sales: sales.length,
        userBalances: userBalances.length,
        balanceTransactions: balanceTransactions.length,
        winningTickets: winningTickets.length,
        regions: regions.length,
        templates: templates.length,
        currentBetTotals: currentBetTotals.length,
        userBetLimits: userBetLimits.length,
        prizeConfigurations: prizeConfigurations.length
      }
    };
    
    const summaryFile = path.join(backupDir, `backup-summary-${timestamp}.json`);
    fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    
    console.log(`📋 Summary file: ${summaryFile}`);
    
    console.log('\n🎯 IMPORTANT: Save these backup files to a safe location before reinstalling Windows!');
    console.log('🎯 You can restore your database later using the restore-database.js script.');
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase();
