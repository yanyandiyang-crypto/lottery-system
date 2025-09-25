const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function debugAuth() {
  try {
    console.log('JWT_SECRET from env:', process.env.JWT_SECRET || 'NOT SET');
    
    // Create a test token with the actual JWT secret
    const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-here';
    const token = jwt.sign(
      { id: 1, role: 'superadmin' }, 
      jwtSecret,
      { expiresIn: '1h' }
    );
    
    console.log('Generated token:', token);
    
    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Decoded token:', decoded);
    
    // Check user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id || decoded.userId }
    });
    
    console.log('User found:', user ? `${user.username} (${user.role})` : 'Not found');
    
    if (user) {
      console.log('User status:', user.status);
    }
    
  } catch (error) {
    console.error('Auth debug error:', error.message);
    console.error('Error stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugAuth();
