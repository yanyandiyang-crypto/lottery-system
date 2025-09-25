const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAuditLogColumns() {
    try {
        // First, check if we need to rename the column or create a new one
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                -- If 'operation' exists and 'action' doesn't, rename operation to action
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='audit_log' AND column_name='operation'
                ) AND NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='audit_log' AND column_name='action'
                ) THEN
                    ALTER TABLE audit_log RENAME COLUMN operation TO action;
                    
                -- If neither exists, create action column
                ELSIF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='audit_log' AND column_name='action'
                ) THEN
                    ALTER TABLE audit_log ADD COLUMN action VARCHAR(20) NOT NULL DEFAULT 'INSERT';
                END IF;

                -- Add constraint to ensure valid actions
                IF NOT EXISTS (
                    SELECT 1 
                    FROM pg_constraint 
                    WHERE conname = 'audit_log_action_check'
                ) THEN
                    ALTER TABLE audit_log 
                    ADD CONSTRAINT audit_log_action_check 
                    CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'));
                END IF;
            END $$;
        `);
        
        console.log('Successfully fixed audit_log table columns');
    } catch (error) {
        console.error('Error fixing audit_log table:', error);
        console.error('Error details:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixAuditLogColumns()
    .then(() => console.log('Setup completed'))
    .catch(error => console.error('Setup failed:', error));