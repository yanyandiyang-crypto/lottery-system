const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSalesPerDraw() {
  try {
    console.log('🔍 Debugging Sales per Draw API...');
    
    // Find an area coordinator user
    const areaCoordinator = await prisma.user.findFirst({
      where: { role: 'area_coordinator' },
      select: {
        id: true,
        username: true,
        role: true,
        regionId: true,
        region: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('📍 Area Coordinator found:', areaCoordinator);
    
    if (!areaCoordinator) {
      console.log('❌ No area coordinator found in database');
      return;
    }
    
    if (!areaCoordinator.regionId) {
      console.log('❌ Area coordinator has no regionId assigned');
      return;
    }
    
    // Find agents under this area coordinator's region
    const areaAgents = await prisma.user.findMany({
      where: { 
        regionId: areaCoordinator.regionId, 
        role: 'agent' 
      },
      select: { 
        id: true,
        username: true,
        regionId: true
      }
    });
    
    console.log('👥 Agents in region:', areaAgents);
    
    // Test the date filtering
    const date = '2025-09-16';
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    console.log('📅 Date range:', { startDate, endDate });
    
    // Build the where clause like in the API
    let whereClause = {
      draw: {
        drawDate: {
          gte: startDate,
          lt: endDate
        }
      }
    };
    
    // Add area coordinator filtering
    if (areaAgents.length > 0) {
      whereClause.agentId = {
        in: areaAgents.map(agent => agent.id.toString())
      };
    } else {
      console.log('⚠️ No agents found for this area coordinator');
      whereClause.agentId = {
        in: [] // This will return no results
      };
    }
    
    console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));
    
    // Test the query
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        draw: {
          select: {
            id: true,
            drawTime: true,
            drawDate: true,
            status: true,
            winningNumber: true
          }
        }
      }
    });
    
    console.log('🎫 Tickets found:', tickets.length);
    console.log('✅ Query executed successfully');
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSalesPerDraw();
