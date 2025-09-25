const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugTemplate() {
  try {
    console.log('🔍 Checking ticket templates and assignments...');
    
    // Check if there are any ticket templates
    const templates = await prisma.ticketTemplate.findMany({
      include: {
        assignedAgents: true
      }
    });
    
    console.log(`Found ${templates.length} templates:`);
    templates.forEach(template => {
      console.log(`- Template ID: ${template.id}, Name: ${template.name}`);
      console.log(`  Assigned to ${template.assignedAgents.length} users`);
      if (template.design && template.design.elements) {
        const hasQR = template.design.elements.some(el => el.fieldId === 'qrCode');
        const hasLogo = template.design.elements.some(el => el.type === 'image');
        console.log(`  Has QR Code: ${hasQR}, Has Logo/Image: ${hasLogo}`);
      } else {
        console.log('  No design elements found - will use default template');
      }
    });
    
    // Check user template assignments
    const users = await prisma.user.findMany({
      where: { role: 'agent' },
      include: {
        assignedTemplates: true
      }
    });
    
    console.log(`\nAgent template assignments:`);
    users.forEach(user => {
      console.log(`- Agent ${user.fullName} (ID: ${user.id}): ${user.assignedTemplates.length} templates assigned`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugTemplate();
