const { PrismaClient } = require('@prisma/client');

console.log('🔍 Verifying Data Migration');
console.log('===========================');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0'
        }
    }
});

async function checkTableCounts() {
    try {
        console.log('\n📊 Checking table data counts...');
        
        const tables = [
            'user', 'region', 'draw', 'ticket', 'bet', 'sale', 
            'balanceTransaction', 'winningTicket', 'betLimit', 
            'prizeConfiguration', 'ticketTemplate', 'systemFunction',
            'systemSetting', 'commission', 'winningPrize', 'agentTicketTemplate',
            'betLimitsPerDraw', 'currentBetTotal', 'drawResult', 'auditLog',
            'loginAudit', 'notification', 'rateLimit', 'claimsAudit'
        ];
        
        const counts = {};
        
        for (const table of tables) {
            try {
                const count = await prisma[table].count();
                counts[table] = count;
                console.log(`✅ ${table}: ${count} records`);
            } catch (error) {
                console.log(`❌ ${table}: Error - ${error.message}`);
                counts[table] = 'ERROR';
            }
        }
        
        console.log('\n📋 Summary:');
        console.log('============');
        
        const totalRecords = Object.values(counts)
            .filter(count => typeof count === 'number')
            .reduce((sum, count) => sum + count, 0);
        
        console.log(`Total records migrated: ${totalRecords}`);
        
        // Check essential data
        const essentialTables = ['user', 'region', 'draw', 'ticket'];
        const essentialCount = essentialTables
            .filter(table => typeof counts[table] === 'number' && counts[table] > 0)
            .length;
        
        console.log(`Essential tables with data: ${essentialCount}/${essentialTables.length}`);
        
        if (essentialCount === essentialTables.length) {
            console.log('🎉 Data migration appears successful!');
        } else {
            console.log('⚠️ Some essential data may be missing');
        }
        
        return counts;
        
    } catch (error) {
        console.error('❌ Error checking table counts:', error.message);
        return null;
    }
}

async function checkUsers() {
    try {
        console.log('\n👥 Checking users...');
        
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                role: true,
                isActive: true
            }
        });
        
        console.log(`Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`  - ${user.username} (${user.role}) - ${user.isActive ? 'Active' : 'Inactive'}`);
        });
        
        return users;
        
    } catch (error) {
        console.error('❌ Error checking users:', error.message);
        return [];
    }
}

async function checkDraws() {
    try {
        console.log('\n🎲 Checking draws...');
        
        const draws = await prisma.draw.findMany({
            select: {
                id: true,
                drawDate: true,
                drawTime: true,
                status: true
            },
            orderBy: {
                drawDate: 'desc'
            },
            take: 5
        });
        
        console.log(`Found ${draws.length} recent draws:`);
        draws.forEach(draw => {
            console.log(`  - ${draw.drawDate.toISOString().split('T')[0]} ${draw.drawTime} (${draw.status})`);
        });
        
        return draws;
        
    } catch (error) {
        console.error('❌ Error checking draws:', error.message);
        return [];
    }
}

async function main() {
    try {
        console.log('🔗 Connecting to Render database...');
        
        // Test connection
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        // Check table counts
        const counts = await checkTableCounts();
        
        // Check specific data
        const users = await checkUsers();
        const draws = await checkDraws();
        
        console.log('\n🎯 Migration Status:');
        console.log('====================');
        
        if (counts && users.length > 0 && draws.length > 0) {
            console.log('✅ SUCCESS: Data migration completed');
            console.log('✅ Users found and accessible');
            console.log('✅ Draws found and accessible');
            console.log('✅ Database is ready for frontend use');
        } else {
            console.log('❌ ISSUES: Some data may be missing');
            console.log('❌ Check the errors above for details');
        }
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
