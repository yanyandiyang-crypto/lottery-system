const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function debugPhantomDraw() {
  try {
    console.log('🔍 Debugging phantom Draw 1 issue...\n');

    // Check if Draw 1 exists in database
    console.log('1. Checking if Draw 1 exists in database...');
    const draw1 = await prisma.draw.findUnique({
      where: { id: 1 }
    });
    
    if (draw1) {
      console.log('✅ Draw 1 EXISTS in database:');
      console.log(`   ID: ${draw1.id}`);
      console.log(`   Draw Time: ${draw1.drawTime}`);
      console.log(`   Draw Date: ${new Date(draw1.drawDate).toDateString()}`);
      console.log(`   Status: ${draw1.status}`);
      console.log(`   Created: ${new Date(draw1.createdAt).toLocaleString()}`);
    } else {
      console.log('❌ Draw 1 does NOT exist in database');
    }

    // Check all draws with ID 1-5
    console.log('\n2. Checking draws with IDs 1-5...');
    for (let i = 1; i <= 5; i++) {
      const draw = await prisma.draw.findUnique({
        where: { id: i }
      });
      
      if (draw) {
        const drawDate = new Date(draw.drawDate).toDateString();
        console.log(`   Draw ${i}: ${draw.drawTime} | ${drawDate} | ${draw.status}`);
      } else {
        console.log(`   Draw ${i}: NOT FOUND`);
      }
    }

    // Check today's date filtering
    const today = new Date().toISOString().split('T')[0];
    console.log(`\n3. Today's date filter: ${today}`);
    
    const targetDate = new Date(today);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    console.log(`   Target date: ${targetDate.toISOString()}`);
    console.log(`   Next date: ${nextDate.toISOString()}`);

    // Direct Prisma query with same filter as API
    console.log('\n4. Direct Prisma query with API filter...');
    const directQuery = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: targetDate,
          lt: nextDate
        }
      },
      include: {
        _count: {
          select: {
            tickets: true,
            winningTickets: true
          }
        }
      },
      orderBy: [
        { drawDate: 'desc' },
        { drawTime: 'desc' }
      ]
    });

    console.log(`   Direct query returned: ${directQuery.length} draws`);
    directQuery.forEach(draw => {
      console.log(`   Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status}`);
    });

    // Check if there are any draws from previous days that might match
    console.log('\n5. Checking draws from last 3 days...');
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const recentDraws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: threeDaysAgo
        }
      },
      orderBy: [
        { drawDate: 'desc' },
        { id: 'desc' }
      ],
      take: 10
    });

    console.log(`   Recent draws (last 3 days): ${recentDraws.length}`);
    recentDraws.forEach(draw => {
      const drawDate = new Date(draw.drawDate).toDateString();
      console.log(`   Draw ${draw.id} | ${draw.drawTime} | ${drawDate} | ${draw.status}`);
    });

    // Test API call with exact same parameters
    console.log('\n6. Testing API call with authentication...');
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    });

    if (superAdmin) {
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const token = jwt.sign(
        { 
          id: superAdmin.id, 
          username: superAdmin.username, 
          role: superAdmin.role 
        },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      try {
        const apiResponse = await axios.get(`http://localhost:3001/api/v1/draws?date=${today}&status=all&limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log(`   API returned: ${apiResponse.data.data.length} draws`);
        console.log('   API Response draws:');
        apiResponse.data.data.forEach(draw => {
          console.log(`   Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status}`);
        });

        // Check if the API response has any extra data
        console.log('\n7. Comparing API vs Database...');
        const apiDrawIds = apiResponse.data.data.map(d => d.id).sort();
        const dbDrawIds = directQuery.map(d => d.id).sort();
        
        console.log(`   API Draw IDs: [${apiDrawIds.join(', ')}]`);
        console.log(`   DB Draw IDs:  [${dbDrawIds.join(', ')}]`);
        
        const extraInAPI = apiDrawIds.filter(id => !dbDrawIds.includes(id));
        const missingInAPI = dbDrawIds.filter(id => !apiDrawIds.includes(id));
        
        if (extraInAPI.length > 0) {
          console.log(`   ❌ EXTRA in API: [${extraInAPI.join(', ')}]`);
        }
        if (missingInAPI.length > 0) {
          console.log(`   ❌ MISSING in API: [${missingInAPI.join(', ')}]`);
        }
        if (extraInAPI.length === 0 && missingInAPI.length === 0) {
          console.log('   ✅ API and DB match perfectly');
        }

      } catch (error) {
        console.log(`   ❌ API call failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugPhantomDraw();
