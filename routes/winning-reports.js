const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const WinningCalculator = require('../utils/winningCalculator');

const prisma = new PrismaClient();
const winningCalculator = new WinningCalculator();

// @route   GET /api/v1/winning-reports/summary
// @desc    Get winning summary for management
// @access  Protected (SuperAdmin, Admin, Area Coordinator, Coordinator)
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate, agentId, drawId } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Build where clause
    const whereClause = {};
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }
    if (agentId) {
      whereClause.userId = parseInt(agentId);
    }
    if (drawId) {
      whereClause.drawId = parseInt(drawId);
    }

    // Get tickets with bets and user info
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        bets: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumbers: true
          }
        }
      }
    });

    // Calculate gross sales
    const grossSales = tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);

    // Get winning numbers for the period
    const draws = await prisma.draw.findMany({
      where: {
        ...(drawId ? { id: parseInt(drawId) } : {}),
        ...(Object.keys(dateFilter).length > 0 ? { drawDate: dateFilter } : {})
      },
      select: {
        id: true,
        winningNumbers: true,
        drawDate: true,
        drawTime: true
      }
    });

    // Calculate expected winnings
    let totalExpectedWinnings = 0;
    let expectedWinningTickets = [];
    
    draws.forEach(draw => {
      if (draw.winningNumbers && draw.winningNumbers.length > 0) {
        const drawTickets = tickets.filter(t => t.drawId === draw.id);
        const allBets = drawTickets.flatMap(ticket => 
          ticket.bets.map(bet => ({
            ...bet,
            ticketNumber: ticket.ticketNumber,
            agentId: ticket.userId,
            ticketId: ticket.id
          }))
        );

        const expectedWinnings = winningCalculator.calculateExpectedWinnings(
          allBets, 
          draw.winningNumbers
        );

        totalExpectedWinnings += expectedWinnings.totalExpected;
        expectedWinningTickets = expectedWinningTickets.concat(expectedWinnings.winningTickets);
      }
    });

    // Get claimed winnings
    const claimedTickets = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        status: 'claimed',
        claimedAt: { not: null }
      },
      include: {
        bets: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    const claimedSummary = winningCalculator.calculateClaimedWinnings(claimedTickets);

    // Calculate net sales
    const netSalesData = winningCalculator.calculateNetSales(grossSales, claimedSummary.totalClaimed);

    // Generate comprehensive report
    const report = {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
        agentFilter: agentId || 'All agents',
        drawFilter: drawId || 'All draws'
      },
      summary: {
        grossSales: grossSales,
        expectedWinnings: totalExpectedWinnings,
        claimedWinnings: claimedSummary.totalClaimed,
        pendingClaims: totalExpectedWinnings - claimedSummary.totalClaimed,
        netSales: netSalesData.netSales,
        totalTickets: tickets.length,
        claimedTickets: claimedSummary.claimedCount
      },
      metrics: {
        claimRate: totalExpectedWinnings > 0 ? 
          (claimedSummary.totalClaimed / totalExpectedWinnings * 100) : 0,
        profitMargin: grossSales > 0 ? 
          (netSalesData.netSales / grossSales * 100) : 0,
        winRate: tickets.length > 0 ? 
          (expectedWinningTickets.length / tickets.length * 100) : 0
      },
      breakdown: {
        expectedWinnings: {
          tickets: expectedWinningTickets,
          byAgent: this.groupByAgent(expectedWinningTickets)
        },
        claimedWinnings: {
          tickets: claimedTickets,
          byAgent: claimedSummary.byAgent
        }
      }
    };

    res.json({
      success: true,
      report: report
    });

  } catch (error) {
    console.error('Winning reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating winning report',
      error: error.message
    });
  }
});

// @route   GET /api/v1/winning-reports/agent-summary
// @desc    Get winning summary by agent
// @access  Protected (Management roles)
router.get('/agent-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get all agents with their tickets
    const agents = await prisma.user.findMany({
      where: {
        role: 'agent'
      },
      include: {
        tickets: {
          where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
          include: {
            bets: true
          }
        }
      }
    });

    const agentSummaries = agents.map(agent => {
      const grossSales = agent.tickets.reduce((sum, ticket) => sum + ticket.totalAmount, 0);
      
      const claimedTickets = agent.tickets.filter(ticket => 
        ticket.status === 'claimed' && ticket.claimedAt
      );
      
      const claimedAmount = claimedTickets.reduce((sum, ticket) => {
        // Estimate claimed amount (you might want to store actual amounts)
        return sum + (ticket.totalAmount * 1000); // Rough estimate
      }, 0);

      return {
        agentId: agent.id,
        agentName: agent.fullName || agent.username,
        grossSales: grossSales,
        claimedWinnings: claimedAmount,
        netSales: grossSales - claimedAmount,
        totalTickets: agent.tickets.length,
        claimedTickets: claimedTickets.length,
        profitMargin: grossSales > 0 ? ((grossSales - claimedAmount) / grossSales * 100) : 0
      };
    });

    res.json({
      success: true,
      agentSummaries: agentSummaries,
      totals: {
        grossSales: agentSummaries.reduce((sum, agent) => sum + agent.grossSales, 0),
        claimedWinnings: agentSummaries.reduce((sum, agent) => sum + agent.claimedWinnings, 0),
        netSales: agentSummaries.reduce((sum, agent) => sum + agent.netSales, 0)
      }
    });

  } catch (error) {
    console.error('Agent summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating agent summary',
      error: error.message
    });
  }
});

// @route   GET /api/v1/winning-reports/daily-summary
// @desc    Get daily winning summary
// @access  Protected (Management roles)
router.get('/daily-summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysBack = parseInt(days);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get daily sales and winnings
    const dailyData = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as ticket_count,
        SUM(total_amount) as gross_sales,
        COUNT(CASE WHEN status = 'claimed' THEN 1 END) as claimed_count
      FROM tickets 
      WHERE created_at >= ${startDate}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    const formattedData = dailyData.map(day => ({
      date: day.date,
      ticketCount: parseInt(day.ticket_count),
      grossSales: parseFloat(day.gross_sales || 0),
      claimedCount: parseInt(day.claimed_count || 0),
      // Estimate claimed winnings (you might want to calculate actual amounts)
      estimatedClaimedWinnings: parseInt(day.claimed_count || 0) * 4500, // Average prize
      netSales: parseFloat(day.gross_sales || 0) - (parseInt(day.claimed_count || 0) * 4500)
    }));

    res.json({
      success: true,
      dailyData: formattedData,
      summary: {
        totalDays: formattedData.length,
        totalGrossSales: formattedData.reduce((sum, day) => sum + day.grossSales, 0),
        totalClaimedWinnings: formattedData.reduce((sum, day) => sum + day.estimatedClaimedWinnings, 0),
        totalNetSales: formattedData.reduce((sum, day) => sum + day.netSales, 0)
      }
    });

  } catch (error) {
    console.error('Daily summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating daily summary',
      error: error.message
    });
  }
});

// Helper function to group by agent
function groupByAgent(tickets) {
  const grouped = {};
  
  tickets.forEach(ticket => {
    const agentId = ticket.agentId;
    if (!grouped[agentId]) {
      grouped[agentId] = {
        count: 0,
        amount: 0,
        tickets: []
      };
    }
    
    grouped[agentId].count++;
    grouped[agentId].amount += ticket.prizeAmount || 0;
    grouped[agentId].tickets.push(ticket);
  });
  
  return grouped;
}

module.exports = router;
