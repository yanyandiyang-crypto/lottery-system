const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to calculate actual prize amount for a ticket
function calculateTicketPrize(ticket) {
  if (!ticket?.bets || !Array.isArray(ticket.bets)) {
    return 0;
  }

  // Prize structure based on bet type and amount
  const prizeStructure = {
    'standard': {
      '3D': 450,      // 450x multiplier for standard 3D
      'rambolito': 75  // 75x multiplier for rambolito
    },
    'straight': {
      '3D': 450,
      'rambolito': 75
    }
  };

  let totalPrize = 0;
  
  // Get winning numbers from DrawResult table
  const winningNumbers = ticket.draw?.drawResult?.winningNumber ? 
                        [ticket.draw.drawResult.winningNumber] : 
                        [];

  if (winningNumbers.length === 0) {
    return 0; // No winning numbers available
  }

  ticket.bets.forEach(bet => {
    const betCombination = bet.betCombination;
    const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
    const betType = (bet.betType || 'standard').toLowerCase();
    
    // Check if this specific bet is a winner
    const isWinning = checkIfBetIsWinning(betCombination, betType, winningNumbers);
    
    if (isWinning) {
      // Determine multiplier based on bet type
      let multiplier = 0;
      if (betType === 'rambolito') {
        multiplier = prizeStructure.standard.rambolito || 75;
      } else {
        multiplier = prizeStructure.standard['3D'] || 450;
      }

      // Calculate prize: bet amount × multiplier (only for winning bets)
      const betPrize = betAmount * multiplier;
      totalPrize += betPrize;
    }
  });

  return totalPrize;
}

// Helper function to check if a specific bet combination is winning
function checkIfBetIsWinning(betCombination, betType, winningNumbers) {
  if (!betCombination || !winningNumbers || winningNumbers.length === 0) {
    return false;
  }

  // Clean bet combination
  const cleanBetCombination = betCombination.toString().replace(/\s+/g, '');
  const betDigits = cleanBetCombination.split('').sort();
  
  // Handle different winning number formats
  const numbersToCheck = Array.isArray(winningNumbers) ? winningNumbers : [winningNumbers];
  
  return numbersToCheck.some(winningNumber => {
    if (!winningNumber) return false;
    
    const cleanWinningNumber = winningNumber.toString().replace(/\s+/g, '');
    const winningDigits = cleanWinningNumber.split('');
    
    if (betType === 'rambolito') {
      // For rambolito, check if bet digits match winning digits in any order
      const sortedWinningDigits = winningDigits.sort();
      return JSON.stringify(betDigits) === JSON.stringify(sortedWinningDigits);
    } else {
      // For standard/straight, check exact match
      return cleanBetCombination === cleanWinningNumber;
    }
  });
}

