const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBalanceTransactions() {
    try {
        // Add the status column using a raw query
        await prisma.$executeRawUnsafe(
            'ALTER TABLE balance_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'completed\''
        );
        console.log('Successfully added status column to balance_transactions table');
    } catch (error) {
        console.error('Error fixing balance_transactions table:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixBalanceTransactions()
    .then(() => console.log('Fix completed'))
    .catch(error => console.error('Fix failed:', error));