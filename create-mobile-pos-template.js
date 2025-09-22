const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createMobilePOSTemplate() {
  try {
    console.log('=== CREATING MOBILE POS TICKET TEMPLATE ===\n');
    
    // Mobile POS template optimized for 58mm thermal printers
    const mobilePOSTemplate = {
      name: 'Mobile POS Ticket Template',
      description: 'Optimized template for 58mm thermal printers used in mobile POS systems',
      canvasWidth: 220, // 58mm in pixels (approximately 220px at 96 DPI)
      canvasHeight: 400, // Variable height, will adjust based on content
      backgroundColor: '#ffffff',
      isActive: true,
      elements: [
        // Header - Business Name
        {
          id: 'header',
          type: 'text',
          content: 'NEWBETTING LOTTERY',
          position: { x: 10, y: 10, width: 200, height: 20 },
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Separator line
        {
          id: 'separator1',
          type: 'shape',
          shapeType: 'line',
          position: { x: 10, y: 35, width: 200, height: 1 },
          style: {
            backgroundColor: '#000000',
            borderColor: '#000000'
          },
          zIndex: 1
        },
        
        // Ticket Number
        {
          id: 'ticketNumber',
          type: 'dynamic',
          fieldId: 'ticketNumber',
          content: 'Ticket: {{ticketNumber}}',
          position: { x: 10, y: 45, width: 200, height: 16 },
          style: {
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Draw Date and Time
        {
          id: 'drawDateTime',
          type: 'dynamic',
          fieldId: 'drawDate',
          content: 'Draw: {{drawDate}} {{drawTime}}',
          position: { x: 10, y: 65, width: 200, height: 14 },
          style: {
            fontSize: '10px',
            textAlign: 'center',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Separator line
        {
          id: 'separator2',
          type: 'shape',
          shapeType: 'line',
          position: { x: 10, y: 85, width: 200, height: 1 },
          style: {
            backgroundColor: '#000000',
            borderColor: '#000000'
          },
          zIndex: 1
        },
        
        // Bets Label
        {
          id: 'betsLabel',
          type: 'text',
          content: 'YOUR BETS:',
          position: { x: 10, y: 95, width: 200, height: 14 },
          style: {
            fontSize: '10px',
            fontWeight: 'bold',
            textAlign: 'left',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Bet Details
        {
          id: 'betsList',
          type: 'dynamic',
          fieldId: 'betsList',
          content: '{{betsList}}',
          position: { x: 10, y: 115, width: 200, height: 80 },
          style: {
            fontSize: '9px',
            textAlign: 'left',
            color: '#000000',
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.2'
          },
          zIndex: 1
        },
        
        // Separator line
        {
          id: 'separator3',
          type: 'shape',
          shapeType: 'line',
          position: { x: 10, y: 200, width: 200, height: 1 },
          style: {
            backgroundColor: '#000000',
            borderColor: '#000000'
          },
          zIndex: 1
        },
        
        // Total Amount
        {
          id: 'totalAmount',
          type: 'dynamic',
          fieldId: 'totalAmount',
          content: 'TOTAL: ₱{{totalAmount}}',
          position: { x: 10, y: 210, width: 200, height: 18 },
          style: {
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Agent Information
        {
          id: 'agentInfo',
          type: 'dynamic',
          fieldId: 'agentName',
          content: 'Agent: {{agentName}}',
          position: { x: 10, y: 235, width: 200, height: 12 },
          style: {
            fontSize: '9px',
            textAlign: 'center',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // QR Code for verification
        {
          id: 'qrCode',
          type: 'qr',
          content: '{{qrCodeData}}',
          position: { x: 85, y: 255, width: 50, height: 50 },
          style: {
            backgroundColor: '#ffffff'
          },
          zIndex: 1
        },
        
        // Timestamp
        {
          id: 'timestamp',
          type: 'dynamic',
          fieldId: 'timestamp',
          content: '{{timestamp}}',
          position: { x: 10, y: 315, width: 200, height: 10 },
          style: {
            fontSize: '8px',
            textAlign: 'center',
            color: '#666666',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Good Luck Message
        {
          id: 'goodLuck',
          type: 'text',
          content: 'GOOD LUCK! 🍀',
          position: { x: 10, y: 330, width: 200, height: 14 },
          style: {
            fontSize: '11px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: '#000000',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        },
        
        // Footer separator
        {
          id: 'separator4',
          type: 'shape',
          shapeType: 'line',
          position: { x: 10, y: 350, width: 200, height: 1 },
          style: {
            backgroundColor: '#000000',
            borderColor: '#000000'
          },
          zIndex: 1
        },
        
        // Footer message
        {
          id: 'footer',
          type: 'text',
          content: 'Thank you for playing!',
          position: { x: 10, y: 360, width: 200, height: 12 },
          style: {
            fontSize: '9px',
            textAlign: 'center',
            color: '#666666',
            fontFamily: 'Arial, sans-serif'
          },
          zIndex: 1
        }
      ]
    };
    
    // Create the template in the database
    const createdTemplate = await prisma.ticketTemplate.create({
      data: {
        name: mobilePOSTemplate.name,
        design: {
          description: mobilePOSTemplate.description,
          canvasWidth: mobilePOSTemplate.canvasWidth,
          canvasHeight: mobilePOSTemplate.canvasHeight,
          backgroundColor: mobilePOSTemplate.backgroundColor,
          elements: mobilePOSTemplate.elements
        },
        isActive: mobilePOSTemplate.isActive
      }
    });
    
    console.log('✅ Mobile POS Template Created Successfully!');
    console.log(`   Template ID: ${createdTemplate.id}`);
    console.log(`   Template Name: ${createdTemplate.name}`);
    console.log(`   Canvas Size: ${createdTemplate.design.canvasWidth}x${createdTemplate.design.canvasHeight}px`);
    console.log(`   Elements: ${createdTemplate.design.elements.length} elements`);
    console.log(`   Status: ${createdTemplate.isActive ? 'Active' : 'Inactive'}`);
    
    console.log('\n=== TEMPLATE FEATURES ===');
    console.log('📱 Optimized for 58mm thermal printers');
    console.log('🎯 Compact layout with essential information');
    console.log('📊 Dynamic content with template variables');
    console.log('🔍 QR code for ticket verification');
    console.log('💰 Prominent total amount display');
    console.log('👤 Agent identification');
    console.log('⏰ Timestamp for tracking');
    
    console.log('\n=== NEXT STEPS ===');
    console.log('1. Use Template Assignment page to assign to agents');
    console.log('2. Test printing with actual mobile POS devices');
    console.log('3. Adjust element positions if needed for your printer');
    
    return createdTemplate;
    
  } catch (error) {
    console.error('❌ Error creating Mobile POS template:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createMobilePOSTemplate()
  .then(() => {
    console.log('\n🎉 Mobile POS Template Creation Complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create template:', error);
    process.exit(1);
  });
