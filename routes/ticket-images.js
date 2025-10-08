const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

/**
 * Serve pre-generated ticket HTML (instant response)
 */
router.get('/:ticketId/html', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Get pre-generated HTML from database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: parseInt(ticketId) || 0 },
          { ticketNumber: ticketId }
        ]
      },
      select: {
        generatedHTML: true,
        imageGenerated: true,
        ticketNumber: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (!ticket.generatedHTML || !ticket.imageGenerated) {
      return res.status(404).json({ error: 'Ticket HTML not pre-generated' });
    }

    // Return pre-generated HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(ticket.generatedHTML);

  } catch (error) {
    console.error('Error serving pre-generated HTML:', error);
    res.status(500).json({ error: 'Failed to serve ticket HTML' });
  }
});

/**
 * Generate ticket image using Puppeteer (fallback for old tickets)
 */
router.get('/:ticketId/image', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Get ticket data
    const ticket = await db.query(`
      SELECT t.*, u.username, u.fullName as agentName,
             d.drawDate, d.drawTime, d.id as drawId
      FROM tickets t
      LEFT JOIN users u ON t.agentId = u.id
      LEFT JOIN draws d ON t.drawId = d.id
      WHERE t.id = ? OR t.ticketNumber = ?
    `, [ticketId, ticketId]);

    if (!ticket.length) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const ticketData = ticket[0];
    
    // Get ticket bets
    const bets = await db.query(`
      SELECT * FROM ticket_bets WHERE ticketId = ?
    `, [ticketData.id]);

    ticketData.bets = bets;

    // Get active template
    const activeTemplate = await db.query(`
      SELECT * FROM ticket_templates WHERE isActive = 1 LIMIT 1
    `);

    if (!activeTemplate.length) {
      return res.status(500).json({ error: 'No active template found' });
    }

    // No more template system - use single Umatik template
    const { generateUmatikCenterTicketHTML } = require('../utils/umatikTicketTemplate');
    const ticketHTML = await generateUmatikCenterTicketHTML(ticketData, { 
      username: ticketData.agentName,
      id: ticketData.agentId 
    });

    // Launch Puppeteer to generate image
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport for 58mm width (220px)
    await page.setViewport({
      width: 220,
      height: 800, // Auto height
      deviceScaleFactor: 2 // High DPI for better quality
    });

    // Set content
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            margin: 0; 
            padding: 4px; 
            font-family: Arial, sans-serif; 
            background: white;
            width: 220px;
            box-sizing: border-box;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${ticketHTML}
      </body>
      </html>
    `, { waitUntil: 'networkidle0' });

    // Generate image
    const imageBuffer = await page.screenshot({
      type: 'png',
      fullPage: true,
      omitBackground: false
    });

    await browser.close();

    // Cache the image (optional)
    const imagePath = path.join(__dirname, '../temp', `ticket-${ticketData.ticketNumber}.png`);
    await fs.writeFile(imagePath, imageBuffer);

    // Return image
    res.set({
      'Content-Type': 'image/png',
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    });

    res.send(imageBuffer);

  } catch (error) {
    console.error('Error generating ticket image:', error);
    res.status(500).json({ error: 'Failed to generate ticket image' });
  }
});

/**
 * Generate and save ticket image during ticket creation
 */
router.post('/:ticketId/generate', async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Generate image using the same logic as above
    // But save to permanent storage instead of temp
    
    // Update ticket record with image path
    await db.query(`
      UPDATE tickets SET imagePath = ? WHERE id = ?
    `, [`/images/tickets/${ticketId}.png`, ticketId]);

    res.json({ 
      success: true, 
      imagePath: `/api/v1/tickets/${ticketId}/image`
    });

  } catch (error) {
    console.error('Error generating and saving ticket image:', error);
    res.status(500).json({ error: 'Failed to generate ticket image' });
  }
});

module.exports = router;
