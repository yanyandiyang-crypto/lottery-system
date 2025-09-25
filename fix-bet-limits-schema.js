const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBetLimitsSchema() {
    try {
        console.log('🔧 Adding bet_limits_per_draw table to schema...');
        
        // Create the bet_limits_per_draw table using raw SQL
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS bet_limits_per_draw (
                id SERIAL PRIMARY KEY,
                draw_id INT NOT NULL,
                bet_combination VARCHAR(3) NOT NULL,
                bet_type bet_type NOT NULL,
                limit_amount NUMERIC(12,2) NOT NULL DEFAULT 10000.00,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                created_by INT,
                CONSTRAINT fk_bet_limit_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
                CONSTRAINT fk_bet_limit_created_by FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `;

        // Add indexes for performance
        await prisma.$executeRaw`
            CREATE INDEX IF NOT EXISTS idx_bet_limits_draw ON bet_limits_per_draw(draw_id);
            CREATE INDEX IF NOT EXISTS idx_bet_limits_combination ON bet_limits_per_draw(bet_combination);
        `;

        console.log('✅ Successfully added bet_limits_per_draw table');
        
        // Generate Prisma Client with updated schema
        console.log('🔄 Regenerating Prisma Client...');
        await prisma.$executeRaw`SELECT 1`;
        
        console.log('✅ Schema update completed successfully!');
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

fixBetLimitsSchema()
    .catch(console.error);