// @route   GET /api/dashboard
// @desc    Get comprehensive dashboard data for authenticated user based on role
// @access  Private
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('🔍 Dashboard API called by user:', req.user);
    const userId = req.user.userId;
    const userRole = req.user.role;

    // Support optional startDate/endDate query; default to today
    const { startDate, endDate } = req.query;
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // Half-open: [start, nextDay(end))
      const nextDayEnd = new Date(end);
      nextDayEnd.setDate(nextDayEnd.getDate() + 1);
      today = start;
      tomorrow = nextDayEnd;
    }

    // Get yesterday for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Base dashboard data
    let dashboardData = {
      // Basic stats
      todaySales: 0,
      activeTickets: 0,
      winnersToday: 0,
      totalAgents: 0,
      
      // Enhanced financial metrics
      grossSales: 0,
      winningAmount: 0,
      netSales: 0,
      yesterdaySales: 0,
      salesGrowth: 0,
      
      // Per-draw breakdown
      drawSales: {
        '2PM': 0,
        '5PM': 0,
        '9PM': 0
      },
      
      // Role-specific data
      hierarchicalData: {},
      
      // Recent activity
      recentDraws: [],
      recentTickets: [],
      
      // Performance metrics
      performanceMetrics: {}
    };

    // Build where clause based on user role
    let whereClause = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    // Role-based filtering for hierarchical data
    if (userRole === 'area_coordinator' && req.user.regionId) {
      const areaAgents = await prisma.user.findMany({
        where: { regionId: req.user.regionId, role: 'agent', status: 'active' },
        select: { id: true, fullName: true }
      });
      whereClause.userId = {
        in: areaAgents.map(agent => agent.id)
      };
      dashboardData.hierarchicalData.agents = areaAgents;
    } else if (userRole === 'coordinator') {
      const coordinatorAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent', status: 'active' },
        select: { id: true, fullName: true }
      });
      whereClause.userId = {
        in: coordinatorAgents.map(agent => agent.id)
      };
      dashboardData.hierarchicalData.agents = coordinatorAgents;
    } else if (userRole === 'agent') {
      whereClause.userId = req.user.id;
    }

    // Get today's sales data
    const todaySalesData = await prisma.ticket.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    dashboardData.todaySales = todaySalesData._sum.totalAmount || 0;
    dashboardData.grossSales = todaySalesData._sum.totalAmount || 0;

    // Get yesterday's sales for comparison
    const yesterdayWhereClause = {
      ...whereClause,
      createdAt: {
        gte: yesterday,
        lt: today
      }
    };

    const yesterdaySalesData = await prisma.ticket.aggregate({
      where: yesterdayWhereClause,
      _sum: {
        totalAmount: true
      }
    });

    dashboardData.yesterdaySales = yesterdaySalesData._sum.totalAmount || 0;
    dashboardData.salesGrowth = dashboardData.yesterdaySales > 0 
      ? ((dashboardData.todaySales - dashboardData.yesterdaySales) / dashboardData.yesterdaySales * 100)
      : 0;

    // Get winning amounts from claim approval system
    // Include both pending approvals and approved claims
    const claimData = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        status: {
          in: ['pending_approval', 'claimed']
        }
      },
      include: {
        bets: true,
        draw: {
          include: {
            drawResult: {
              select: {
                winningNumber: true,
                isOfficial: true
              }
            }
          }
        }
      }
    });

    // Calculate actual winning amounts based on prize configuration
    let totalWinnings = 0;
    let pendingAmount = 0;
    let approvedAmount = 0;
    let winnersCount = 0;
    claimData.forEach(ticket => {
      if (ticket.status === 'pending_approval' || ticket.status === 'claimed') {
        const calculatedPrize = calculateTicketPrize(ticket);
        winnersCount++;
        
        if (ticket.status === 'pending_approval') {
          pendingAmount += calculatedPrize;
        } else if (ticket.status === 'claimed') {
          approvedAmount += calculatedPrize;
          totalWinnings += calculatedPrize; // Only approved winnings count towards total
        }
      }
    });

    dashboardData.winningAmount = totalWinnings; // Only approved winnings
    dashboardData.winnersToday = winnersCount;
    dashboardData.pendingWinnings = pendingAmount;
    dashboardData.approvedWinnings = approvedAmount;
    dashboardData.netSales = dashboardData.grossSales - dashboardData.winningAmount; // Gross - Approved only

    // Get per-draw sales breakdown
    const drawTimes = ['twoPM', 'fivePM', 'ninePM'];
    for (const drawTime of drawTimes) {
      const drawSales = await prisma.ticket.aggregate({
        where: {
          ...whereClause,
          draw: {
            drawTime: drawTime,
            drawDate: {
              gte: today,
              lt: tomorrow
            }
          }
        },
        _sum: {
          totalAmount: true
        }
      });
      
      const drawKey = drawTime === 'twoPM' ? '2PM' : drawTime === 'fivePM' ? '5PM' : '9PM';
      dashboardData.drawSales[drawKey] = drawSales._sum.totalAmount || 0;
    }

    // Get active tickets count
    const activeTickets = await prisma.ticket.count({
      where: {
        status: 'pending',
        ...(whereClause.userId ? { userId: whereClause.userId } : {})
      }
    });

    dashboardData.activeTickets = activeTickets;

    // Get total agents (role-specific)
    if (['superadmin', 'admin'].includes(userRole)) {
      const totalAgents = await prisma.user.count({
        where: {
          role: 'agent',
          status: 'active'
        }
      });
      dashboardData.totalAgents = totalAgents;
    } else if (userRole === 'area_coordinator') {
      dashboardData.totalAgents = dashboardData.hierarchicalData.agents?.length || 0;
    } else if (userRole === 'coordinator') {
      dashboardData.totalAgents = dashboardData.hierarchicalData.agents?.length || 0;
    }

    // Get active agents today (agents who have created tickets today)
    let activeAgentsWhereClause = {
      role: 'agent',
      status: 'active',
      tickets: {
        some: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }
    };

    // Role-based filtering for active agents
    if (userRole === 'area_coordinator' && req.user.regionId) {
      activeAgentsWhereClause.regionId = req.user.regionId;
    } else if (userRole === 'coordinator') {
      activeAgentsWhereClause.coordinatorId = req.user.id;
    }

    const activeAgents = await prisma.user.count({
      where: activeAgentsWhereClause
    });

    dashboardData.activeAgents = activeAgents;

    // Get recent draws with results (last 5)
    const recentDraws = await prisma.draw.findMany({
      where: {
        winningNumber: {
          not: null
        },
        status: {
          in: ['settled']
        }
      },
      take: 5,
      orderBy: [
        { drawDate: 'desc' },
        { drawTime: 'desc' }
      ],
      select: {
        id: true,
        drawDate: true,
        drawTime: true,
        status: true,
        winningNumber: true,
        _count: {
          select: {
            winningTickets: true
          }
        }
      }
    });

    dashboardData.recentDraws = recentDraws.map(draw => ({
      id: draw.id,
      drawDate: draw.drawDate,
      drawTime: draw.drawTime,
      status: draw.status,
      result: draw.winningNumber,
      winners: draw._count.winningTickets
    }));

    // Get recent tickets (last 10)
    const recentTickets = await prisma.ticket.findMany({
      where: whereClause,
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        ticketNumber: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            fullName: true,
            username: true
          }
        },
        bets: {
          select: {
            betType: true,
            betCombination: true,
            betAmount: true
          }
        }
      }
    });

    dashboardData.recentTickets = recentTickets.map(ticket => ({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      totalAmount: ticket.totalAmount,
      status: ticket.status,
      createdAt: ticket.createdAt,
      agentName: ticket.user?.fullName || ticket.user?.username || 'Unknown',
      betType: ticket.bets[0]?.betType || 'standard',
      betCombination: ticket.bets[0]?.betCombination || '',
      betAmount: ticket.bets[0]?.betAmount || 0,
      isWinner: ticket.status === 'validated'
    }));

    // Performance metrics
    dashboardData.performanceMetrics = {
      averageTicketValue: dashboardData.todaySales / Math.max(todaySalesData._count.id || 1, 1),
      winRate: dashboardData.winnersToday / Math.max(todaySalesData._count.id || 1, 1) * 100,
      netMargin: dashboardData.grossSales > 0 ? (dashboardData.netSales / dashboardData.grossSales * 100) : 0
    };

    // Hierarchical performance data for management roles
    if (['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(userRole)) {
      dashboardData.hierarchicalPerformance = await getHierarchicalPerformanceData(userRole, req.user, today, tomorrow);
    }

    console.log('📊 Dashboard data prepared:', {
      todaySales: dashboardData.todaySales,
      grossSales: dashboardData.grossSales,
      netSales: dashboardData.netSales,
      activeTickets: dashboardData.activeTickets,
      winnersToday: dashboardData.winnersToday,
      totalAgents: dashboardData.totalAgents,
      activeAgents: dashboardData.activeAgents,
      hierarchicalPerformance: dashboardData.hierarchicalPerformance ? 'Present' : 'Not present'
    });

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Helper function to get hierarchical performance data
async function getHierarchicalPerformanceData(userRole, user, today, tomorrow) {
  try {
    const performanceData = {
      regions: [],
      coordinators: [],
      agents: [],
      summary: {
        totalSales: 0,
        totalWinnings: 0,
        totalNetSales: 0,
        totalTickets: 0,
        totalWinners: 0
      }
    };

    // Get data based on role hierarchy
    if (userRole === 'superadmin' || userRole === 'admin') {
      // Get all regions with their coordinators and agents
      const regions = await prisma.user.findMany({
        where: { role: 'area_coordinator', status: 'active' },
        select: {
          id: true,
          fullName: true,
          username: true,
          regionId: true
        }
      });

      for (const region of regions) {
        const regionData = await getRegionPerformanceData(region, today, tomorrow);
        performanceData.regions.push(regionData);
        performanceData.summary.totalSales += regionData.sales;
        performanceData.summary.totalWinnings += regionData.winnings;
        performanceData.summary.totalNetSales += regionData.netSales;
        performanceData.summary.totalTickets += regionData.tickets;
        performanceData.summary.totalWinners += regionData.winners;
      }
    } else if (userRole === 'area_coordinator') {
      // Get coordinators under this area coordinator
      const coordinators = await prisma.user.findMany({
        where: { 
          areaCoordinatorId: user.id, 
          role: 'coordinator', 
          status: 'active' 
        },
        select: {
          id: true,
          fullName: true,
          username: true
        }
      });

      for (const coordinator of coordinators) {
        const coordinatorData = await getCoordinatorPerformanceData(coordinator, today, tomorrow);
        performanceData.coordinators.push(coordinatorData);
        performanceData.summary.totalSales += coordinatorData.sales;
        performanceData.summary.totalWinnings += coordinatorData.winnings;
        performanceData.summary.totalNetSales += coordinatorData.netSales;
        performanceData.summary.totalTickets += coordinatorData.tickets;
        performanceData.summary.totalWinners += coordinatorData.winners;
      }
    } else if (userRole === 'coordinator') {
      // Get agents under this coordinator
      const agents = await prisma.user.findMany({
        where: { 
          coordinatorId: user.id, 
          role: 'agent', 
          status: 'active' 
        },
        select: {
          id: true,
          fullName: true,
          username: true
        }
      });

      for (const agent of agents) {
        const agentData = await getAgentPerformanceData(agent, today, tomorrow);
        performanceData.agents.push(agentData);
        performanceData.summary.totalSales += agentData.sales;
        performanceData.summary.totalWinnings += agentData.winnings;
        performanceData.summary.totalNetSales += agentData.netSales;
        performanceData.summary.totalTickets += agentData.tickets;
        performanceData.summary.totalWinners += agentData.winners;
      }
    }

    return performanceData;
  } catch (error) {
    console.error('Error getting hierarchical performance data:', error);
    return {
      regions: [],
      coordinators: [],
      agents: [],
      summary: {
        totalSales: 0,
        totalWinnings: 0,
        totalNetSales: 0,
        totalTickets: 0,
        totalWinners: 0
      }
    };
  }
}

// Helper function to get region performance data
async function getRegionPerformanceData(region, today, tomorrow) {
  const regionAgents = await prisma.user.findMany({
    where: { regionId: region.regionId, role: 'agent', status: 'active' },
    select: { id: true }
  });

  const agentIds = regionAgents.map(agent => agent.id);

  const salesData = await prisma.ticket.aggregate({
    where: {
      userId: { in: agentIds },
      createdAt: { gte: today, lt: tomorrow }
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  const winningsData = await prisma.winningTicket.aggregate({
    where: {
      ticket: {
        userId: { in: agentIds },
        createdAt: { gte: today, lt: tomorrow }
      }
    },
    _sum: { prizeAmount: true },
    _count: { id: true }
  });

  const sales = salesData._sum.totalAmount || 0;
  const winnings = winningsData._sum.prizeAmount || 0;
  const netSales = sales - winnings;

  return {
    id: region.id,
    name: region.fullName || region.username,
    type: 'region',
    sales,
    winnings,
    netSales,
    tickets: salesData._count.id || 0,
    winners: winningsData._count.id || 0,
    netMargin: sales > 0 ? (netSales / sales * 100) : 0
  };
}

// Helper function to get coordinator performance data
async function getCoordinatorPerformanceData(coordinator, today, tomorrow) {
  const coordinatorAgents = await prisma.user.findMany({
    where: { coordinatorId: coordinator.id, role: 'agent', status: 'active' },
    select: { id: true }
  });

  const agentIds = coordinatorAgents.map(agent => agent.id);

  const salesData = await prisma.ticket.aggregate({
    where: {
      userId: { in: agentIds },
      createdAt: { gte: today, lt: tomorrow }
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  const winningsData = await prisma.winningTicket.aggregate({
    where: {
      ticket: {
        userId: { in: agentIds },
        createdAt: { gte: today, lt: tomorrow }
      }
    },
    _sum: { prizeAmount: true },
    _count: { id: true }
  });

  const sales = salesData._sum.totalAmount || 0;
  const winnings = winningsData._sum.prizeAmount || 0;
  const netSales = sales - winnings;

  return {
    id: coordinator.id,
    name: coordinator.fullName || coordinator.username,
    type: 'coordinator',
    sales,
    winnings,
    netSales,
    tickets: salesData._count.id || 0,
    winners: winningsData._count.id || 0,
    netMargin: sales > 0 ? (netSales / sales * 100) : 0,
    agentCount: coordinatorAgents.length
  };
}

// Helper function to get agent performance data
async function getAgentPerformanceData(agent, today, tomorrow) {
  const salesData = await prisma.ticket.aggregate({
    where: {
      userId: agent.id,
      createdAt: { gte: today, lt: tomorrow }
    },
    _sum: { totalAmount: true },
    _count: { id: true }
  });

  const winningsData = await prisma.winningTicket.aggregate({
    where: {
      ticket: {
        userId: agent.id,
        createdAt: { gte: today, lt: tomorrow }
      }
    },
    _sum: { prizeAmount: true },
    _count: { id: true }
  });

  const sales = salesData._sum.totalAmount || 0;
  const winnings = winningsData._sum.prizeAmount || 0;
  const netSales = sales - winnings;

  return {
    id: agent.id,
    name: agent.fullName || agent.username,
    type: 'agent',
    sales,
    winnings,
    netSales,
    tickets: salesData._count.id || 0,
    winners: winningsData._count.id || 0,
    netMargin: sales > 0 ? (netSales / sales * 100) : 0,
    averageTicketValue: (salesData._count.id || 0) > 0 ? sales / salesData._count.id : 0
  };
}

// @route   GET /api/dashboard/live
// @desc    Get real-time dashboard data for live updates
// @access  Private
router.get('/live', requireAuth, async (req, res) => {
  try {
    const userRole = req.user.role;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Build where clause based on user role
    let whereClause = {
      createdAt: {
        gte: today,
        lt: tomorrow
      }
    };

    // Role-based filtering
    if (userRole === 'area_coordinator' && req.user.regionId) {
      const areaAgents = await prisma.user.findMany({
        where: { regionId: req.user.regionId, role: 'agent', status: 'active' },
        select: { id: true }
      });
      whereClause.userId = {
        in: areaAgents.map(agent => agent.id)
      };
    } else if (userRole === 'coordinator') {
      const coordinatorAgents = await prisma.user.findMany({
        where: { coordinatorId: req.user.id, role: 'agent', status: 'active' },
        select: { id: true }
      });
      whereClause.userId = {
        in: coordinatorAgents.map(agent => agent.id)
      };
    } else if (userRole === 'agent') {
      whereClause.userId = req.user.id;
    }

    // Get live sales data
    const liveSalesData = await prisma.ticket.aggregate({
      where: whereClause,
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Get live winnings data from claim approval system
    const liveClaimData = await prisma.ticket.findMany({
      where: {
        ...whereClause,
        status: {
          in: ['pending_approval', 'claimed']
        }
      },
      include: {
        bets: true,
        draw: {
          include: {
            drawResult: {
              select: {
                winningNumber: true,
                isOfficial: true
              }
            }
          }
        }
      }
    });

    // Calculate live winning amounts
    let liveWinningAmount = 0;
    let liveWinnersCount = 0;

    liveClaimData.forEach(ticket => {
      const calculatedPrize = calculateTicketPrize(ticket);
      liveWinnersCount++;
      
      // Only count approved/claimed winnings towards total
      if (ticket.status === 'claimed') {
        liveWinningAmount += calculatedPrize;
      }
    });

    // Get active tickets count
    const activeTickets = await prisma.ticket.count({
      where: {
        ...whereClause,
        status: 'pending'
      }
    });

    // Get active agents today (agents who have created tickets today)
    let activeAgentsWhereClause = {
      role: 'agent',
      status: 'active',
      tickets: {
        some: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }
    };

    // Role-based filtering for active agents
    if (userRole === 'area_coordinator' && req.user.regionId) {
      activeAgentsWhereClause.regionId = req.user.regionId;
    } else if (userRole === 'coordinator') {
      activeAgentsWhereClause.coordinatorId = req.user.id;
    }

    const activeAgents = await prisma.user.count({
      where: activeAgentsWhereClause
    });

    // Get total agents for percentage calculation
    let totalAgentsWhereClause = {
      role: 'agent',
      status: 'active'
    };

    if (userRole === 'area_coordinator' && req.user.regionId) {
      totalAgentsWhereClause.regionId = req.user.regionId;
    } else if (userRole === 'coordinator') {
      totalAgentsWhereClause.coordinatorId = req.user.id;
    }

    const totalAgents = await prisma.user.count({
      where: totalAgentsWhereClause
    });

    // Get per-draw live data
    const drawTimes = ['twoPM', 'fivePM', 'ninePM'];
    const liveDrawSales = {};
    
    for (const drawTime of drawTimes) {
      const drawSales = await prisma.ticket.aggregate({
        where: {
          ...whereClause,
          draw: {
            drawTime: drawTime,
            drawDate: {
              gte: today,
              lt: tomorrow
            }
          }
        },
        _sum: { totalAmount: true }
      });
      
      const drawKey = drawTime === 'twoPM' ? '2PM' : drawTime === 'fivePM' ? '5PM' : '9PM';
      liveDrawSales[drawKey] = drawSales._sum.totalAmount || 0;
    }

    const grossSales = liveSalesData._sum.totalAmount || 0;
    const winningAmount = liveWinningAmount;
    const netSales = grossSales - winningAmount;

    res.json({
      success: true,
      data: {
        timestamp: now,
        grossSales,
        winningAmount,
        netSales,
        activeTickets,
        totalTickets: liveSalesData._count.id || 0,
        totalWinners: liveWinnersCount,
        activeAgents,
        totalAgents,
        drawSales: liveDrawSales,
        netMargin: grossSales > 0 ? (netSales / grossSales * 100) : 0,
        averageTicketValue: (liveSalesData._count.id || 0) > 0 ? grossSales / liveSalesData._count.id : 0
      }
    });

  } catch (error) {
    console.error('Live dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching live dashboard data'
    });
  }
});

// @route   POST /api/dashboard/invalidate-cache
// @desc    Invalidate dashboard cache for real-time updates
// @access  Private (Admin/SuperAdmin only)
router.post('/invalidate-cache', requireAuth, async (req, res) => {
  try {
    // Only allow admin and superadmin to invalidate cache
    if (!['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Clear any cached data (if using cache)
    // This is a placeholder for future cache implementation
    console.log('🔄 Dashboard cache invalidated by:', req.user.role, req.user.id);

    res.json({
      success: true,
      message: 'Dashboard cache invalidated successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cache invalidation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error invalidating cache'
    });
  }
});

module.exports = router;



