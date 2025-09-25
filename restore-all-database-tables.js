const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function restoreAllDatabaseTables() {
    console.log('🔄 Starting comprehensive database restoration...');
    console.log('⚠️  This will DELETE ALL existing data and restore fresh data');
    
    try {
        // 1. Clear all existing data (in correct order to avoid foreign key constraints)
        console.log('\n🧹 Clearing existing data...');
        
        await prisma.notification.deleteMany({});
        await prisma.winningTicket.deleteMany({});
        await prisma.currentBetTotal.deleteMany({});
        await prisma.commission.deleteMany({});
        await prisma.sale.deleteMany({});
        await prisma.ticket.deleteMany({});
        await prisma.balanceTransaction.deleteMany({});
        await prisma.userBalance.deleteMany({});
        await prisma.draw.deleteMany({});
        await prisma.betLimit.deleteMany({});
        await prisma.systemSetting.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.region.deleteMany({});
        
        console.log('✅ All existing data cleared');

        // 2. Create Regions
        console.log('\n🌍 Creating regions...');
        const regions = [
            { name: 'Metro Manila' },
            { name: 'Northern Luzon' },
            { name: 'Southern Luzon' },
            { name: 'Visayas' },
            { name: 'Mindanao' }
        ];

        const createdRegions = [];
        for (const regionData of regions) {
            const region = await prisma.region.create({
                data: regionData
            });
            createdRegions.push(region);
            console.log(`✅ Created region: ${region.name}`);
        }

        // 3. Create Users with proper hierarchy
        console.log('\n👥 Creating user accounts...');
        
        // SuperAdmin
        const superAdminPassword = await bcrypt.hash('superadmin123', 10);
        const superAdmin = await prisma.user.create({
            data: {
                username: 'superadmin',
                passwordHash: superAdminPassword,
                email: 'superadmin@lottery.com',
                fullName: 'Super Administrator',
                role: 'superadmin',
                regionId: createdRegions[0].id,
                status: 'active'
            }
        });
        console.log('✅ Created SuperAdmin (username: superadmin, password: superadmin123)');

        // Admin
        const adminPassword = await bcrypt.hash('admin123', 10);
        const admin = await prisma.user.create({
            data: {
                username: 'admin',
                passwordHash: adminPassword,
                email: 'admin@lottery.com',
                fullName: 'System Administrator',
                role: 'admin',
                regionId: createdRegions[0].id,
                status: 'active',
                createdById: superAdmin.id
            }
        });
        console.log('✅ Created Admin (username: admin, password: admin123)');

        // Area Coordinators
        const areaCoordinators = [];
        for (let i = 0; i < 3; i++) {
            const password = await bcrypt.hash(`areacoord${i + 1}123`, 10);
            const areaCoord = await prisma.user.create({
                data: {
                    username: `areacoord${i + 1}`,
                    passwordHash: password,
                    email: `areacoord${i + 1}@lottery.com`,
                    fullName: `Area Coordinator ${i + 1}`,
                    role: 'area_coordinator',
                    regionId: createdRegions[i].id,
                    status: 'active',
                    createdById: admin.id
                }
            });
            areaCoordinators.push(areaCoord);
            
            // Update region with area coordinator
            await prisma.region.update({
                where: { id: createdRegions[i].id },
                data: { areaCoordinatorId: areaCoord.id }
            });
            
            console.log(`✅ Created Area Coordinator ${i + 1} (username: areacoord${i + 1}, password: areacoord${i + 1}123)`);
        }

        // Coordinators
        const coordinators = [];
        for (let i = 0; i < 5; i++) {
            const password = await bcrypt.hash(`coord${i + 1}123`, 10);
            const coordinator = await prisma.user.create({
                data: {
                    username: `coord${i + 1}`,
                    passwordHash: password,
                    email: `coord${i + 1}@lottery.com`,
                    fullName: `Coordinator ${i + 1}`,
                    role: 'coordinator',
                    regionId: createdRegions[i % createdRegions.length].id,
                    status: 'active',
                    createdById: areaCoordinators[i % areaCoordinators.length].id
                }
            });
            coordinators.push(coordinator);
            console.log(`✅ Created Coordinator ${i + 1} (username: coord${i + 1}, password: coord${i + 1}123)`);
        }

        // Agents
        const agents = [];
        for (let i = 0; i < 10; i++) {
            const password = await bcrypt.hash(`agent${i + 1}123`, 10);
            const agent = await prisma.user.create({
                data: {
                    username: `agent${i + 1}`,
                    passwordHash: password,
                    email: `agent${i + 1}@lottery.com`,
                    fullName: `Agent ${i + 1}`,
                    role: 'agent',
                    regionId: createdRegions[i % createdRegions.length].id,
                    coordinatorId: coordinators[i % coordinators.length].id,
                    status: 'active',
                    createdById: coordinators[i % coordinators.length].id
                }
            });
            agents.push(agent);
            console.log(`✅ Created Agent ${i + 1} (username: agent${i + 1}, password: agent${i + 1}123)`);
        }

        // Operators
        const operators = [];
        for (let i = 0; i < 3; i++) {
            const password = await bcrypt.hash(`operator${i + 1}123`, 10);
            const operator = await prisma.user.create({
                data: {
                    username: `operator${i + 1}`,
                    passwordHash: password,
                    email: `operator${i + 1}@lottery.com`,
                    fullName: `Operator ${i + 1}`,
                    role: 'operator',
                    regionId: createdRegions[0].id,
                    status: 'active',
                    createdById: admin.id
                }
            });
            operators.push(operator);
            console.log(`✅ Created Operator ${i + 1} (username: operator${i + 1}, password: operator${i + 1}123)`);
        }

        // 4. Create User Balances
        console.log('\n💰 Creating user balances...');
        
        const balanceData = [
            { userId: superAdmin.id, balance: 1000000.00 },
            { userId: admin.id, balance: 500000.00 },
            ...areaCoordinators.map(ac => ({ userId: ac.id, balance: 100000.00 })),
            ...coordinators.map(c => ({ userId: c.id, balance: 50000.00 })),
            ...agents.map(a => ({ userId: a.id, balance: 10000.00 })),
            ...operators.map(o => ({ userId: o.id, balance: 25000.00 }))
        ];

        for (const balance of balanceData) {
            await prisma.userBalance.create({
                data: {
                    userId: balance.userId,
                    currentBalance: balance.balance
                }
            });
        }
        console.log(`✅ Created ${balanceData.length} user balances`);

        // 5. Create Balance Transactions (sample load transactions)
        console.log('\n📊 Creating balance transactions...');
        
        const transactions = [];
        for (const balance of balanceData) {
            transactions.push({
                userId: balance.userId,
                amount: balance.balance,
                transactionType: 'load',
                description: 'Initial balance load',
                processedById: admin.id
            });
        }

        for (const transaction of transactions) {
            await prisma.balanceTransaction.create({
                data: transaction
            });
        }
        console.log(`✅ Created ${transactions.length} balance transactions`);

        // 6. Create Draws (today and next 7 days)
        console.log('\n🎯 Creating draws...');
        
        const drawsCreated = [];
        for (let day = 0; day < 8; day++) {
            const drawDate = moment().tz('Asia/Manila').add(day, 'days');
            const dateStr = drawDate.format('YYYY-MM-DD');
            
            const dailyDraws = [
                {
                    drawDate: new Date(`${dateStr}T14:00:00+08:00`),
                    drawTime: 'twoPM',
                    cutoffTime: new Date(`${dateStr}T13:45:00+08:00`), // 1:45 PM cutoff
                    status: day === 0 ? 'open' : 'open'
                },
                {
                    drawDate: new Date(`${dateStr}T17:00:00+08:00`),
                    drawTime: 'fivePM',
                    cutoffTime: new Date(`${dateStr}T16:45:00+08:00`), // 4:45 PM cutoff
                    status: day === 0 ? 'open' : 'open'
                },
                {
                    drawDate: new Date(`${dateStr}T21:00:00+08:00`),
                    drawTime: 'ninePM',
                    cutoffTime: new Date(`${dateStr}T20:45:00+08:00`), // 8:45 PM cutoff
                    status: day === 0 ? 'open' : 'open'
                }
            ];

            for (const draw of dailyDraws) {
                const createdDraw = await prisma.draw.create({
                    data: draw
                });
                drawsCreated.push(createdDraw);
            }
            console.log(`✅ Created draws for ${dateStr}`);
        }

        // 7. Create Bet Limits
        console.log('\n🎰 Creating bet limits...');
        
        const betLimits = [
            { betType: 'standard', limitAmount: 10000.00, createdById: admin.id },
            { betType: 'rambolito', limitAmount: 8000.00, createdById: admin.id }
        ];

        for (const limit of betLimits) {
            await prisma.betLimit.create({
                data: limit
            });
            console.log(`✅ Set ${limit.betType} limit to ₱${limit.limitAmount.toLocaleString()}`);
        }

        // 8. Create System Settings
        console.log('\n⚙️ Creating system settings...');
        
        const systemSettings = [
            { settingKey: 'system_name', settingValue: 'Philippine 3D Lottery System', description: 'System name' },
            { settingKey: 'company_name', settingValue: 'PCSO Authorized Agent Network', description: 'Company name' },
            { settingKey: 'contact_number', settingValue: '+63 123 456 7890', description: 'Contact number' },
            { settingKey: 'email', settingValue: 'support@3dlottery.ph', description: 'Support email' },
            { settingKey: 'address', settingValue: 'Manila, Philippines', description: 'Company address' },
            { settingKey: 'timezone', settingValue: 'Asia/Manila', description: 'System timezone' },
            { settingKey: 'currency', settingValue: 'PHP', description: 'System currency' },
            { settingKey: 'min_bet_amount', settingValue: '10', description: 'Minimum bet amount' },
            { settingKey: 'max_daily_bet', settingValue: '50000', description: 'Maximum daily bet per user' },
            { settingKey: 'commission_rate', settingValue: '0.05', description: 'Commission rate (5%)' },
            { settingKey: 'auto_backup_enabled', settingValue: 'true', description: 'Auto backup enabled' },
            { settingKey: 'maintenance_mode', settingValue: 'false', description: 'Maintenance mode' },
            { settingKey: 'allow_advance_betting', settingValue: 'true', description: 'Allow advance betting' },
            { settingKey: 'max_reprint_count', settingValue: '2', description: 'Maximum reprint count' },
            { settingKey: 'ticket_expiry_days', settingValue: '30', description: 'Ticket expiry days' },
            { settingKey: 'cutoff_minutes_before_draw', settingValue: '15', description: 'Cutoff minutes before draw' },
            { settingKey: 'standard_prize_amount', settingValue: '4500', description: 'Standard bet prize amount' },
            { settingKey: 'rambolito_prize_amount', settingValue: '750', description: 'Rambolito bet prize amount' },
            { settingKey: 'notification_retention_days', settingValue: '90', description: 'Notification retention days' },
            { settingKey: 'session_timeout_minutes', settingValue: '60', description: 'Session timeout in minutes' }
        ];

        for (const setting of systemSettings) {
            await prisma.systemSetting.create({
                data: {
                    ...setting,
                    updatedById: admin.id
                }
            });
            console.log(`✅ Set ${setting.settingKey}: ${setting.settingValue}`);
        }

        // 9. Create Sample Tickets (for demonstration)
        console.log('\n🎫 Creating sample tickets...');
        
        const sampleTickets = [];
        for (let i = 0; i < 20; i++) {
            const agent = agents[i % agents.length];
            const draw = drawsCreated[i % 3]; // Use today's draws
            const betType = i % 2 === 0 ? 'standard' : 'rambolito';
            const betCombination = String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
            const betAmount = betType === 'standard' ? 10 : 10;
            
            const ticket = await prisma.ticket.create({
                data: {
                    ticketNumber: `T${Date.now()}${i.toString().padStart(3, '0')}`,
                    userId: agent.id,
                    drawId: draw.id,
                    betType: betType,
                    betCombination: betCombination,
                    betCombinations: [betCombination],
                    betAmount: betAmount,
                    totalAmount: betAmount,
                    status: 'pending',
                    qrCode: `QR${Date.now()}${i}`,
                    templateId: 1
                }
            });
            sampleTickets.push(ticket);
        }
        console.log(`✅ Created ${sampleTickets.length} sample tickets`);

        // 10. Create Sales Records
        console.log('\n📈 Creating sales records...');
        
        const salesMap = new Map();
        for (const ticket of sampleTickets) {
            const key = `${ticket.userId}-${ticket.drawId}-${ticket.betType}`;
            if (!salesMap.has(key)) {
                salesMap.set(key, {
                    userId: ticket.userId,
                    drawId: ticket.drawId,
                    betType: ticket.betType,
                    totalAmount: 0,
                    ticketCount: 0
                });
            }
            const sale = salesMap.get(key);
            sale.totalAmount += ticket.totalAmount;
            sale.ticketCount += 1;
        }

        for (const [key, saleData] of salesMap) {
            await prisma.sale.create({
                data: saleData
            });
        }
        console.log(`✅ Created ${salesMap.size} sales records`);

        // 11. Create Sample Notifications
        console.log('\n🔔 Creating sample notifications...');
        
        const notifications = [
            {
                userId: agents[0].id,
                title: 'Welcome to the System',
                message: 'Your agent account has been activated. You can now start selling lottery tickets.',
                type: 'info'
            },
            {
                userId: coordinators[0].id,
                title: 'New Agent Added',
                message: 'A new agent has been added to your area.',
                type: 'info'
            },
            {
                userId: admin.id,
                title: 'System Restored',
                message: 'Database has been successfully restored with all tables.',
                type: 'success'
            }
        ];

        for (const notification of notifications) {
            await prisma.notification.create({
                data: notification
            });
        }
        console.log(`✅ Created ${notifications.length} sample notifications`);

        console.log('\n🎉 COMPREHENSIVE DATABASE RESTORATION COMPLETED!');
        console.log('\n📊 RESTORATION SUMMARY:');
        console.log(`✅ Regions: ${createdRegions.length}`);
        console.log(`✅ Users: ${1 + 1 + areaCoordinators.length + coordinators.length + agents.length + operators.length}`);
        console.log(`✅ User Balances: ${balanceData.length}`);
        console.log(`✅ Balance Transactions: ${transactions.length}`);
        console.log(`✅ Draws: ${drawsCreated.length} (8 days worth)`);
        console.log(`✅ Bet Limits: ${betLimits.length}`);
        console.log(`✅ System Settings: ${systemSettings.length}`);
        console.log(`✅ Sample Tickets: ${sampleTickets.length}`);
        console.log(`✅ Sales Records: ${salesMap.size}`);
        console.log(`✅ Notifications: ${notifications.length}`);

        console.log('\n👥 DEFAULT ACCOUNTS CREATED:');
        console.log('👑 SuperAdmin: superadmin / superadmin123');
        console.log('🛠️  Admin: admin / admin123');
        console.log('🌍 Area Coordinators: areacoord1-3 / areacoord[1-3]123');
        console.log('📊 Coordinators: coord1-5 / coord[1-5]123');
        console.log('🎫 Agents: agent1-10 / agent[1-10]123');
        console.log('⚙️  Operators: operator1-3 / operator[1-3]123');

        console.log('\n💰 ALL ACCOUNTS LOADED WITH INITIAL BALANCES');
        console.log('🎯 DRAWS CREATED FOR TODAY AND NEXT 7 DAYS');
        console.log('🎫 SAMPLE TICKETS AND SALES DATA INCLUDED');
        console.log('\n🚀 SYSTEM IS READY FOR OPERATION!');

    } catch (error) {
        console.error('❌ Error during comprehensive restoration:', error);
        console.error('Stack trace:', error.stack);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the comprehensive restoration
restoreAllDatabaseTables()
    .then(() => {
        console.log('\n✨ Database restoration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Database restoration failed:', error.message);
        process.exit(1);
    });
