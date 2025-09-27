const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function restoreSystemEssentials() {
    console.log('🔄 Starting system restoration...');
    console.log('📅 Current Manila time:', moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss'));
    
    try {
        // Test database connection first
        console.log('🔗 Testing database connection...');
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        
        // 1. Clean up related data first to avoid foreign key constraints
        console.log('🧹 Cleaning up related data first...');
        
        // Delete current_bet_totals first (they reference draws)
        try {
            await prisma.currentBetTotal.deleteMany({});
            console.log('✅ Current bet totals cleared');
        } catch (error) {
            console.log('⚠️ No current bet totals to clear or table doesn\'t exist');
        }
        
        // Delete tickets that reference draws
        try {
            await prisma.ticket.deleteMany({});
            console.log('✅ All tickets cleared');
        } catch (error) {
            console.log('⚠️ No tickets to clear');
        }
        
        // Delete draw results
        try {
            await prisma.drawResult.deleteMany({});
            console.log('✅ Draw results cleared');
        } catch (error) {
            console.log('⚠️ No draw results to clear');
        }
        
        // Now we can safely delete draws
        console.log('🧹 Now cleaning up draws...');
        await prisma.draw.deleteMany({});
        console.log('✅ All old draws removed');

        // 2. Create today's draws with proper timezone-aware timestamps
        console.log('📅 Creating today\'s draws with fixed timestamps...');
        const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');
        
        // Create draws with proper Manila timezone timestamps
        const draws = [
            {
                drawDate: moment.tz(`${today} 14:00`, 'YYYY-MM-DD HH:mm', 'Asia/Manila').toDate(),
                drawTime: 'twoPM',
                status: 'open',
                createdAt: moment().tz('Asia/Manila').toDate(),
                updatedAt: moment().tz('Asia/Manila').toDate()
            },
            {
                drawDate: moment.tz(`${today} 17:00`, 'YYYY-MM-DD HH:mm', 'Asia/Manila').toDate(),
                drawTime: 'fivePM',
                status: 'open',
                createdAt: moment().tz('Asia/Manila').toDate(),
                updatedAt: moment().tz('Asia/Manila').toDate()
            },
            {
                drawDate: moment.tz(`${today} 21:00`, 'YYYY-MM-DD HH:mm', 'Asia/Manila').toDate(),
                drawTime: 'ninePM',
                status: 'open',
                createdAt: moment().tz('Asia/Manila').toDate(),
                updatedAt: moment().tz('Asia/Manila').toDate()
            }
        ];

        for (const draw of draws) {
            await prisma.draw.create({
                data: draw
            });
            const drawDateTime = moment(draw.drawDate).tz('Asia/Manila').format('YYYY-MM-DD HH:mm');
            console.log(`✅ Created ${draw.drawTime} draw for ${drawDateTime}`);
        }

        // 2.1. Create draws for the next 7 days to ensure continuity
        console.log('📅 Creating draws for next 7 days...');
        for (let i = 1; i <= 7; i++) {
            const futureDate = moment().tz('Asia/Manila').add(i, 'days').format('YYYY-MM-DD');
            
            const futureDrws = [
                {
                    drawDate: moment.tz(`${futureDate} 14:00`, 'YYYY-MM-DD HH:mm', 'Asia/Manila').toDate(),
                    drawTime: 'twoPM',
                    status: 'open',
                    createdAt: moment().tz('Asia/Manila').toDate(),
                    updatedAt: moment().tz('Asia/Manila').toDate()
                },
                {
                    drawDate: moment.tz(`${futureDate} 17:00`, 'YYYY-MM-DD HH:mm', 'Asia/Manila').toDate(),
                    drawTime: 'fivePM',
                    status: 'open',
                    createdAt: moment().tz('Asia/Manila').toDate(),
                    updatedAt: moment().tz('Asia/Manila').toDate()
                },
                {
                    drawDate: moment.tz(`${futureDate} 21:00`, 'YYYY-MM-DD HH:mm', 'Asia/Manila').toDate(),
                    drawTime: 'ninePM',
                    status: 'open',
                    createdAt: moment().tz('Asia/Manila').toDate(),
                    updatedAt: moment().tz('Asia/Manila').toDate()
                }
            ];

            for (const draw of futureDrws) {
                await prisma.draw.create({
                    data: draw
                });
            }
            console.log(`✅ Created 3 draws for ${futureDate}`);
        }

        // 3. Restore bet limits
        console.log('💰 Restoring bet limits...');
        
        // Delete existing bet limits
        await prisma.betLimit.deleteMany({});
        
        // Create comprehensive bet limits for all bet types (using schema enum values)
        const betLimits = [
            { betType: 'standard', limitAmount: 10000 },
            { betType: 'rambolito', limitAmount: 8000 }
        ];

        for (const limit of betLimits) {
            await prisma.betLimit.create({
                data: limit
            });
            console.log(`✅ Set ${limit.betType} limit to ₱${limit.limitAmount.toLocaleString()}`);
        }

        // 4. Restore system settings
        console.log('⚙️ Restoring system settings...');
        
        // Delete existing settings
        await prisma.systemSetting.deleteMany({});
        
        const systemSettings = [
            { settingKey: 'system_name', settingValue: 'Philippine Lottery System', description: 'System name' },
            { settingKey: 'company_name', settingValue: 'PCSO Authorized Agent', description: 'Company name' },
            { settingKey: 'contact_number', settingValue: '+63 123 456 7890', description: 'Contact number' },
            { settingKey: 'email', settingValue: 'support@lottery.ph', description: 'Support email' },
            { settingKey: 'address', settingValue: 'Manila, Philippines', description: 'Company address' },
            { settingKey: 'timezone', settingValue: 'Asia/Manila', description: 'System timezone' },
            { settingKey: 'currency', settingValue: 'PHP', description: 'System currency' },
            { settingKey: 'min_bet_amount', settingValue: '10', description: 'Minimum bet amount' },
            { settingKey: 'max_daily_bet', settingValue: '50000', description: 'Maximum daily bet' },
            { settingKey: 'commission_rate', settingValue: '0.05', description: 'Commission rate' },
            { settingKey: 'auto_backup_enabled', settingValue: 'true', description: 'Auto backup enabled' },
            { settingKey: 'maintenance_mode', settingValue: 'false', description: 'Maintenance mode' },
            { settingKey: 'allow_advance_betting', settingValue: 'true', description: 'Allow advance betting' },
            { settingKey: 'max_reprint_count', settingValue: '2', description: 'Maximum reprint count' },
            { settingKey: 'ticket_expiry_days', settingValue: '30', description: 'Ticket expiry days' }
        ];

        for (const setting of systemSettings) {
            await prisma.systemSetting.create({
                data: setting
            });
            console.log(`✅ Set ${setting.settingKey}: ${setting.settingValue}`);
        }

        // 5. Note: Ticket templates are handled by the frontend template designer
        console.log('📝 Note: Ticket templates are managed through the frontend designer interface');

        console.log('\n🎉 System restoration completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`✅ Created 3 draws for today (${today}) with proper Manila timezone`);
        console.log(`✅ Created 21 draws for next 7 days (3 draws × 7 days)`);
        console.log(`✅ Total draws created: 24 draws with fixed timestamps`);
        console.log(`✅ Restored ${betLimits.length} bet limits`);
        console.log(`✅ Restored ${systemSettings.length} system settings`);
        console.log('📝 Ticket templates managed via frontend designer');
        console.log('\n🕐 All timestamps are now properly set to Asia/Manila timezone');
        
    } catch (error) {
        console.error('❌ Error during restoration:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        throw error;
    } finally {
        console.log('🔌 Disconnecting from database...');
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
    }
}

// Run the restoration
restoreSystemEssentials()
    .then(() => {
        console.log('\n🚀 System is ready for operation!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Restoration failed:');
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    });
