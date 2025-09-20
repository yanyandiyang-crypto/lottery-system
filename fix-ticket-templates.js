const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTicketTemplates() {
  try {
    console.log('🔧 Fixing ticket template references...');
    
    // Get all tickets with invalid template IDs
    const tickets = await prisma.ticket.findMany({
      select: { id: true, templateId: true, agentId: true }
    });
    
    // Get valid templates
    const validTemplates = await prisma.ticketTemplate.findMany({
      select: { id: true, name: true }
    });
    
    console.log(`Found ${tickets.length} tickets`);
    console.log(`Valid templates: ${validTemplates.map(t => `${t.id}:${t.name}`).join(', ')}`);
    
    // Get the Green Money template (ID 2) as default
    const defaultTemplate = validTemplates.find(t => t.name === 'Green Money') || validTemplates[0];
    
    if (!defaultTemplate) {
      console.log('❌ No valid templates found');
      return;
    }
    
    console.log(`Using template ${defaultTemplate.id} (${defaultTemplate.name}) as default`);
    
    let updatedCount = 0;
    
    for (const ticket of tickets) {
      const templateExists = validTemplates.some(t => t.id === ticket.templateId);
      
      if (!templateExists) {
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { templateId: defaultTemplate.id }
        });
        updatedCount++;
      }
    }
    
    console.log(`✅ Updated ${updatedCount} tickets with valid template ID`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTicketTemplates();
