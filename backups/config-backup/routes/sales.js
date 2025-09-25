const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireCoordinator } = require('../middleware/roleCheck');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Cache for live data
const liveDataCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// Helper function to get cached data or fetch fresh
const getCachedData = async (key, fetchFunction) => {
  const cached = liveDataCache.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  const freshData = await fetchFunction();
  liveDataCache.set(key, {
    data: freshData,
    timestamp: now
  });
  
  return freshData;
};

// @route   GET /api/v1/sales
// @desc    Get sales data with date range
// @access  Private
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('Sales route - User:', req.user?.id, req.user?.role);
    const { startDate, endDate } = req.query;
    console.log('Sales route - Date range:', startDate, endDate);
    
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
        console.log('Sales route - Admin access, no filtering');
        break;
      case 'area_coordinator':
        console.log('Sales route - Area coordinator filtering');
        // Get agents in the same region as the Area Coordinator
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent', status: 'active' },
          select: { id: true }
        });
        console.log('Sales route - Found area agents:', areaAgents.length);
        whereClause.userId = {
          in: areaAgents.map(agent => agent.id)
        };
        break;
      case 'coordinator':
        console.log('Sales route - Coordinator filtering');
        const coordAgents = await prisma.user.findMany({
          where: { coordinatorId: req.user.id, role: 'agent', status: 'active' },
          select: { id: true }
        });
        console.log('Sales route - Found coordinator agents:', coordAgents.length);
        whereClause.userId = {
          in: coordAgents.map(agent => agent.id)
        };
        break;
      case 'agent':
        console.log('Sales route - Agent filtering for ID:', req.user.id);
        whereClause.userId = req.user.id;
        break;
    }

    console.log('Sales route - Where clause:', JSON.stringify(whereClause, null, 2));

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Sales route - Found sales:', sales.length);

    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTickets = sales.reduce((sum, sale) => sum + sale.ticketCount, 0);
    
    // Calculate total winnings from winning tickets
    let winningsWhereClause = {
      createdAt: whereClause.createdAt
    };
    
    // Apply the same user filtering as sales
    if (whereClause.userId) {
      winningsWhereClause.userId = whereClause.userId;
    }
    
    const totalWinnings = await prisma.winningTicket.aggregate({
      where: {
        ticket: winningsWhereClause
      },
      _sum: {
        prizeAmount: true
      }
    }).catch(error => {
      console.error('Error calculating winnings:', error);
      return { _sum: { prizeAmount: 0 } };
    });

    const grossSales = totalSales;
    const netSales = totalSales - (totalWinnings._sum.prizeAmount || 0);

    res.json({
      success: true,
      data: {
        sales,
        summary: {
          totalSales: grossSales,
          totalGross: grossSales,
          totalNet: netSales,
          totalTickets,
          totalWinnings: totalWinnings._sum.prizeAmount || 0
        }
      }
    });

  } catch (error) {
    console.error('Get sales error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/sales/agent/:agentId
// @desc    Get sales for specific agent
// @access  Private
router.get('/agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const { startDate, endDate, drawId } = req.query;

    // Check permissions
    if (req.user.role === 'agent' && req.user.id !== agentId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view this agent\'s sales'
      });
    }

    let whereClause = { userId: agentId };

    // Additional filters
    if (drawId) {
      whereClause.drawId = parseInt(drawId);
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);

    res.json({
      success: true,
      data: {
        sales,
        summary: {
          totalSales,
          totalCommission,
          totalTickets: sales.length
        }
      }
    });

  } catch (error) {
    console.error('Get agent sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/sales/draw/:drawId
// @desc    Get sales for specific draw
// @access  Private
router.get('/draw/:drawId', async (req, res) => {
  try {
    const drawId = parseInt(req.params.drawId);

    const sales = await prisma.sale.findMany({
      where: {
        drawId: drawId
      },
      include: {
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            coordinator: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCommission = sales.reduce((sum, sale) => sum + sale.commission, 0);

    // Group by agent
    const salesByAgent = sales.reduce((acc, sale) => {
      const agentId = sale.user.id;
      if (!acc[agentId]) {
        acc[agentId] = {
          agent: sale.user,
          sales: [],
          totalAmount: 0,
          totalCommission: 0
        };
      }
      acc[agentId].sales.push(sale);
      acc[agentId].totalAmount += sale.totalAmount;
      acc[agentId].totalTickets += sale.ticketCount;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        sales,
        salesByAgent: Object.values(salesByAgent),
        summary: {
          totalSales,
          totalTickets: sales.reduce((sum, sale) => sum + sale.ticketCount, 0),
          totalAgents: Object.keys(salesByAgent).length
        }
      }
    });

  } catch (error) {
    console.error('Get draw sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/sales/daily
// @desc    Get daily sales summary
// @access  Private
router.get('/daily', async (req, res) => {
  try {
    const { date, regionId, coordinatorId } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    let whereClause = {
      draw: {
        drawDate: targetDate
      }
    };

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all sales
        break;
      case 'area_coordinator':
        // Can see sales in their region
        whereClause.user = {
          regionId: req.user.regionId
        };
        break;
      case 'coordinator':
        // Can see sales from their agents
        whereClause.user = {
          coordinatorId: req.user.id
        };
        break;
      case 'agent':
        // Can only see their own sales
        whereClause.userId = req.user.id;
        break;
    }

    // Additional filters
    if (regionId) {
      whereClause.user = {
        ...whereClause.user,
        regionId: parseInt(regionId)
      };
    }

    if (coordinatorId) {
      whereClause.user = {
        ...whereClause.user,
        coordinatorId: parseInt(coordinatorId)
      };
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        draw: {
          select: {
            id: true,
            drawTime: true,
            drawDate: true,
            winningNumber: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            regionId: true,
            coordinatorId: true,
            coordinator: {
              select: {
                id: true,
                fullName: true,
                role: true
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
        }
      }
    });

    // Group by draw time
    const salesByDraw = sales.reduce((acc, sale) => {
      const drawTime = sale.draw.drawTime;
      if (!acc[drawTime]) {
        acc[drawTime] = {
          drawTime,
          sales: [],
          totalAmount: 0,
          totalTickets: 0
        };
      }
      acc[drawTime].sales.push(sale);
      acc[drawTime].totalAmount += sale.totalAmount;
      acc[drawTime].totalTickets += sale.ticketCount;
      return acc;
    }, {});

    // Group by agent
    const salesByAgent = sales.reduce((acc, sale) => {
      const agentId = sale.user.id;
      if (!acc[agentId]) {
        acc[agentId] = {
          agent: sale.user,
          sales: [],
          totalAmount: 0,
          totalTickets: 0
        };
      }
      acc[agentId].sales.push(sale);
      acc[agentId].totalAmount += sale.totalAmount;
      acc[agentId].totalTickets += sale.ticketCount;
      return acc;
    }, {});

    // Calculate overall summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTickets = sales.reduce((sum, sale) => sum + sale.ticketCount, 0);

    res.json({
      success: true,
      data: {
        date: targetDate,
        salesByDraw: Object.values(salesByDraw),
        salesByAgent: Object.values(salesByAgent),
        summary: {
          totalSales,
          totalTickets,
          totalAgents: Object.keys(salesByAgent).length
        }
      }
    });

  } catch (error) {
    console.error('Get daily sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/sales/range
// @desc    Get sales for date range
// @access  Private
router.get('/range', async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

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
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true,
            status: true
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by draw time
    const salesByDrawTime = sales.reduce((acc, sale) => {
      const drawTime = sale.draw.drawTime;
      if (!acc[drawTime]) {
        acc[drawTime] = {
          drawTime,
          sales: [],
          totalAmount: 0,
          totalTickets: 0
        };
      }
      acc[drawTime].sales.push(sale);
      acc[drawTime].totalAmount += sale.totalAmount;
      acc[drawTime].totalTickets += sale.ticketCount;
      return acc;
    }, {});

    // Calculate totals
    const totalAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalTickets = sales.reduce((sum, sale) => sum + sale.ticketCount, 0);

    res.json({
      success: true,
      data: {
        startDate,
        endDate,
        salesByDrawTime: Object.values(salesByDrawTime),
        summary: {
          totalSales: totalAmount,
          totalTickets,
          totalDrawTimes: Object.keys(salesByDrawTime).length
        }
      }
    });

  } catch (error) {
    console.error('Get range sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/sales/per-draw
// @desc    Get sales per draw
// @access  Private
router.get('/per-draw', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Build base where clause for tickets to align with reports
    let ticketWhere = {
      createdAt: {
        gte: startOfDay,
        lt: endOfDay
      }
    };

    // Role-based filtering (filter by ticket.userId)
    if (req.user.role === 'agent') {
      ticketWhere.userId = req.user.id;
    } else if (req.user.role === 'coordinator') {
      const coordAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      ticketWhere.userId = { in: coordAgents.map(a => a.id) };
    } else if (req.user.role === 'area_coordinator' && req.user.regionId) {
      const areaAgents = await prisma.user.findMany({
        where: { regionId: req.user.regionId, role: 'agent' },
        select: { id: true }
      });
      ticketWhere.userId = { in: areaAgents.map(a => a.id) };
    }

    // Fetch draws with tickets filtered above
    const draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        tickets: {
          where: ticketWhere,
          include: {
            winningTickets: { select: { prizeAmount: true } }
          }
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    const perDraw = draws.map(draw => {
      const grossSales = draw.tickets.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      const ticketCount = draw.tickets.length;
      const totalWinnings = draw.tickets.reduce((sum, t) => sum + t.winningTickets.reduce((ws, wt) => ws + (wt.prizeAmount || 0), 0), 0);
      return {
        id: draw.id,
        drawTime: draw.drawTime,
        drawDate: draw.drawDate,
        status: draw.status,
        winningNumber: draw.winningNumber,
        grossSales,
        ticketCount,
        totalWinnings,
        netSales: grossSales - totalWinnings
      };
    });

    res.json({ success: true, data: { draws: perDraw } });

  } catch (error) {
    console.error('Get per-draw sales error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route   GET /api/sales/live-stats
// @desc    Get live sales statistics
// @access  Private
router.get('/live-stats', requireAuth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let whereClause = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    // Role-based filtering for sales
    let salesWhereClause = { ...whereClause };
    if (req.user.role === 'agent') {
      salesWhereClause.userId = req.user.id;
    } else if (req.user.role === 'coordinator') {
      salesWhereClause.user = {
        coordinatorId: req.user.id
      };
    } else if (req.user.role === 'area_coordinator') {
      salesWhereClause.user = {
        regionId: req.user.regionId
      };
    }

    // Get today's sales summary
    const todaysSales = await prisma.sale.aggregate({
      where: salesWhereClause,
      _sum: {
        totalAmount: true,
        ticketCount: true
      }
    });

    // Get validated tickets count (for tickets, use original whereClause)
    const activeBets = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: 'validated'
      }
    });

    // Get pending tickets (not yet settled)
    const pendingTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: {
          in: ['validated', 'pending']
        }
      }
    });

    // Get current draw sales (for the next upcoming draw)
    const currentDraw = await prisma.draw.findFirst({
      where: {
        drawDate: {
          gte: today
        },
        status: 'open'
      },
      orderBy: {
        drawDate: 'asc'
      }
    });

    let currentDrawSales = 0;
    if (currentDraw) {
      const currentDrawSalesData = await prisma.sale.aggregate({
        where: {
          ...salesWhereClause,
          drawId: currentDraw.id
        },
        _sum: {
          totalAmount: true
        }
      });
      currentDrawSales = currentDrawSalesData._sum.totalAmount || 0;
    }

    res.json({
      success: true,
      data: {
        activeBets,
        pendingTickets,
        todaysSales: todaysSales._sum.totalAmount || 0,
        todaysTickets: todaysSales._sum.ticketCount || 0,
        currentDrawSales
      }
    });

  } catch (error) {
    console.error('Get live stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/sales/agent-summary/:agentId
// @desc    Get agent sales summary (today, this week, this month)
// @access  Private
router.get('/agent-summary/:agentId', requireAuth, async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);

    // Check permissions
    if (req.user.role === 'agent' && req.user.id !== agentId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const now = new Date();
    
    // Today's range
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // This week's range (Monday to Sunday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // This month's range
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Get tickets for each period
    const [todayTickets, weekTickets, monthTickets] = await Promise.all([
      prisma.ticket.findMany({
        where: {
          userId: agentId,
          createdAt: { gte: todayStart, lte: todayEnd }
        }
      }),
      prisma.ticket.findMany({
        where: {
          userId: agentId,
          createdAt: { gte: weekStart, lte: weekEnd }
        }
      }),
      prisma.ticket.findMany({
        where: {
          userId: agentId,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      })
    ]);

    // Calculate summaries
    const calculateSummary = (tickets) => ({
      totalSales: tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0),
      totalTickets: tickets.length
    });

    res.json({
      success: true,
      data: {
        today: calculateSummary(todayTickets),
        thisWeek: calculateSummary(weekTickets),
        thisMonth: calculateSummary(monthTickets)
      }
    });

  } catch (error) {
    console.error('Agent summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/sales/daily-operator-stats
// @desc    Get daily sales statistics for operators
// @access  Private (Operator, Admin, SuperAdmin)
router.get('/daily-operator-stats', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const whereClause = {
      createdAt: {
        gte: new Date(date),
        lte: new Date(date + 'T23:59:59.999Z')
      }
    };

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        winningTickets: {
          select: {
            prizeAmount: true
          }
        }
      }
    });

    const stats = {
      totalTickets: tickets.length,
      totalGross: tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0),
      totalWinnings: tickets.reduce((sum, ticket) => 
        sum + ticket.winningTickets.reduce((wSum, wt) => wSum + (wt.prizeAmount || 0), 0), 0
      ),
      totalNet: 0
    };

    stats.totalNet = stats.totalGross - stats.totalWinnings;

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Daily operator stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/sales/per-draw-operator
// @desc    Get per-draw sales for operators
// @access  Private (Operator, Admin, SuperAdmin)
router.get('/per-draw-operator', async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    const draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: new Date(date),
          lte: new Date(date + 'T23:59:59.999Z')
        }
      },
      include: {
        tickets: {
          include: {
            winningTickets: {
              select: {
                prizeAmount: true
              }
            }
          }
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    const perDrawData = draws.map(draw => {
      const grossSales = draw.tickets.reduce((sum, ticket) => sum + (ticket.totalAmount || 0), 0);
      const winnings = draw.tickets.reduce((sum, ticket) => 
        sum + ticket.winningTickets.reduce((wSum, wt) => wSum + (wt.prizeAmount || 0), 0), 0
      );

      return {
        drawId: draw.id,
        drawTime: draw.drawTime,
        drawDate: draw.drawDate,
        totalTickets: draw.tickets.length,
        grossSales,
        winnings,
        netSales: grossSales - winnings,
        status: draw.status
      };
    });

    res.json({
      success: true,
      data: perDrawData
    });
  } catch (error) {
    console.error('Per-draw operator stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/sales/historical-operator
// @desc    Get historical sales data for operators
// @access  Private (Operator, Admin, SuperAdmin)
router.get('/historical-operator', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z')
        }
      },
      include: {
        winningTickets: {
          select: {
            prizeAmount: true
          }
        }
      }
    });

    // Group by date
    const dailyData = {};
    let totalGross = 0;
    let totalWinnings = 0;
    let totalTickets = 0;

    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          totalTickets: 0,
          grossSales: 0,
          winnings: 0,
          netSales: 0
        };
      }

      const grossSales = ticket.totalAmount || 0;
      const winnings = ticket.winningTickets.reduce((sum, wt) => sum + (wt.prizeAmount || 0), 0);

      dailyData[date].totalTickets++;
      dailyData[date].grossSales += grossSales;
      dailyData[date].winnings += winnings;
      dailyData[date].netSales += (grossSales - winnings);

      totalGross += grossSales;
      totalWinnings += winnings;
      totalTickets++;
    });

    const summary = {
      totalTickets,
      totalGross,
      totalWinnings,
      totalNet: totalGross - totalWinnings
    };

    res.json({
      success: true,
      data: {
        summary,
        daily: Object.values(dailyData).sort((a, b) => new Date(b.date) - new Date(a.date))
      }
    });
  } catch (error) {
    console.error('Historical operator stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// ==================== LIVE DATA ENDPOINTS ====================

// @route   GET /api/v1/sales/live-stats
// @desc    Get live sales statistics
// @access  Private
router.get('/live-stats', requireAuth, async (req, res) => {
  try {
    const cacheKey = `live-stats-${req.user.id}-${req.user.role}`;
    
    const liveStats = await getCachedData(cacheKey, async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get active bets (pending tickets)
      const activeBets = await prisma.ticket.count({
        where: {
          status: 'pending',
          createdAt: {
            gte: today
          }
        }
      });
      
      // Get pending tickets count
      const pendingTickets = await prisma.ticket.count({
        where: {
          status: 'pending'
        }
      });
      
      // Get current draw sales
      const currentDraw = await prisma.draw.findFirst({
        where: {
          status: 'open'
        },
        orderBy: {
          drawDate: 'desc'
        }
      });
      
      let currentDrawSales = 0;
      if (currentDraw) {
        const drawSales = await prisma.ticket.aggregate({
          where: {
            drawId: currentDraw.id,
            createdAt: {
              gte: today
            }
          },
          _sum: {
            totalAmount: true
          }
        });
        currentDrawSales = drawSales._sum.totalAmount || 0;
      }
      
      // Get today's total sales
      const todaySales = await prisma.ticket.aggregate({
        where: {
          createdAt: {
            gte: today
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      });
      
      return {
        activeBets,
        pendingTickets,
        currentDrawSales,
        todayTotalSales: todaySales._sum.totalAmount || 0,
        todayTicketCount: todaySales._count.id || 0,
        timestamp: now
      };
    });
    
    res.json({
      success: true,
      data: liveStats
    });
  } catch (error) {
    console.error('Live stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch live stats'
    });
  }
});

// @route   GET /api/v1/sales/daily-live
// @desc    Get live daily sales data
// @access  Private
router.get('/daily-live', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const cacheKey = `daily-live-${req.user.id}-${date || 'today'}`;
    
    const dailyData = await getCachedData(cacheKey, async () => {
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      // Build where clause based on user role
      let whereClause = {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
      
      // Role-based filtering
      if (req.user.role === 'area_coordinator' && req.user.regionId) {
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent' },
          select: { id: true }
        });
        whereClause.userId = {
          in: areaAgents.map(agent => agent.id)
        };
      } else if (req.user.role === 'coordinator' && req.user.id) {
        const coordinatorAgents = await prisma.user.findMany({
          where: { coordinatorId: req.user.id, role: 'agent' },
          select: { id: true }
        });
        whereClause.userId = {
          in: coordinatorAgents.map(agent => agent.id)
        };
      } else if (req.user.role === 'agent') {
        whereClause.userId = req.user.id;
      }
      
      // Get sales data
      const salesData = await prisma.ticket.aggregate({
        where: whereClause,
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      });
      
      // Get winnings data
      const winningsData = await prisma.winningTicket.aggregate({
        where: {
          ticket: whereClause
        },
        _sum: {
          winAmount: true
        }
      });
      
      return {
        totalSales: salesData._sum.totalAmount || 0,
        totalTickets: salesData._count.id || 0,
        totalWinnings: winningsData._sum.winAmount || 0,
        netSales: (salesData._sum.totalAmount || 0) - (winningsData._sum.winAmount || 0),
        timestamp: new Date()
      };
    });
    
    res.json({
      success: true,
      data: dailyData
    });
  } catch (error) {
    console.error('Daily live sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily live sales'
    });
  }
});

// @route   GET /api/v1/sales/per-draw-live
// @desc    Get live per-draw sales data
// @access  Private
router.get('/per-draw-live', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const cacheKey = `per-draw-live-${req.user.id}-${date || 'today'}`;
    
    const perDrawData = await getCachedData(cacheKey, async () => {
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      
      // Get draws for the day
      const draws = await prisma.draw.findMany({
        where: {
          drawDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        orderBy: {
          drawTime: 'asc'
        }
      });
      
      const drawSales = [];
      
      for (const draw of draws) {
        // Build where clause based on user role
        let whereClause = {
          drawId: draw.id,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
        
        // Role-based filtering
        if (req.user.role === 'area_coordinator' && req.user.regionId) {
          const areaAgents = await prisma.user.findMany({
            where: { regionId: req.user.regionId, role: 'agent' },
            select: { id: true }
          });
          whereClause.userId = {
            in: areaAgents.map(agent => agent.id)
          };
        } else if (req.user.role === 'coordinator' && req.user.id) {
          const coordinatorAgents = await prisma.user.findMany({
            where: { coordinatorId: req.user.id, role: 'agent' },
            select: { id: true }
          });
          whereClause.userId = {
            in: coordinatorAgents.map(agent => agent.id)
          };
        } else if (req.user.role === 'agent') {
          whereClause.userId = req.user.id;
        }
        
        // Get sales for this draw
        const salesData = await prisma.ticket.aggregate({
          where: whereClause,
          _sum: {
            totalAmount: true
          },
          _count: {
            id: true
          }
        });
        
        // Get winnings for this draw
        let winningsWhereClause = {
          drawId: draw.id
        };
        
        // Apply user filtering for winning tickets
        if (whereClause.userId) {
          winningsWhereClause.ticket = {
            userId: whereClause.userId,
            createdAt: whereClause.createdAt
          };
        } else {
          winningsWhereClause.ticket = {
            createdAt: whereClause.createdAt
          };
        }
        
        const winningsData = await prisma.winningTicket.aggregate({
          where: winningsWhereClause,
          _sum: {
            prizeAmount: true
          }
        });
        
        drawSales.push({
          drawId: draw.id,
          drawTime: draw.drawTime,
          drawDate: draw.drawDate,
          status: draw.status,
          grossSales: salesData._sum.totalAmount || 0,
          ticketCount: salesData._count.id || 0,
          totalWinnings: winningsData._sum.prizeAmount || 0,
          netSales: (salesData._sum.totalAmount || 0) - (winningsData._sum.prizeAmount || 0)
        });
      }
      
      return {
        draws: drawSales,
        timestamp: new Date()
      };
    });
    
    res.json({
      success: true,
      data: perDrawData
    });
  } catch (error) {
    console.error('Per-draw live sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch per-draw live sales'
    });
  }
});

// @route   GET /api/v1/sales/snapshot
// @desc    Get snapshot sales data (point-in-time)
// @access  Private
router.get('/snapshot', requireAuth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    
    // Build where clause based on user role
    let whereClause = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    };
    
    // Role-based filtering
    if (req.user.role === 'area_coordinator' && req.user.regionId) {
      const areaAgents = await prisma.user.findMany({
        where: { regionId: req.user.regionId, role: 'agent' },
        select: { id: true }
      });
      whereClause.userId = {
        in: areaAgents.map(agent => agent.id)
      };
    } else if (req.user.role === 'coordinator' && req.user.id) {
      const coordinatorAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent' },
        select: { id: true }
      });
      whereClause.userId = {
        in: coordinatorAgents.map(agent => agent.id)
      };
    } else if (req.user.role === 'agent') {
      whereClause.userId = req.user.id;
    }
    
    // Get snapshot data
    const salesData = await prisma.ticket.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });
    
    // Build proper winnings query
    let winningsWhereClause = {};
    if (whereClause.userId) {
      winningsWhereClause.ticket = {
        userId: whereClause.userId,
        createdAt: whereClause.createdAt
      };
    } else {
      winningsWhereClause.ticket = {
        createdAt: whereClause.createdAt
      };
    }
    
    const winningsData = await prisma.winningTicket.aggregate({
      where: winningsWhereClause,
      _sum: {
        prizeAmount: true
      }
    });
    
    const snapshotData = {
      totalSales: salesData._sum.totalAmount || 0,
      totalTickets: salesData._count.id || 0,
      totalWinnings: winningsData._sum.prizeAmount || 0,
      netSales: (salesData._sum.totalAmount || 0) - (winningsData._sum.prizeAmount || 0),
      snapshotTime: new Date(),
      date: targetDate
    };
    
    res.json({
      success: true,
      data: snapshotData
    });
  } catch (error) {
    console.error('Snapshot sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch snapshot sales'
    });
  }
});

module.exports = router;

