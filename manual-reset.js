// Manual database reset - run this with: node manual-reset.js
console.log('Starting manual database reset...');

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('No .env file found. Creating basic .env...');
  fs.writeFileSync(envPath, `
NODE_ENV=development
DATABASE_URL="postgresql://username:password@localhost:5432/lottery_db"
PORT=3001
`);
}

try {
  // Try to reset the database using Prisma
  console.log('Resetting database schema...');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
  
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Database reset completed!');
  console.log('Now you can create a superadmin user through the application.');
  
} catch (error) {
  console.error('Error during reset:', error.message);
  console.log('\nAlternative approach:');
  console.log('1. Start the server: node server.js');
  console.log('2. Use the web interface to create users');
  console.log('3. Or manually connect to your database and run the SQL commands');
}
