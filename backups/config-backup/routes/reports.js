const express = require('express');
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const { requireAdmin, requireAreaCoordinator, requireCoordinator } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/v1/reports/sales
// @desc    Get sales reports with hierarchical filtering (aligned with dashboard)
// @access  Private
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'summary', groupBy = 'date' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Use half-open date window [start, nextDay(end)) to include full endDate
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    let whereClause = {
      createdAt: {
        gte: start,
        lt: end
      }
    };

    // Role-based filtering: always filter by ticket.userId lists to match dashboard
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
      case 'operator':
        // No additional filtering
        break;
      case 'area_coordinator': {
        if (req.user.regionId) {
          const areaAgents = await prisma.user.findMany({
            where: { regionId: req.user.regionId, role: 'agent' },
            select: { id: true }
          });
          whereClause.userId = { in: areaAgents.map(a => a.id) };
        }
        break;
      }
      case 'coordinator': {
        const coordAgents = await prisma.user.findMany({
          where: { coordinatorId: req.user.id, role: 'agent' },
          select: { id: true }
        });
        whereClause.userId = { in: coordAgents.map(a => a.id) };
        break;
      }
      case 'agent':
        whereClause.userId = req.user.id;
        break;
    }

    // Use tickets as the source of truth (same as dashboard)
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            role: true,
            coordinator: { select: { id: true, fullName: true } },
            region: { select: { id: true, name: true } }
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true,
            status: true
          }
        },
        winningTickets: { select: { prizeAmount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate winnings aligned to tickets returned
    const totalWinnings = tickets.reduce((sum, ticket) => {
      const w = ticket.winningTickets.reduce((ws, wt) => ws + (wt.prizeAmount || 0), 0);
      return sum + w;
    }, 0);

    // Calculate summary aligned with dashboard
    const totalSales = tickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
    const summary = {
      totalSales,
      totalGross: totalSales,
      totalNet: totalSales - totalWinnings,
      totalTickets: tickets.length,
      totalWinnings,
      activeAgents: [...new Set(tickets.map(t => t.userId))].length,
      avgDailySales: 0,
      peakDaySales: 0,
      salesChange: 0,
      ticketsChange: 0
    };

    // Group by date for overview
    const salesByDate = {};
    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { date, totalAmount: 0, ticketCount: 0, agents: new Set() };
      }
      salesByDate[date].totalAmount += ticket.totalAmount || 0;
      salesByDate[date].ticketCount += 1;
      salesByDate[date].agents.add(ticket.userId);
    });

    const details = Object.values(salesByDate).map(day => ({
      ...day,
      agents: day.agents.size
    }));

    res.json({
      success: true,
      data: {
        summary,
        details,
        sales: reportType === 'detailed' ? tickets : []
      }
    });

  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/reports/export
