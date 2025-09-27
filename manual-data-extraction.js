const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🔍 Manual Data Extraction from NEW27back.sql');
console.log('==============================================');

const LOCAL_DB_URL = 'postgresql://postgres:admin123@localhost:5432/lottery_system_local';
const RENDER_DB_URL = 'postgresql://lotterydb_a6w5_user:cqd2Dka5VUZPJWq6bA1BHeWEzy2WtEFV@dpg-d3bv917diees738vo2g0-a.oregon-postgres.render.com/lotterydb_a6w5';

const localPrisma = new PrismaClient({
    datasources: {
        db: {
            url: LOCAL_DB_URL
        }
    }
});

const renderPrisma = new PrismaClient({
    datasources: {
        db: {
            url: RENDER_DB_URL
        }
    }
});

async function manualDataExtraction() {
    try {
        console.log('🔗 Connecting to local database...');
        await localPrisma.$connect();
        console.log('✅ Connected to local database');
        
        console.log('🔗 Connecting to Render database...');
        await renderPrisma.$connect();
        console.log('✅ Connected to Render database');
        
        console.log('\n📊 Extracting data from local database...');
        
        // Extract users
        const users = await localPrisma.user.findMany();
        console.log(`👥 Found ${users.length} users`);
        
        // Extract regions
        const regions = await localPrisma.region.findMany();
        console.log(`🌍 Found ${regions.length} regions`);
        
        // Extract draws
        const draws = await localPrisma.draw.findMany();
        console.log(`🎲 Found ${draws.length} draws`);
        
        // Extract tickets
        const tickets = await localPrisma.ticket.findMany();
        console.log(`🎫 Found ${tickets.length} tickets`);
        
        // Extract bets
        const bets = await localPrisma.bet.findMany();
        console.log(`💰 Found ${bets.length} bets`);
        
        // Extract user balances
        const userBalances = await localPrisma.userBalance.findMany();
        console.log(`💳 Found ${userBalances.length} user balances`);
        
        // Extract balance transactions
        const balanceTransactions = await localPrisma.balanceTransaction.findMany();
        console.log(`📈 Found ${balanceTransactions.length} balance transactions`);
        
        console.log('\n🔄 Creating SQL insert statements...');
        
        let sqlContent = '-- Manual Data Migration SQL\n';
        sqlContent += '-- Generated from local database\n\n';
        
        // Generate INSERT statements for each table
        if (regions.length > 0) {
            sqlContent += '-- Regions\n';
            regions.forEach(region => {
                sqlContent += `INSERT INTO regions (id, name, area_coordinator_id, created_at, updated_at) VALUES (${region.id}, '${region.name}', ${region.areaCoordinatorId || 'NULL'}, '${region.createdAt.toISOString()}', '${region.updatedAt.toISOString()}');\n`;
            });
            sqlContent += '\n';
        }
        
        if (users.length > 0) {
            sqlContent += '-- Users\n';
            users.forEach(user => {
                sqlContent += `INSERT INTO users (id, username, password_hash, email, full_name, address, phone, region_id, coordinator_id, created_by, created_at, updated_at, agent_id, role, status) VALUES (${user.id}, '${user.username}', '${user.passwordHash}', ${user.email ? `'${user.email}'` : 'NULL'}, '${user.fullName}', ${user.address ? `'${user.address}'` : 'NULL'}, ${user.phone ? `'${user.phone}'` : 'NULL'}, ${user.regionId || 'NULL'}, ${user.coordinatorId || 'NULL'}, ${user.createdById || 'NULL'}, '${user.createdAt.toISOString()}', '${user.updatedAt.toISOString()}', ${user.agentId ? `'${user.agentId}'` : 'NULL'}, '${user.role}', '${user.status}');\n`;
            });
            sqlContent += '\n';
        }
        
        if (draws.length > 0) {
            sqlContent += '-- Draws\n';
            draws.forEach(draw => {
                sqlContent += `INSERT INTO draws (id, draw_date, draw_time, status, winning_numbers, created_at, updated_at) VALUES (${draw.id}, '${draw.drawDate}', '${draw.drawTime}', '${draw.status}', ${draw.winningNumbers ? `'${draw.winningNumbers}'` : 'NULL'}, '${draw.createdAt.toISOString()}', '${draw.updatedAt.toISOString()}');\n`;
            });
            sqlContent += '\n';
        }
        
        if (tickets.length > 0) {
            sqlContent += '-- Tickets\n';
            tickets.forEach(ticket => {
                sqlContent += `INSERT INTO tickets (id, ticket_number, qr_code, status, agent_id, requested_by, approved_by, created_at, updated_at) VALUES (${ticket.id}, '${ticket.ticketNumber}', ${ticket.qrCode ? `'${ticket.qrCode}'` : 'NULL'}, '${ticket.status}', ${ticket.agentId || 'NULL'}, ${ticket.requestedBy || 'NULL'}, ${ticket.approvedBy || 'NULL'}, '${ticket.createdAt.toISOString()}', '${ticket.updatedAt.toISOString()}');\n`;
            });
            sqlContent += '\n';
        }
        
        if (bets.length > 0) {
            sqlContent += '-- Bets\n';
            bets.forEach(bet => {
                sqlContent += `INSERT INTO bets (id, bet_type, bet_amount, numbers, created_at, updated_at) VALUES (${bet.id}, '${bet.betType}', ${bet.betAmount}, '${bet.numbers}', '${bet.createdAt.toISOString()}', '${bet.updatedAt.toISOString()}');\n`;
            });
            sqlContent += '\n';
        }
        
        if (userBalances.length > 0) {
            sqlContent += '-- User Balances\n';
            userBalances.forEach(balance => {
                sqlContent += `INSERT INTO user_balances (id, user_id, current_balance, last_updated, created_at) VALUES (${balance.id}, ${balance.userId}, ${balance.currentBalance}, '${balance.lastUpdated.toISOString()}', '${balance.createdAt.toISOString()}');\n`;
            });
            sqlContent += '\n';
        }
        
        if (balanceTransactions.length > 0) {
            sqlContent += '-- Balance Transactions\n';
            balanceTransactions.forEach(transaction => {
                sqlContent += `INSERT INTO balance_transactions (id, user_id, amount, transaction_type, description, reference_id, processed_by, created_at, status) VALUES (${transaction.id}, ${transaction.userId}, ${transaction.amount}, '${transaction.transactionType}', ${transaction.description ? `'${transaction.description}'` : 'NULL'}, ${transaction.referenceId ? `'${transaction.referenceId}'` : 'NULL'}, ${transaction.processedById || 'NULL'}, '${transaction.createdAt.toISOString()}', '${transaction.status}');\n`;
            });
            sqlContent += '\n';
        }
        
        // Write SQL file
        fs.writeFileSync('manual_migration.sql', sqlContent);
        console.log('\n✅ SQL file created: manual_migration.sql');
        
        console.log('\n📋 Next steps:');
        console.log('1. Apply the Prisma schema to Render database');
        console.log('2. Run the SQL commands from manual_migration.sql');
        console.log('3. Update Render backend DATABASE_URL');
        console.log('4. Test frontend connection');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await localPrisma.$disconnect();
        await renderPrisma.$disconnect();
    }
}

manualDataExtraction();
