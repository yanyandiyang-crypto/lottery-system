const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAuditLogActionColumn() {
    try {
        // 1. Make sure the action column exists and has correct constraints
        await prisma.$executeRawUnsafe(`
            DO $$ 
            BEGIN 
                -- Drop the existing column if it exists (to reset constraints)
                IF EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='audit_log' AND column_name='action'
                ) THEN
                    ALTER TABLE audit_log DROP COLUMN action;
                END IF;

                -- Create the action column with proper constraints
                ALTER TABLE audit_log 
                ADD COLUMN action VARCHAR(20) NOT NULL DEFAULT 'INSERT'
                CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'));

                -- Update any existing records with NULL action
                UPDATE audit_log 
                SET action = CASE 
                    WHEN operation IS NOT NULL THEN operation
                    WHEN new_values IS NOT NULL AND old_values IS NULL THEN 'INSERT'
                    WHEN new_values IS NOT NULL AND old_values IS NOT NULL THEN 'UPDATE'
                    WHEN new_values IS NULL AND old_values IS NOT NULL THEN 'DELETE'
                    ELSE 'INSERT'
                END;
            END $$;
        `);
        
        console.log('Successfully fixed audit_log action column');
    } catch (error) {
        console.error('Error fixing audit_log table:', error);
        console.error('Error details:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the fix
fixAuditLogActionColumn()
    .then(() => console.log('Setup completed'))
    .catch(error => console.error('Setup failed:', error));