// @desc    Export reports based on reportType and format
// @access  Private
router.get('/export', async (req, res) => {
  try {
    console.log('Export route hit - Query params:', req.query);
    console.log('Export route hit - User:', req.user ? req.user.id : 'No user');
    const { reportType, format = 'excel', startDate, endDate } = req.query;
    
    if (!reportType) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Route to appropriate export handler based on reportType and format
    switch (reportType) {
      case 'sales':
        if (format === 'csv') {
          return handleSalesExportCSV(req, res);
        } else {
          return handleSalesExportExcel(req, res);
        }
      case 'hierarchy':
        if (format === 'csv') {
          return handleHierarchyExportCSV(req, res);
        } else {
          return handleHierarchyExportExcel(req, res);
        }
      case 'winners':
        if (format === 'csv') {
          return handleWinnersExportCSV(req, res);
        } else {
          return handleWinnersExportExcel(req, res);
        }
      case 'per-draw':
        if (format === 'csv') {
          return handlePerDrawExportCSV(req, res);
        } else {
          return handlePerDrawExportExcel(req, res);
        }
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid report type'
        });
    }
  } catch (error) {
    console.error('Export reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/reports/sales
// @desc    Get sales report data (aligned with dashboard, duplicate route)
// @access  Private
router.get('/sales', async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'summary', groupBy = 'date' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Use half-open date window [start, nextDay(end))
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);

    let whereClause = {
      createdAt: { gte: start, lt: end }
    };

    // Role-based filtering to match dashboard (filter by ticket.userId)
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
      case 'operator':
        break;
      case 'area_coordinator':
        if (req.user.regionId) {
          const areaAgents = await prisma.user.findMany({
            where: { regionId: req.user.regionId, role: 'agent' },
            select: { id: true }
          });
          whereClause.userId = { in: areaAgents.map(a => a.id) };
        }
        break;
      case 'coordinator': {
        const coordAgents = await prisma.user.findMany({
          where: { coordinatorId: req.user.id, role: 'agent' },
          select: { id: true }
        });
        whereClause.userId = { in: coordAgents.map(a => a.id) };
        break;
      }
      case 'agent':
        whereClause.userId = req.user.id;
        break;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, fullName: true, role: true,
            coordinator: { select: { id: true, fullName: true } },
            region: { select: { id: true, name: true } } }
        },
        draw: { select: { id: true, drawDate: true, drawTime: true, winningNumber: true, status: true } },
        winningTickets: { select: { prizeAmount: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalWinnings = tickets.reduce((sum, t) => sum + t.winningTickets.reduce((s, wt) => s + (wt.prizeAmount || 0), 0), 0);
    const totalSales = tickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const summary = {
      totalSales,
      totalGross: totalSales,
      totalNet: totalSales - totalWinnings,
      totalTickets: tickets.length,
      totalWinnings,
      activeAgents: [...new Set(tickets.map(t => t.userId))].length,
      avgDailySales: 0,
      peakDaySales: 0,
      salesChange: 0,
      ticketsChange: 0
    };

    let details = [];
    if (reportType === 'hierarchy') {
      details = generateHierarchyData(tickets);
    } else if (reportType === 'agent') {
      details = generateAgentData(tickets);
    } else {
      details = generateSummaryData(tickets, groupBy);
    }

    const topPerformers = generateTopPerformers(tickets);

    res.json({
      success: true,
      data: { summary, details, topPerformers, chartData: generateChartData(tickets) }
    });

  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route   GET /api/reports/export/sales
// @desc    Export sales report to Excel with hierarchical format
// @access  Private
router.get('/export/sales', async (req, res) => {
  try {
    const { startDate, endDate, format = 'excel' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    // Get hierarchical sales data
    const hierarchicalData = await getHierarchicalSalesData(req.user, startDate, endDate);

    if (format === 'excel') {
      return handleSalesExportExcel(req, res, hierarchicalData, startDate, endDate);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Only Excel format is supported'
      });
    }

  } catch (error) {
    console.error('Export sales report error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper function to handle Excel export with hierarchical format
async function handleSalesExportExcel(req, res, hierarchicalData, startDate, endDate) {
  try {
    // All roles are allowed to export Excel reports

    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Filter data based on user role
    const filteredData = await filterDataByUserRole(hierarchicalData, req.user);
    
    // Create daily sales sheet with filtered data
    const dailySalesSheet = createDailySalesSheet(filteredData, req.user, startDate, endDate);
    XLSX.utils.book_append_sheet(workbook, dailySalesSheet, 'Daily Sales');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = getFilenameByRole(req.user, startDate, endDate);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);
  } catch (error) {
    console.error('Export sales Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

// Helper function to filter data based on user role
async function filterDataByUserRole(hierarchicalData, user) {
  switch (user.role) {
    case 'superadmin':
    case 'admin':
      // Can see all data
      return hierarchicalData;
    
    case 'area_coordinator':
      // Area coordinators can see data from their region
      const filteredAreaCoordData = {};
      
      // Get the user's region information
      const userWithRegion = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          region: {
            select: { id: true, name: true }
          }
        }
      });
      
      if (userWithRegion?.region) {
        Object.values(hierarchicalData).forEach(region => {
          // Only show regions that match the Area Coordinator's region
          if (region.name === userWithRegion.region.name) {
            filteredAreaCoordData[region.name] = region;
          }
        });
      }
      
      return filteredAreaCoordData;
    
    case 'coordinator':
      // Only see their coordinators and agents
      const filteredCoordData = {};
      
      // Get agents under this coordinator
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: user.id, role: 'agent' },
        select: { id: true, fullName: true }
      });
      
      Object.values(hierarchicalData).forEach(region => {
        const coordinators = {};
        Object.values(region.coordinators).forEach(coordinator => {
          // Check if any of the coordinator's agents match the current user's agents
          const matchingAgents = {};
          Object.values(coordinator.agents).forEach(agent => {
            const agentMatch = coordAgents.find(coordAgent => 
              coordAgent.fullName === agent.name
            );
            if (agentMatch) {
              matchingAgents[agent.name] = agent;
            }
          });
          
          if (Object.keys(matchingAgents).length > 0) {
            coordinators[coordinator.name] = {
              ...coordinator,
              agents: matchingAgents
            };
          }
        });
        
        if (Object.keys(coordinators).length > 0) {
          filteredCoordData[region.name] = {
            ...region,
            coordinators: coordinators
          };
        }
      });
      
      return filteredCoordData;
    
    case 'agent':
      // Only see their own data
      const filteredAgentData = {};
      
      Object.values(hierarchicalData).forEach(region => {
        const coordinators = {};
        Object.values(region.coordinators).forEach(coordinator => {
          const agents = {};
          Object.values(coordinator.agents).forEach(agent => {
            // Check if this agent matches the current user by name
            if (agent.name === (user.fullName || user.username)) {
              agents[agent.name] = agent;
            }
          });
          
          if (Object.keys(agents).length > 0) {
            coordinators[coordinator.name] = {
              ...coordinator,
              agents: agents
            };
          }
        });
        
        if (Object.keys(coordinators).length > 0) {
          filteredAgentData[region.name] = {
            ...region,
            coordinators: coordinators
          };
        }
      });
      
      return filteredAgentData;
    
    default:
      return {};
  }
}

// Helper function to generate filename based on user role
function getFilenameByRole(user, startDate, endDate) {
  const roleLabels = {
    'superadmin': 'All-Regions',
    'admin': 'All-Regions',
    'coordinator': `Coordinator-${user.id}`,
    'agent': `Agent-${user.id}`
  };
  
  const roleLabel = roleLabels[user.role] || 'Unknown';
  return `daily-sales-${roleLabel}-${startDate}.xlsx`;
}

// Helper function to create daily sales sheet
function createDailySalesSheet(hierarchicalData, user, startDate, endDate) {
  const sheetData = [];
  
  // Add report header
  sheetData.push([
    'Daily Sales Report',
    '',
    '',
    ''
  ]);
  
  sheetData.push([
    `Generated by: ${user.fullName || user.username}`,
    `Date: ${startDate}`,
    '',
    ''
  ]);
  
  // Add empty row for spacing
  sheetData.push(['', '', '', '']);
  
  // Add data header row
  sheetData.push([
    'Name',
    'Gross Sales',
    'Winnings',
    'Net Sales'
  ]);

  // Add empty row for spacing
  sheetData.push(['', '', '', '']);

  // Check if there's any data
  if (Object.keys(hierarchicalData).length === 0) {
    sheetData.push([
      'No data available for your role and permissions',
      '',
      '',
      ''
    ]);
    return XLSX.utils.aoa_to_sheet(sheetData);
  }

  // Process each region (Area Coordinator) - SKIP the region row
  Object.values(hierarchicalData).forEach(region => {
    // Skip adding Area Coordinator row - don't show region totals

    // Process each coordinator in this region
    Object.values(region.coordinators).forEach(coordinator => {
      // Add Coordinator row (indented) - with blank sales values
      sheetData.push([
        `  ${coordinator.name} (Coordinator)`,
        '', // Blank gross sales
        '', // Blank winnings
        ''  // Blank net sales
      ]);

      // Process each agent under this coordinator
      Object.values(coordinator.agents).forEach(agent => {
        // Add Agent row (double indented)
        sheetData.push([
          `    ${agent.name}`,
          `₱${agent.grossSales.toLocaleString()}`,
          `₱${agent.winnings.toLocaleString()}`,
          `₱${agent.netSales.toLocaleString()}`
        ]);
      });

      // Add empty row after each coordinator for spacing
      sheetData.push(['', '', '', '']);
    });
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set column widths for better visibility
  const columnWidths = [
    { wch: 30 }, // Name column - wider for names
    { wch: 15 }, // Gross Sales column
    { wch: 15 }, // Winnings column  
    { wch: 15 }  // Net Sales column
  ];
  
  worksheet['!cols'] = columnWidths;
  
  return worksheet;
}

// Helper function to generate summary data
function generateHierarchicalSummary(hierarchicalData, user) {
  const summary = [];
  
  // Add user info header
  summary.push({
    'Report Generated By': user.fullName || user.username,
    'Role': user.role,
    'Generated Date': new Date().toLocaleDateString(),
    'Report Scope': getReportScope(user),
    '': '',
    '': ''
  });
  
  // Add empty row
  summary.push({});
  
  // Add data summary
  Object.values(hierarchicalData).forEach(region => {
    summary.push({
      'Region': region.name,
      'Area Coordinator': region.areaCoordinator,
      'Total Coordinators': Object.keys(region.coordinators).length,
      'Total Agents': Object.values(region.coordinators).reduce((sum, coord) => 
        sum + Object.keys(coord.agents).length, 0),
      'Gross Sales': `₱${region.grossSales.toLocaleString()}`,
      'Winnings': `₱${region.winnings.toLocaleString()}`,
      'Net Sales': `₱${region.netSales.toLocaleString()}`
    });
  });

  return summary;
}

// Helper function to get report scope description
function getReportScope(user) {
  switch (user.role) {
    case 'superadmin':
    case 'admin':
      return 'All Regions and Users';
    case 'area_coordinator':
      return `Region ${user.regionId} Only`;
    case 'coordinator':
      return `My Coordinators and Agents Only`;
    case 'agent':
      return 'My Sales Only';
    default:
      return 'Unknown Scope';
  }
}

// @route   GET /api/reports/winners/excel
// @desc    Export winners report to Excel
// @access  Private
router.get('/winners/excel', async (req, res) => {
  try {
    const { startDate, endDate, drawId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    let whereClause = {
      draw: {
        drawDate: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    };

    if (drawId) {
      whereClause.drawId = parseInt(drawId);
    }

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all winners
        break;
      case 'area_coordinator':
        whereClause.agent = {
          regionId: req.user.regionId
        };
        break;
      case 'coordinator':
        whereClause.agent = {
          coordinatorId: req.user.id
        };
        break;
      case 'agent':
        whereClause.agentId = req.user.id;
        break;
    }

    const winners = await prisma.winningTicket.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            betType: true,
            betDigits: true,
            betAmount: true,
            createdAt: true
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true
          }
        },
        agent: {
          select: {
            id: true,
            username: true,
            fullName: true,
            coordinator: {
              select: {
                id: true,
                fullName: true
              }
            },
            region: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        coordinator: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Prepare data for Excel
    const excelData = winners.map(winner => ({
      'Ticket Number': winner.ticket.ticketNumber,
      'Agent Name': winner.agent.fullName,
      'Agent ID': winner.agent.id,
      'Coordinator': winner.coordinator.fullName,
      'Region': winner.agent.region?.name || 'N/A',
      'Draw Date': winner.draw.drawDate.toISOString().split('T')[0],
      'Draw Time': winner.draw.drawTime,
      'Winning Number': winner.draw.winningNumber,
      'Bet Type': winner.betType,
      'Bet Digits': winner.betDigits,
      'Bet Amount': winner.ticket.betAmount,
      'Winning Prize': winner.winningPrize,
      'Is Paid': winner.isPaid ? 'Yes' : 'No',
      'Paid At': winner.paidAt ? winner.paidAt.toISOString() : 'N/A',
      'Created At': winner.createdAt.toISOString()
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for winners report
    const winnerColumnWidths = [
      { wch: 20 }, // Ticket Number
      { wch: 20 }, // Agent Name
      { wch: 10 }, // Agent ID
      { wch: 20 }, // Coordinator
      { wch: 15 }, // Region
      { wch: 12 }, // Draw Date
      { wch: 12 }, // Draw Time
      { wch: 15 }, // Winning Number
      { wch: 12 }, // Bet Type
      { wch: 15 }, // Bet Digits
      { wch: 12 }, // Bet Amount
      { wch: 15 }, // Winning Prize
      { wch: 10 }, // Is Paid
      { wch: 20 }, // Paid At
      { wch: 20 }  // Created At
    ];
    worksheet['!cols'] = winnerColumnWidths;

    // Add summary sheet
    const summaryData = generateWinnersSummary(winners);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    
    // Set column widths for summary sheet
    const summaryColumnWidths = [
      { wch: 25 }, // Metric column
      { wch: 20 }  // Value column
    ];
    summarySheet['!cols'] = summaryColumnWidths;

    // Add worksheets to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Winners Report');
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=winners-report-${startDate}.xlsx`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

  } catch (error) {
    console.error('Export winners Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/reports/hierarchy
// @desc    Get hierarchical sales report
// @access  Private
router.get('/hierarchy', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    let whereClause = {
      ticket: {
        draw: {
          drawDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      }
    };

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all sales
        break;
      case 'area_coordinator':
        whereClause.agent = {
          regionId: req.user.regionId
        };
        break;
      case 'coordinator':
        whereClause.agent = {
          coordinatorId: req.user.id
        };
        break;
      case 'agent':
        whereClause.agentId = req.user.id;
        break;
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        ticket: {
          include: {
            draw: {
              select: {
                drawDate: true,
                drawTime: true,
                winningNumber: true
              }
            }
          }
        },
        agent: {
          select: {
            id: true,
            fullName: true,
            coordinator: {
              select: {
                id: true,
                fullName: true
              }
            },
            region: {
              select: {
                id: true,
                name: true,
                areaCoordinator: {
                  select: {
                    id: true,
                    fullName: true
                  }
                }
              }
            }
          }
        },
        winningTickets: {
          select: {
            prizeAmount: true
          }
        }
      }
    });

    // Group data by draw time
    const drawTimeSummary = {
      '2PM': { sales: 0, tickets: 0, winnings: 0 },
      '5PM': { sales: 0, tickets: 0, winnings: 0 },
      '9PM': { sales: 0, tickets: 0, winnings: 0 }
    };

    const agentSales = {};

    sales.forEach(ticket => {
      const drawTime = ticket.ticket.drawTime;
      const amount = parseFloat(ticket.amount) || 0;
      const winnings = ticket.winningTickets.reduce((sum, w) => sum + parseFloat(w.prizeAmount || 0), 0);

      // Update summary
      if (drawTimeSummary[drawTime]) {
        drawTimeSummary[drawTime].sales += amount;
        drawTimeSummary[drawTime].tickets += 1;
        drawTimeSummary[drawTime].winnings += winnings;
      }

      // Update agent sales
      const agentId = ticket.agent.id;
      if (!agentSales[agentId]) {
        agentSales[agentId] = {
          name: ticket.agent.username,
          region: ticket.agent.region,
          coordinator: ticket.agent.coordinator?.username || 'N/A',
          areaCoordinator: ticket.agent.coordinator?.areaCoordinator?.username || 'N/A',
          '2PM': 0,
          '5PM': 0,
          '9PM': 0,
          total: 0
        };
      }

      if (agentSales[agentId][drawTime] !== undefined) {
        agentSales[agentId][drawTime] += amount;
        agentSales[agentId].total += amount;
      }
    });

    // Group agents by area coordinator and coordinator
    const hierarchicalData = {};
    Object.values(agentSales).forEach(agent => {
      const areaCoord = agent.areaCoordinator;
      const coord = agent.coordinator;

      if (!hierarchicalData[areaCoord]) {
        hierarchicalData[areaCoord] = {
          name: `${areaCoord} (Area Coordinator)`,
          coordinators: {}
        };
      }

      if (!hierarchicalData[areaCoord].coordinators[coord]) {
        hierarchicalData[areaCoord].coordinators[coord] = {
          name: `${coord} (Coordinator)`,
          agents: []
        };
      }

      hierarchicalData[areaCoord].coordinators[coord].agents.push(agent);
    });

    // Convert to array format
    const details = Object.values(hierarchicalData).map(areaCoord => ({
      name: areaCoord.name,
      coordinators: Object.values(areaCoord.coordinators).map(coord => ({
        name: coord.name,
        agents: coord.agents
      }))
    }));

    res.json({
      success: true,
      data: {
        summary: drawTimeSummary,
        details: details
      }
    });

  } catch (error) {
    console.error('Draw time sales error:', error);
    res.status(500).json({ error: 'Failed to fetch draw time sales data' });
  }
});

// Export handler functions
async function handleSalesExportCSV(req, res) {
  const { startDate, endDate } = req.query;

  let whereClause = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  // Role-based filtering
  switch (req.user.role) {
    case 'superadmin':
    case 'admin':
      break;
    case 'area_coordinator':
      whereClause.user = {
        regionId: req.user.regionId
      };
      break;
    case 'coordinator':
      whereClause.user = {
        coordinatorId: req.user.id
      };
      break;
    case 'agent':
      whereClause.userId = req.user.id;
      break;
  }

  const sales = await prisma.sale.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          coordinator: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      },
      draw: {
        select: {
          id: true,
          drawDate: true,
          drawTime: true,
          winningNumber: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Generate CSV content
  const csvHeaders = [
    'Ticket Number',
    'Agent Name',
    'Agent ID',
    'Coordinator',
    'Draw Date',
    'Draw Time',
    'Bet Type',
    'Bet Combination',
    'Bet Amount',
    'Total Amount',
    'Status',
    'Created At'
  ];

  const csvRows = tickets.map(ticket => [
    ticket.ticketNumber,
    ticket.user?.fullName || 'Unknown',
    ticket.agentId,
    ticket.user?.coordinator?.fullName || 'N/A',
    ticket.draw?.drawDate?.toISOString().split('T')[0] || 'N/A',
    ticket.draw?.drawTime || 'N/A',
    ticket.betType,
    ticket.betCombination,
    ticket.betAmount,
    ticket.totalAmount,
    ticket.status,
    ticket.createdAt.toISOString()
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=sales-report-${startDate}.csv`);
  res.send(csvContent);
}


async function handleHierarchyExportCSV(req, res) {
  // Simplified hierarchy export - can be expanded later
  return handleSalesExportCSV(req, res);
}

async function handleHierarchyExportExcel(req, res) {
  // Simplified hierarchy export - can be expanded later
  return handleSalesExportExcel(req, res);
}

async function handleWinnersExportCSV(req, res) {
  const { startDate, endDate } = req.query;

  let whereClause = {
    draw: {
      drawDate: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }
  };

  // Role-based filtering
  switch (req.user.role) {
    case 'superadmin':
    case 'admin':
      break;
    case 'area_coordinator':
      if (req.user.regionId) {
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent' },
          select: { id: true }
        });
        whereClause.ticket = {
          agentId: {
            in: areaAgents.map(agent => agent.id)
          }
        };
      }
      break;
    case 'coordinator':
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      whereClause.ticket = {
        agentId: {
          in: coordAgents.map(agent => agent.id)
        }
      };
      break;
    case 'agent':
      whereClause.ticket = {
        agentId: req.user.id
      };
      break;
  }

  const winners = await prisma.winningTicket.findMany({
    where: whereClause,
    include: {
      ticket: {
        select: {
          ticketNumber: true,
          betType: true,
          betCombination: true,
          betAmount: true,
          createdAt: true
        }
      },
      draw: {
        select: {
          id: true,
          drawDate: true,
          drawTime: true,
          winningNumber: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Generate CSV content for winners
  const csvHeaders = [
    'Ticket Number',
    'Draw Date',
    'Draw Time',
    'Winning Number',
    'Bet Type',
    'Bet Combination',
    'Bet Amount',
    'Prize Amount',
    'Created At'
  ];

  const csvRows = winners.map(winner => [
    winner.ticket.ticketNumber,
    winner.draw.drawDate.toISOString().split('T')[0],
    winner.draw.drawTime,
    winner.draw.winningNumber,
    winner.ticket.betType,
    winner.ticket.betCombination,
    winner.ticket.betAmount,
    winner.prizeAmount,
    winner.createdAt.toISOString()
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=winners-report-${startDate}.csv`);
  res.send(csvContent);
}

async function handleWinnersExportExcel(req, res) {
  // Similar to CSV but with Excel format - simplified for now
  return handleWinnersExportCSV(req, res);
}

// Handler functions for different report types
async function handleSalesReport(req, res) {
  const { startDate, endDate, reportType = 'summary', groupBy = 'date' } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }

  let whereClause = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  // Role-based filtering
  switch (req.user.role) {
    case 'superadmin':
    case 'admin':
      break;
    case 'area_coordinator':
      // Get agents in the same region as the Area Coordinator
      const areaAgents = await prisma.user.findMany({
        where: { regionId: req.user.regionId, role: 'agent' },
        select: { id: true }
      });
      whereClause.agentId = {
        in: areaAgents.map(agent => agent.id)
      };
      break;
    case 'coordinator':
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      whereClause.agentId = {
        in: coordAgents.map(agent => agent.id)
      };
      break;
    case 'agent':
      whereClause.agentId = req.user.id;
      break;
  }

  const sales = await prisma.sale.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          coordinator: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      },
      draw: {
        select: {
          id: true,
          drawDate: true,
          drawTime: true,
          winningNumber: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate summary statistics
  const summary = {
    totalSales: sales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    totalTickets: sales.reduce((sum, sale) => sum + sale.ticketCount, 0),
    totalWinnings: 0, // Will be calculated from actual winnings data
    activeAgents: [...new Set(sales.map(s => s.userId))].length,
    avgDailySales: 0,
    peakDaySales: 0,
    salesChange: 0,
    ticketsChange: 0
  };

  // Group data based on reportType and groupBy
  let details = [];
  if (reportType === 'hierarchy') {
    details = generateHierarchyData(sales);
  } else if (reportType === 'agent') {
    details = generateAgentData(sales);
  } else {
    details = generateSummaryData(sales, groupBy);
  }

  // Get top performers
  const topPerformers = generateTopPerformers(sales);

  res.json({
    success: true,
    data: {
      summary,
      details,
      topPerformers,
      chartData: generateChartData(sales)
    }
  });
}

async function handleHierarchyReport(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }

  let whereClause = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  // Role-based filtering
  switch (req.user.role) {
    case 'superadmin':
    case 'admin':
      break;
    case 'area_coordinator':
      // Get agents in the same region as the Area Coordinator
      const areaAgents = await prisma.user.findMany({
        where: { regionId: req.user.regionId, role: 'agent' },
        select: { id: true }
      });
      whereClause.agentId = {
        in: areaAgents.map(agent => agent.id)
      };
      break;
    case 'coordinator':
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      whereClause.agentId = {
        in: coordAgents.map(agent => agent.id)
      };
      break;
    case 'agent':
      whereClause.agentId = req.user.id;
      break;
  }

  const tickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          coordinator: {
            select: {
              id: true,
              fullName: true
            }
          },
          region: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      draw: {
        select: {
          drawDate: true,
          drawTime: true,
          winningNumber: true,
          status: true
        }
      }
    }
  });

  // Group by hierarchy
  const hierarchyReport = generateHierarchyReportFromTickets(tickets);

  res.json({
    success: true,
    data: hierarchyReport
  });
}

async function handleWinnersReport(req, res) {
  const { startDate, endDate, drawId } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }

  let whereClause = {
    draw: {
      drawDate: {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      }
    }
  };

  if (drawId) {
    whereClause.drawId = parseInt(drawId);
  }

  // Role-based filtering
  switch (req.user.role) {
    case 'superadmin':
    case 'admin':
      break;
    case 'area_coordinator':
      if (req.user.regionId) {
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent' },
          select: { id: true }
        });
        whereClause.ticket = {
          agentId: {
            in: areaAgents.map(agent => agent.id)
          }
        };
      }
      break;
    case 'coordinator':
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      whereClause.ticket = {
        agentId: {
          in: coordAgents.map(agent => agent.id)
        }
      };
      break;
    case 'agent':
      whereClause.ticket = {
        agentId: req.user.id
      };
      break;
  }

  const winners = await prisma.winningTicket.findMany({
    where: whereClause,
    include: {
      ticket: {
        select: {
          ticketNumber: true,
          betType: true,
          betCombination: true,
          betAmount: true,
          createdAt: true
        }
      },
      draw: {
        select: {
          id: true,
          drawDate: true,
          drawTime: true,
          winningNumber: true,
          status: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: {
      winners,
      summary: {
        totalWinners: winners.length,
        totalPrize: winners.reduce((sum, winner) => sum + winner.prizeAmount, 0)
      }
    }
  });
}

// Helper functions for data processing
function generateSummaryData(tickets, groupBy) {
  // Group tickets by date
  const grouped = {};
  tickets.forEach(ticket => {
    const date = ticket.createdAt.toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = {
        date,
        totalSales: 0,
        totalTickets: 0,
        totalWinnings: 0
      };
    }
    grouped[date].totalSales += ticket.totalAmount;
    grouped[date].totalTickets += 1;
    // Calculate winnings from winningTickets relation
    const winnings = ticket.winningTickets.reduce((sum, wt) => sum + (wt.prizeAmount || 0), 0);
    grouped[date].totalWinnings += winnings;
  });
  return Object.values(grouped);
}

function generateAgentData(tickets) {
  const grouped = {};
  tickets.forEach(ticket => {
    const agentId = ticket.userId;
    if (!grouped[agentId]) {
      grouped[agentId] = {
        agentId,
        agentName: ticket.user?.fullName || 'Unknown',
        totalSales: 0,
        totalTickets: 0,
        totalWinnings: 0
      };
    }
    grouped[agentId].totalSales += ticket.totalAmount;
    grouped[agentId].totalTickets += 1;
    // Calculate winnings from winningTickets relation
    const winnings = ticket.winningTickets.reduce((sum, wt) => sum + (wt.prizeAmount || 0), 0);
    grouped[agentId].totalWinnings += winnings;
  });
  return Object.values(grouped);
}

function generateHierarchyData(tickets) {
  return generateAgentData(tickets); // Simplified for now
}

function generateTopPerformers(tickets) {
  const agentData = generateAgentData(tickets);
  return agentData.sort((a, b) => b.totalSales - a.totalSales).slice(0, 5);
}

function generateChartData(tickets) {
  const dailyData = generateSummaryData(tickets, 'date');
  return {
    labels: dailyData.map(d => d.date),
    datasets: [{
      label: 'Daily Sales',
      data: dailyData.map(d => d.totalSales)
    }]
  };
}

function generateHierarchyReportFromTickets(tickets) {
  const hierarchy = {};
  
  tickets.forEach(ticket => {
    const region = ticket.user?.region;
    const coordinator = ticket.user?.coordinator;
    const agent = ticket.user;

    if (!region) return;

    // Initialize region
    if (!hierarchy[region.id]) {
      hierarchy[region.id] = {
        name: region.name,
        grossSales: 0,
        winnings: 0,
        netSales: 0,
        coordinators: {}
      };
    }

    // Initialize coordinator
    if (coordinator && !hierarchy[region.id].coordinators[coordinator.id]) {
      hierarchy[region.id].coordinators[coordinator.id] = {
        name: coordinator.fullName,
        grossSales: 0,
        winnings: 0,
        netSales: 0,
        agents: {}
      };
    }

    const coordId = coordinator?.id || 'unassigned';
    if (!hierarchy[region.id].coordinators[coordId]) {
      hierarchy[region.id].coordinators[coordId] = {
        name: coordinator?.fullName || 'Unassigned',
        grossSales: 0,
        winnings: 0,
        netSales: 0,
        agents: {}
      };
    }

    // Initialize agent
    if (!hierarchy[region.id].coordinators[coordId].agents[agent.id]) {
      hierarchy[region.id].coordinators[coordId].agents[agent.id] = {
        name: agent.fullName,
        grossSales: 0,
        winnings: 0,
        netSales: 0
      };
    }

    // Add to totals
    const amount = ticket.totalAmount;
    const winnings = ticket.winningTickets?.reduce((sum, wt) => sum + (wt.prizeAmount || 0), 0) || 0;

    hierarchy[region.id].grossSales += amount;
    hierarchy[region.id].winnings += winnings;
    hierarchy[region.id].netSales += (amount - winnings);

    hierarchy[region.id].coordinators[coordId].grossSales += amount;
    hierarchy[region.id].coordinators[coordId].winnings += winnings;
    hierarchy[region.id].coordinators[coordId].netSales += (amount - winnings);

    hierarchy[region.id].coordinators[coordId].agents[agent.id].grossSales += amount;
    hierarchy[region.id].coordinators[coordId].agents[agent.id].winnings += winnings;
    hierarchy[region.id].coordinators[coordId].agents[agent.id].netSales += (amount - winnings);
  });

  return Object.values(hierarchy);
}

// Helper functions
function generateSalesSummary(sales) {
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);
  const totalWinnings = sales.reduce((sum, sale) => sum + (sale.ticket.winningPrize || 0), 0);
  const netSales = totalSales - totalWinnings;

  return [
    { Metric: 'Total Sales', Value: totalSales },
    { Metric: 'Total Gross', Value: totalSales },
    { Metric: 'Total Commission', Value: totalCommission },
    { Metric: 'Total Winnings', Value: totalWinnings },
    { Metric: 'Net Sales', Value: netSales },
    { Metric: 'Total Tickets', Value: sales.length }
  ];
}

function generateWinnersSummary(winners) {
  const totalWinners = winners.length;
  const totalPrize = winners.reduce((sum, winner) => sum + winner.winningPrize, 0);
  const paidWinners = winners.filter(w => w.isPaid).length;
  const unpaidWinners = totalWinners - paidWinners;
  const totalPaid = winners.filter(w => w.isPaid).reduce((sum, winner) => sum + winner.winningPrize, 0);

  return [
    { Metric: 'Total Winners', Value: totalWinners },
    { Metric: 'Total Prize Amount', Value: totalPrize },
    { Metric: 'Paid Winners', Value: paidWinners },
    { Metric: 'Unpaid Winners', Value: unpaidWinners },
    { Metric: 'Total Paid Amount', Value: totalPaid },
    { Metric: 'Outstanding Amount', Value: totalPrize - totalPaid }
  ];
}

function generateHierarchyReport(sales) {
  const hierarchy = {};

  sales.forEach(sale => {
    const region = sale.agent.region;
    const coordinator = sale.agent.coordinator;
    const agent = sale.agent;

    // Initialize region
    if (!hierarchy[region.id]) {
      hierarchy[region.id] = {
        name: region.name,
        areaCoordinator: region.areaCoordinator?.fullName || 'N/A',
        grossSales: 0,
        winnings: 0,
        netSales: 0,
        coordinators: {}
      };
    }

    // Initialize coordinator
    if (coordinator && !hierarchy[region.id].coordinators[coordinator.id]) {
      hierarchy[region.id].coordinators[coordinator.id] = {
        name: coordinator.fullName,
        grossSales: 0,
        winnings: 0,
        netSales: 0,
        agents: {}
      };
    }

    // Initialize agent
    if (!hierarchy[region.id].coordinators[coordinator.id].agents[agent.id]) {
      hierarchy[region.id].coordinators[coordinator.id].agents[agent.id] = {
        name: agent.fullName,
        grossSales: 0,
        winnings: 0,
        netSales: 0
      };
    }

    // Add to totals
    const amount = sale.totalAmount;
    const winnings = sale.ticket.winningPrize || 0;

    hierarchy[region.id].grossSales += amount;
    hierarchy[region.id].winnings += winnings;
    hierarchy[region.id].netSales += (amount - winnings);

    if (coordinator) {
      hierarchy[region.id].coordinators[coordinator.id].grossSales += amount;
      hierarchy[region.id].coordinators[coordinator.id].winnings += winnings;
      hierarchy[region.id].coordinators[coordinator.id].netSales += (amount - winnings);
    }

    hierarchy[region.id].coordinators[coordinator.id].agents[agent.id].grossSales += amount;
    hierarchy[region.id].coordinators[coordinator.id].agents[agent.id].winnings += winnings;
    hierarchy[region.id].coordinators[coordinator.id].agents[agent.id].netSales += (amount - winnings);
  });

  return Object.values(hierarchy);
}

// Helper function to get hierarchical sales data based on user role
async function getHierarchicalSalesData(user, startDate, endDate) {
  const whereClause = {
    createdAt: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  // Role-based filtering
  let includeRegions = [];
  switch (user.role) {
    case 'superadmin':
    case 'admin':
    case 'operator':
      // Can see all data
      break;
    case 'area_coordinator':
      // Get agents in the same region as the Area Coordinator
      const areaAgents = await prisma.user.findMany({
        where: { regionId: user.regionId, role: 'agent' },
        select: { id: true }
      });
      whereClause.userId = {
        in: areaAgents.map(agent => agent.id)
      };
      break;
    case 'coordinator':
      // Only see their agents
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: user.id, role: 'agent' },
        select: { id: true }
      });
      whereClause.agentId = {
        in: coordAgents.map(agent => agent.id)
      };
      break;
    case 'agent':
      whereClause.agentId = user.id;
      break;
  }

  // Get tickets with full hierarchy
  let tickets = await prisma.ticket.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          role: true,
          coordinator: {
            select: {
              id: true,
              fullName: true,
              region: {
                select: {
                  id: true,
                  name: true,
                  areaCoordinator: {
                    select: {
                      id: true,
                      fullName: true
                    }
                  }
                }
              }
            }
          },
          region: {
            select: {
              id: true,
              name: true,
              areaCoordinator: {
                select: {
                  id: true,
                  fullName: true
                }
              }
            }
          }
        }
      },
      winningTickets: {
        select: {
          prizeAmount: true
        }
      }
    }
  });

  // Filter by regions if needed
  if (includeRegions.length > 0) {
    tickets = tickets.filter(ticket => 
      ticket.user?.region?.id && includeRegions.includes(ticket.user.region.id)
    );
  }

  // Group data hierarchically
  const hierarchy = {};

  tickets.forEach(ticket => {
    const agent = ticket.user;
    if (!agent) return;

    const regionName = agent.region?.name || 'Unknown Region';
    const areaCoordinatorName = agent.region?.areaCoordinator?.fullName || 'Unknown Area Coordinator';
    const coordinatorName = agent.coordinator?.fullName || 'Unknown Coordinator';
    const agentName = agent.fullName;

    // Initialize hierarchy structure
    if (!hierarchy[regionName]) {
      hierarchy[regionName] = {
        name: regionName,
        areaCoordinator: areaCoordinatorName,
        coordinators: {},
        grossSales: 0,
        winnings: 0,
        netSales: 0
      };
    }

    if (!hierarchy[regionName].coordinators[coordinatorName]) {
      hierarchy[regionName].coordinators[coordinatorName] = {
        name: coordinatorName,
        agents: {},
        grossSales: 0,
        winnings: 0,
        netSales: 0
      };
    }

    if (!hierarchy[regionName].coordinators[coordinatorName].agents[agentName]) {
      hierarchy[regionName].coordinators[coordinatorName].agents[agentName] = {
        name: agentName,
        grossSales: 0,
        winnings: 0,
        netSales: 0
      };
    }

    // Calculate amounts
    const grossSales = ticket.totalAmount || 0;
    const winnings = ticket.winningTickets.reduce((sum, wt) => sum + (wt.prizeAmount || 0), 0);
    const netSales = grossSales - winnings;

    // Add to agent
    const agentData = hierarchy[regionName].coordinators[coordinatorName].agents[agentName];
    agentData.grossSales += grossSales;
    agentData.winnings += winnings;
    agentData.netSales += netSales;

    // Add to coordinator
    const coordinatorData = hierarchy[regionName].coordinators[coordinatorName];
    coordinatorData.grossSales += grossSales;
    coordinatorData.winnings += winnings;
    coordinatorData.netSales += netSales;

    // Add to region
    hierarchy[regionName].grossSales += grossSales;
    hierarchy[regionName].winnings += winnings;
    hierarchy[regionName].netSales += netSales;
  });

  return hierarchy;
}



// Handler function for per-draw reports
async function handlePerDrawReport(req, res) {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'Start date and end date are required'
    });
  }

  let whereClause = {
    drawDate: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  // Role-based filtering for draws
  let ticketWhereClause = {};
  switch (req.user.role) {
    case 'superadmin':
    case 'admin':
    case 'operator':
      break;
    case 'area_coordinator':
      if (req.user.regionId) {
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent' },
          select: { id: true }
        });
        ticketWhereClause.agentId = {
          in: areaAgents.map(agent => agent.id)
        };
      }
      break;
    case 'coordinator':
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      ticketWhereClause.agentId = {
        in: coordAgents.map(agent => agent.id)
      };
      break;
    case 'agent':
      ticketWhereClause.agentId = req.user.id;
      break;
  }

  const draws = await prisma.draw.findMany({
    where: whereClause,
    include: {
      tickets: {
        where: ticketWhereClause,
        include: {
          winningTickets: {
            select: {
              prizeAmount: true
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              role: true
            }
          }
        }
      }
    },
    orderBy: [{ drawDate: 'desc' }, { drawTime: 'asc' }]
  });

  const perDrawData = draws.map(draw => {
    const grossSales = draw.tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
    const winnings = draw.tickets.reduce((sum, ticket) => 
      sum + ticket.winningTickets.reduce((wSum, wt) => wSum + (wt.prizeAmount || 0), 0), 0
    );

    return {
      drawId: draw.id,
      drawDate: draw.drawDate,
      drawTime: draw.drawTime,
      winningNumber: draw.winningNumber,
      totalTickets: draw.tickets.length,
      grossSales,
      winnings,
      netSales: grossSales - winnings,
      status: draw.status,
      agents: [...new Set(draw.tickets.map(t => t.user?.fullName).filter(Boolean))]
    };
  });

  const summary = {
    totalDraws: draws.length,
    totalTickets: perDrawData.reduce((sum, draw) => sum + draw.totalTickets, 0),
    totalGross: perDrawData.reduce((sum, draw) => sum + draw.grossSales, 0),
    totalWinnings: perDrawData.reduce((sum, draw) => sum + draw.winnings, 0),
    totalNet: perDrawData.reduce((sum, draw) => sum + draw.netSales, 0)
  };

  res.json({
    success: true,
    data: {
      summary,
      draws: perDrawData
    }
  });
}

// Export handlers for per-draw reports
async function handlePerDrawExportCSV(req, res) {
  const { startDate, endDate } = req.query;
  const reportData = await getPerDrawReportData(req.user, startDate, endDate);

  const csvHeaders = [
    'Draw Date',
    'Draw Time',
    'Winning Number',
    'Total Tickets',
    'Gross Sales',
    'Winnings',
    'Net Sales',
    'Status'
  ];

  const csvRows = reportData.draws.map(draw => [
    draw.drawDate.toISOString().split('T')[0],
    draw.drawTime,
    draw.winningNumber || 'N/A',
    draw.totalTickets,
    draw.grossSales,
    draw.winnings,
    draw.netSales,
    draw.status
  ]);

  const csvContent = [csvHeaders, ...csvRows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=per-draw-report-${startDate}.csv`);
  res.send(csvContent);
}

async function handlePerDrawExportExcel(req, res) {
  const { startDate, endDate } = req.query;
  const reportData = await getPerDrawReportData(req.user, startDate, endDate);

  // Prepare data for Excel
  const excelData = reportData.draws.map(draw => ({
    'Draw Date': draw.drawDate.toISOString().split('T')[0],
    'Draw Time': draw.drawTime,
    'Winning Number': draw.winningNumber || 'N/A',
    'Total Tickets': draw.totalTickets,
    'Gross Sales': `₱${draw.grossSales.toLocaleString()}`,
    'Winnings': `₱${draw.winnings.toLocaleString()}`,
    'Net Sales': `₱${draw.netSales.toLocaleString()}`,
    'Status': draw.status
  }));

  // Create workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  
  // Set column widths for per-draw report
  const perDrawColumnWidths = [
    { wch: 12 }, // Draw Date
    { wch: 12 }, // Draw Time
    { wch: 15 }, // Winning Number
    { wch: 12 }, // Total Tickets
    { wch: 15 }, // Gross Sales
    { wch: 15 }, // Winnings
    { wch: 15 }, // Net Sales
    { wch: 12 }  // Status
  ];
  worksheet['!cols'] = perDrawColumnWidths;

  // Add summary sheet
  const summaryData = [
    { Metric: 'Total Draws', Value: reportData.summary.totalDraws },
    { Metric: 'Total Tickets', Value: reportData.summary.totalTickets },
    { Metric: 'Total Gross Sales', Value: `₱${reportData.summary.totalGross.toLocaleString()}` },
    { Metric: 'Total Winnings', Value: `₱${reportData.summary.totalWinnings.toLocaleString()}` },
    { Metric: 'Total Net Sales', Value: `₱${reportData.summary.totalNet.toLocaleString()}` },
    { Metric: 'Average per Draw', Value: `₱${(reportData.summary.totalGross / reportData.summary.totalDraws).toLocaleString()}` }
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  
  // Set column widths for summary sheet
  const summaryColumnWidths = [
    { wch: 25 }, // Metric column
    { wch: 20 }  // Value column
  ];
  summarySheet['!cols'] = summaryColumnWidths;

  // Add worksheets to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Per-Draw Report');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  // Set headers for file download
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=per-draw-report-${startDate}.xlsx`);
  res.setHeader('Content-Length', buffer.length);

  res.send(buffer);
}

// Helper function to get per-draw report data
async function getPerDrawReportData(user, startDate, endDate) {
  let whereClause = {
    drawDate: {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z')
    }
  };

  // Role-based filtering for draws
  let ticketWhereClause = {};
  switch (user.role) {
    case 'superadmin':
    case 'admin':
    case 'operator':
      break;
    case 'area_coordinator':
      if (user.regionId) {
        const areaAgents = await prisma.user.findMany({
          where: { regionId: user.regionId, role: 'agent' },
          select: { id: true }
        });
        ticketWhereClause.agentId = {
          in: areaAgents.map(agent => agent.id)
        };
      }
      break;
    case 'coordinator':
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: user.id, role: 'agent' },
        select: { id: true }
      });
      ticketWhereClause.agentId = {
        in: coordAgents.map(agent => agent.id)
      };
      break;
    case 'agent':
      ticketWhereClause.agentId = user.id;
      break;
  }

  const draws = await prisma.draw.findMany({
    where: whereClause,
    include: {
      tickets: {
        where: ticketWhereClause,
        include: {
          winningTickets: {
            select: {
              prizeAmount: true
            }
          }
        }
      }
    },
    orderBy: [{ drawDate: 'desc' }, { drawTime: 'asc' }]
  });

  const perDrawData = draws.map(draw => {
    const grossSales = draw.tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
    const winnings = draw.tickets.reduce((sum, ticket) => 
      sum + ticket.winningTickets.reduce((wSum, wt) => wSum + (wt.prizeAmount || 0), 0), 0
    );

    return {
      drawId: draw.id,
      drawDate: draw.drawDate,
      drawTime: draw.drawTime,
      winningNumber: draw.winningNumber,
      totalTickets: draw.tickets.length,
      grossSales,
      winnings,
      netSales: grossSales - winnings,
      status: draw.status
    };
  });

  const summary = {
    totalDraws: draws.length,
    totalTickets: perDrawData.reduce((sum, draw) => sum + draw.totalTickets, 0),
    totalGross: perDrawData.reduce((sum, draw) => sum + draw.grossSales, 0),
    totalWinnings: perDrawData.reduce((sum, draw) => sum + draw.winnings, 0),
    totalNet: perDrawData.reduce((sum, draw) => sum + draw.netSales, 0)
  };

  return {
    summary,
    draws: perDrawData
  };
}

// @route   GET /api/v1/reports/draw-time-sales
// @desc    Get draw time sales report with role-based filtering
// @access  Private
router.get('/draw-time-sales', async (req, res) => {
  try {
    const { startDate, endDate, reportType = 'summary', groupBy = 'date' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1); // Include end date

    // Build base where clause
    let whereClause = {
      draw: {
        drawDate: {
          gte: start,
          lt: end
        }
      }
    };

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all sales data - no additional filtering
        break;
      case 'area_coordinator':
        // Get agents in the same region as the Area Coordinator
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent' },
          select: { id: true }
        });
        whereClause.agentId = {
          in: areaAgents.map(agent => agent.id)
        };
        break;
      case 'coordinator':
        const coordAgents = await prisma.user.findMany({
          where: { coordinatorId: req.user.id, role: 'agent' },
          select: { id: true }
        });
        whereClause.agentId = {
          in: coordAgents.map(agent => agent.id)
        };
        break;
      case 'agent':
        whereClause.agentId = req.user.id;
        break;
    }

    // Fetch tickets with draw and user information
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
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            coordinatorId: true
          }
        }
      }
    });

    // Group data by draw time
    const drawTimeData = {
      twoPM: { sales: 0, tickets: 0, winnings: 0 },
      fivePM: { sales: 0, tickets: 0, winnings: 0 },
      ninePM: { sales: 0, tickets: 0, winnings: 0 }
    };

    const agentData = {};
    const coordinatorData = {};

    tickets.forEach(ticket => {
      const drawTime = ticket.draw.drawTime;
      const agentId = ticket.user.id;
      const coordinatorId = ticket.user.coordinatorId;

      // Update draw time totals
      if (drawTimeData[drawTime]) {
        drawTimeData[drawTime].sales += ticket.totalAmount;
        drawTimeData[drawTime].tickets += 1;
        
        // Add winnings if ticket won (assuming status indicates winning)
        if (ticket.status === 'won') {
          drawTimeData[drawTime].winnings += ticket.winAmount || 0;
        }
      }

      // Track agent data
      if (!agentData[agentId]) {
        agentData[agentId] = {
          name: ticket.user.fullName || ticket.user.username,
          username: ticket.user.username,
          coordinatorId: coordinatorId,
          twoPM: 0,
          fivePM: 0,
          ninePM: 0,
          total: 0
        };
      }

      if (drawTimeData[drawTime]) {
        agentData[agentId][drawTime] += ticket.totalAmount;
        agentData[agentId].total += ticket.totalAmount;
      }

      // Track coordinator data
      if (coordinatorId && !coordinatorData[coordinatorId]) {
        coordinatorData[coordinatorId] = {
          agents: [],
          twoPM: 0,
          fivePM: 0,
          ninePM: 0,
          total: 0
        };
      }
    });

    // Get coordinator information
    const coordinatorIds = Object.keys(coordinatorData).map(id => parseInt(id));
    const coordinators = await prisma.user.findMany({
      where: { id: { in: coordinatorIds } },
      select: { id: true, username: true, fullName: true }
    });

    // Build response data
    const summary = {
      '2PM': drawTimeData.twoPM,
      '5PM': drawTimeData.fivePM,
      '9PM': drawTimeData.ninePM
    };

    const details = [];
    
    // Group agents by coordinator
    coordinators.forEach(coordinator => {
      const coordAgents = Object.values(agentData).filter(agent => 
        agent.coordinatorId === coordinator.id
      );

      if (coordAgents.length > 0) {
        details.push({
          name: `Sales by Draw Time - ${coordinator.fullName || coordinator.username}`,
          coordinator: coordinator.fullName || coordinator.username,
          agents: coordAgents.map(agent => ({
            name: agent.name,
            '2PM': agent.twoPM,
            '5PM': agent.fivePM,
            '9PM': agent.ninePM,
            total: agent.total
          }))
        });
      }
    });

    // Add agents without coordinators
    const agentsWithoutCoord = Object.values(agentData).filter(agent => 
      !agent.coordinatorId
    );

    if (agentsWithoutCoord.length > 0) {
      details.push({
        name: 'Sales by Draw Time - Direct Agents',
        coordinator: 'Direct Agents',
        agents: agentsWithoutCoord.map(agent => ({
          name: agent.name,
          '2PM': agent.twoPM,
          '5PM': agent.fivePM,
          '9PM': agent.ninePM,
          total: agent.total
        }))
      });
    }

    res.json({
      success: true,
      data: {
        summary,
        details
      }
    });

  } catch (error) {
    console.error('Get draw time sales error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;


