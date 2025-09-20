const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAssignment() {
  try {
    console.log('=== Debugging Template Assignment ===');
    
    // Check users table
    const users = await prisma.User.findMany({
      where: { role: 'agent' },
      select: { id: true, fullName: true, role: true }
    });
    console.log('Available agents:', users);
    
    // Check templates
    const templates = await prisma.ticket_templates.findMany({
      select: { id: true, name: true, is_active: true }
    });
    console.log('Available templates:', templates);
    
    // Check existing assignments
    const assignments = await prisma.agent_ticket_templates.findMany();
    console.log('Existing assignments:', assignments);
    
    // Try to create a test assignment
    if (users.length > 0 && templates.length > 0) {
      const testUserId = users[0].id;
      const testTemplateId = templates[0].id;
      
      console.log(`Attempting to assign template ${testTemplateId} to user ${testUserId}`);
      
      const assignment = await prisma.agent_ticket_templates.create({
        data: {
          agent_id: testUserId,
          template_id: testTemplateId
        }
      });
      
      console.log('Assignment created successfully:', assignment);
    }
    
  } catch (error) {
    console.error('Error during assignment:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

debugAssignment();
