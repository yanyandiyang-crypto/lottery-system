const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function restoreSystemEssentials() {
    console.log('🔄 Starting system restoration...');
    
    try {
        // 1. Clean up duplicate draws first
        console.log('🧹 Cleaning up duplicate draws...');
        await prisma.draw.deleteMany({});
        console.log('✅ All old draws removed');

        // 2. Create today's draws with proper cutoff times
        console.log('📅 Creating today\'s draws...');
        const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');
        
        const draws = [
            {
                drawDate: new Date(`${today}T14:00:00+08:00`), // 2PM draw
                drawTime: 'twoPM',
                status: 'open'
            },
            {
                drawDate: new Date(`${today}T17:00:00+08:00`), // 5PM draw
                drawTime: 'fivePM',
                status: 'open'
            },
            {
                drawDate: new Date(`${today}T21:00:00+08:00`), // 9PM draw
                drawTime: 'ninePM',
                status: 'open'
            }
        ];

        for (const draw of draws) {
            await prisma.draw.create({
                data: draw
            });
            console.log(`✅ Created ${draw.drawTime} draw for ${today}`);
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
        console.log(`✅ Created 3 draws for today (${today})`);
        console.log(`✅ Restored ${betLimits.length} bet limits`);
        console.log(`✅ Restored ${systemSettings.length} system settings`);
        console.log('📝 Ticket templates managed via frontend designer');
        
    } catch (error) {
        console.error('❌ Error during restoration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the restoration
restoreSystemEssentials()
    .then(() => {
        console.log('\n🚀 System is ready for operation!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Restoration failed:', error);
        process.exit(1);
    });
