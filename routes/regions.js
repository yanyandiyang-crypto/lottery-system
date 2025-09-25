const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/v1/regions
// @desc    List regions with optional availability info
// @access  Admin/SuperAdmin only
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const regions = await prisma.region.findMany({
      select: {
        id: true,
        name: true,
        areaCoordinatorId: true,
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: regions });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({ success: false, message: 'Error fetching regions' });
  }
});

module.exports = router;



