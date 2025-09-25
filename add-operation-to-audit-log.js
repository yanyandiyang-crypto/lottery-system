const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addOperationColumnToAuditLog() {
    try {
        // Add the operation column
        await prisma.$executeRawUnsafe(`
            ALTER TABLE audit_log 
            ADD COLUMN IF NOT EXISTS operation VARCHAR(20) DEFAULT 'UPDATE'::VARCHAR
            CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'));
        `);
        
        console.log('Successfully added operation column to audit_log table');
    } catch (error) {
        console.error('Error modifying audit_log table:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the modification
addOperationColumnToAuditLog()
    .then(() => console.log('Setup completed'))
    .catch(error => console.error('Setup failed:', error));