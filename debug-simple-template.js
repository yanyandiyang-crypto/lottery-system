const { PrismaClient } = require('@prisma/client');
const TemplateRenderer = require('./utils/templateRenderer');

const prisma = new PrismaClient();

async function debugSimpleTemplate() {
  try {
    console.log('=== DEBUGGING SIMPLE TEMPLATE USAGE ===\n');
    
    // 1. Get a sample ticket
    const sampleTicket = await prisma.ticket.findFirst({
      include: {
        bets: true,
        draw: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });
    
    if (!sampleTicket) {
      console.log('❌ No tickets found in database');
      return;
    }
    
    console.log(`✅ Sample ticket found: ${sampleTicket.ticketNumber}`);
    console.log(`   Agent: ${sampleTicket.user.fullName} (ID: ${sampleTicket.user.id})`);
    console.log(`   Bets: ${sampleTicket.bets.length}`);
    
    // 2. Test the exact API endpoint logic from AgentTickets.js
    console.log('\n=== TESTING TEMPLATE RETRIEVAL ===');
    
    const assignments = await prisma.agentTicketTemplate.findMany({
      where: { agentId: sampleTicket.user.id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            design: true,
            isActive: true
          }
        }
      }
    });

    const activeTemplates = assignments
      .filter(assignment => assignment.template.isActive)
      .map(assignment => assignment.template);
    
    console.log(`Templates assigned to agent: ${activeTemplates.length}`);
    activeTemplates.forEach(template => {
      console.log(`  - ${template.name} (ID: ${template.id}) - Active: ${template.isActive}`);
    });
    
    // 3. Test the exact template selection logic
    let selectedTemplate = activeTemplates.find(t => t.name === 'Simple Ticket Template');
    
    if (selectedTemplate) {
      console.log(`✅ Simple Ticket Template found and selected!`);
    } else {
      console.log(`❌ Simple Ticket Template NOT found, using fallback`);
      selectedTemplate = activeTemplates[0];
      if (selectedTemplate) {
        console.log(`   Fallback template: ${selectedTemplate.name}`);
      } else {
        console.log(`   No templates available!`);
        return;
      }
    }
    
    // 4. Test template generation
    console.log('\n=== TESTING TEMPLATE GENERATION ===');
    
    try {
      const ticketHtml = await TemplateRenderer.generateTicketHTML(sampleTicket, selectedTemplate, sampleTicket.user);
      
      console.log(`✅ Template generation successful`);
      console.log(`   HTML length: ${ticketHtml.length} characters`);
      
      // Check for Simple Template specific content
      const hasNewbetting = ticketHtml.includes('NEWBETTING');
      const has3DLotto = ticketHtml.includes('3D LOTTO TICKET');
      const hasGoodLuck = ticketHtml.includes('GOOD LUCK');
      
      console.log(`   Contains "NEWBETTING": ${hasNewbetting ? '✅' : '❌'}`);
      console.log(`   Contains "3D LOTTO TICKET": ${has3DLotto ? '✅' : '❌'}`);
      console.log(`   Contains "GOOD LUCK": ${hasGoodLuck ? '✅' : '❌'}`);
      
      if (hasNewbetting && has3DLotto && hasGoodLuck) {
        console.log(`✅ Simple Template is being used correctly!`);
      } else {
        console.log(`❌ Simple Template content not found - using different template`);
      }
      
      // Save sample HTML for inspection
      const fs = require('fs');
      fs.writeFileSync('sample-ticket.html', ticketHtml);
      console.log(`   Sample HTML saved to: sample-ticket.html`);
      
    } catch (generationError) {
      console.log(`❌ Template generation failed: ${generationError.message}`);
      console.log(`   Stack: ${generationError.stack}`);
    }
    
    // 5. Test the backend API endpoint
    console.log('\n=== TESTING BACKEND API SIMULATION ===');
    
    try {
      // Simulate the POST /ticket-templates/generate request
      const mockResponse = await TemplateRenderer.generateTicketHTML(sampleTicket, selectedTemplate, sampleTicket.user);
      
      console.log(`✅ Backend API simulation successful`);
      console.log(`   Response length: ${mockResponse.length} characters`);
      
    } catch (apiError) {
      console.log(`❌ Backend API simulation failed: ${apiError.message}`);
    }
    
    // 6. Check template design structure
    console.log('\n=== TEMPLATE DESIGN ANALYSIS ===');
    console.log(`Template: ${selectedTemplate.name}`);
    console.log(`Type: ${selectedTemplate.design?.templateType || 'unknown'}`);
    console.log(`Canvas Size: ${JSON.stringify(selectedTemplate.design?.canvasSize || {})}`);
    console.log(`Elements: ${selectedTemplate.design?.elements?.length || 0}`);
    
    if (selectedTemplate.design?.elements) {
      console.log('\nTemplate Elements:');
      selectedTemplate.design.elements.forEach((element, index) => {
        console.log(`  ${index + 1}. ${element.type} (${element.id}): "${element.content?.substring(0, 50)}..."`);
      });
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSimpleTemplate();
