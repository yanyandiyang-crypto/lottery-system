const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixTemplateDesign() {
  try {
    console.log('🔧 Adding QR code and logo to templates...');
    
    // Get the template that has proper design (Classic Blue)
    const goodTemplate = await prisma.ticketTemplate.findFirst({
      where: { name: 'Classic Blue' }
    });
    
    if (!goodTemplate || !goodTemplate.design.elements) {
      console.log('❌ Classic Blue template not found or has no elements');
      return;
    }
    
    console.log('✅ Found Classic Blue template with proper design');
    
    // Update Green Money template (the one assigned to Test Agent)
    const greenMoneyTemplate = await prisma.ticketTemplate.findFirst({
      where: { name: 'Green Money' }
    });
    
    if (greenMoneyTemplate) {
      // Create a design based on Classic Blue but with green theme
      const greenDesign = {
        ...goodTemplate.design,
        backgroundColor: '#f0f8f0',
        elements: goodTemplate.design.elements.map(element => {
          if (element.style && element.style.color) {
            return {
              ...element,
              style: {
                ...element.style,
                color: element.style.color === '#1e40af' ? '#16a34a' : element.style.color
              }
            };
          }
          return element;
        })
      };
      
      await prisma.ticketTemplate.update({
        where: { id: greenMoneyTemplate.id },
        data: { design: greenDesign }
      });
      
      console.log('✅ Updated Green Money template with QR code and logo');
    }
    
    // Update Elegant Black template
    const blackTemplate = await prisma.ticketTemplate.findFirst({
      where: { name: 'Elegant Black' }
    });
    
    if (blackTemplate) {
      const blackDesign = {
        ...goodTemplate.design,
        backgroundColor: '#1a1a1a',
        elements: goodTemplate.design.elements.map(element => {
          if (element.style && element.style.color) {
            return {
              ...element,
              style: {
                ...element.style,
                color: element.style.color === '#1e40af' ? '#ffffff' : element.style.color,
                backgroundColor: element.style.backgroundColor === '#ffffff' ? '#1a1a1a' : element.style.backgroundColor
              }
            };
          }
          return element;
        })
      };
      
      await prisma.ticketTemplate.update({
        where: { id: blackTemplate.id },
        data: { design: blackDesign }
      });
      
      console.log('✅ Updated Elegant Black template with QR code and logo');
    }
    
    console.log('🎉 All templates now have QR codes and logos!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixTemplateDesign();
