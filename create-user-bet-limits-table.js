const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUserBetLimitsTable() {
    try {
        // Create the table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS user_bet_limits (
                id SERIAL PRIMARY KEY,
                user_id INT NOT NULL,
                draw_id INT NOT NULL,
                bet_type VARCHAR(20) NOT NULL,
                max_amount NUMERIC(12,2) DEFAULT 1000.00,
                current_amount NUMERIC(12,2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                
                CONSTRAINT fk_user_bet_limit_user FOREIGN KEY (user_id) REFERENCES users(id),
                CONSTRAINT fk_user_bet_limit_draw FOREIGN KEY (draw_id) REFERENCES draws(id),
                CONSTRAINT unique_user_draw_bet_limit UNIQUE (user_id, draw_id, bet_type)
            )
        `);

        // Create the index in a separate command
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_user_bet_limits_user_draw 
            ON user_bet_limits(user_id, draw_id)
        `);
        
        console.log('Successfully created user_bet_limits table');
    } catch (error) {
        console.error('Error creating user_bet_limits table:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the creation script
createUserBetLimitsTable()
    .then(() => console.log('Setup completed'))
    .catch(error => console.error('Setup failed:', error));