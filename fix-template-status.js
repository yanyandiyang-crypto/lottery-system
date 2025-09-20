const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTemplateStatus() {
  try {
    // Activate the Default Lottery Ticket Template
    const result = await prisma.ticket_templates.update({
      where: { id: 1 },
      data: { is_active: true }
    });
    
    console.log('Template activated successfully:', result);
    
    // Show all templates status
    const templates = await prisma.ticket_templates.findMany({
      select: { id: true, name: true, is_active: true }
    });
    console.log('All templates:', templates);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTemplateStatus();
