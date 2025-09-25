const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumnsToAuditLog() {
    try {
        // Add the new_values and old_values columns if they don't exist
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                -- Add new_values column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='audit_log' AND column_name='new_values'
                ) THEN
                    ALTER TABLE audit_log ADD COLUMN new_values JSONB;
                END IF;

                -- Add old_values column if it doesn't exist
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='audit_log' AND column_name='old_values'
                ) THEN
                    ALTER TABLE audit_log ADD COLUMN old_values JSONB;
                END IF;
            END $$;
        `);
        
        console.log('Successfully added JSONB columns to audit_log table');
    } catch (error) {
        console.error('Error modifying audit_log table:', error);
        console.error('Error details:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the modification
addColumnsToAuditLog()
    .then(() => console.log('Setup completed'))
    .catch(error => console.error('Setup failed:', error));