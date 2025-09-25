const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createDefaultUsers() {
  try {
    console.log('🔧 Creating default user accounts...');

    // Create default region first
    let region = await prisma.region.findFirst();
    if (!region) {
      region = await prisma.region.create({
        data: {
          name: 'Metro Manila'
        }
      });
      console.log('✅ Created default region: Metro Manila');
    }

    // 1. Create Admin account
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: adminPassword,
        email: 'admin@lottery.com',
        fullName: 'System Admin',
        role: 'admin',
        regionId: region.id,
        agentId: 'ADM001'
      }
    });
    console.log('✅ Created admin account (username: admin, password: admin123)');

    // Create balance for admin
    await prisma.userBalance.create({
      data: {
        userId: admin.id,
        currentBalance: 100000.00
      }
    });

    // 2. Create Area Coordinator account
    const areaCoordPassword = await bcrypt.hash('areacoord123', 10);
    const areaCoordinator = await prisma.user.create({
      data: {
        username: 'areacoord',
        passwordHash: areaCoordPassword,
        email: 'areacoord@lottery.com',
        fullName: 'Area Coordinator',
        role: 'area_coordinator',
        regionId: region.id,
        agentId: 'AC001',
        createdById: admin.id
      }
    });
    console.log('✅ Created area coordinator account (username: areacoord, password: areacoord123)');

    // Create balance for area coordinator
    await prisma.userBalance.create({
      data: {
        userId: areaCoordinator.id,
        currentBalance: 50000.00
      }
    });

    // Update region to have area coordinator
    await prisma.region.update({
      where: { id: region.id },
      data: { areaCoordinatorId: areaCoordinator.id }
    });

    // 3. Create Coordinator account
    const coordPassword = await bcrypt.hash('coord123', 10);
    const coordinator = await prisma.user.create({
      data: {
        username: 'coordinator',
        passwordHash: coordPassword,
        email: 'coordinator@lottery.com',
        fullName: 'Coordinator',
        role: 'coordinator',
        regionId: region.id,
        agentId: 'C001',
        createdById: areaCoordinator.id
      }
    });
    console.log('✅ Created coordinator account (username: coordinator, password: coord123)');

    // Create balance for coordinator
    await prisma.userBalance.create({
      data: {
        userId: coordinator.id,
        currentBalance: 25000.00
      }
    });

    // 4. Create Agent account
    const agentPassword = await bcrypt.hash('agent123', 10);
    const agent = await prisma.user.create({
      data: {
        username: 'agent',
        passwordHash: agentPassword,
        email: 'agent@lottery.com',
        fullName: 'Test Agent',
        role: 'agent',
        regionId: region.id,
        coordinatorId: coordinator.id,
        agentId: 'A001',
        createdById: coordinator.id
      }
    });
    console.log('✅ Created agent account (username: agent, password: agent123)');

    // Create balance for agent
    await prisma.userBalance.create({
      data: {
        userId: agent.id,
        currentBalance: 10000.00
      }
    });

    // Assign default ticket template to agent
    const template = await prisma.ticketTemplate.findFirst();
    if (template) {
      await prisma.agentTicketTemplate.create({
        data: {
          agentId: agent.id,
          templateId: template.id
        }
      });
      console.log('✅ Assigned default ticket template to agent');
    }

    console.log('\n🎉 All default user accounts created successfully!');
    console.log('\n📋 Account Summary:');
    console.log('👑 SuperAdmin: superadmin / admin123');
    console.log('🛠️  Admin: admin / admin123');
    console.log('🌍 Area Coordinator: areacoord / areacoord123');
    console.log('📊 Coordinator: coordinator / coord123');
    console.log('🎫 Agent: agent / agent123');
    console.log('\n💰 All accounts have been loaded with initial balances');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultUsers();
