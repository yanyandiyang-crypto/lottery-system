-- Reset Database Script
-- This will clean all user data and create a fresh superadmin

-- Delete dependent records first (in correct order to avoid FK constraints)
DELETE FROM "Notification";
DELETE FROM "BalanceTransaction";
DELETE FROM "UserBalance";
DELETE FROM "Ticket";
DELETE FROM "Sale";
DELETE FROM "Commission";
DELETE FROM "DrawResult";
DELETE FROM "BetLimit";
DELETE FROM "AgentTicketTemplate";
DELETE FROM "TicketReprint";

-- Update references to null before deleting users
UPDATE "Region" SET "areaCoordinatorId" = NULL;
UPDATE "TicketTemplate" SET "createdById" = NULL;
UPDATE "SystemSetting" SET "updatedById" = NULL;
UPDATE "PrizeConfiguration" SET "createdById" = NULL, "updatedById" = NULL;

-- Delete all users
DELETE FROM "User";

-- Create new superadmin user
-- Password hash for 'admin123' with bcrypt rounds=12
INSERT INTO "User" (
    "username", 
    "passwordHash", 
    "fullName", 
    "email", 
    "role", 
    "status", 
    "createdAt", 
    "updatedAt"
) VALUES (
    'superadmin',
    '$2a$12$LQv3c1yqBw2fnc.eAEBNNOAHrjaqHPiQbqfMjeU0UrY4oWMQkOe4.',
    'Super Administrator',
    'admin@lottery.com',
    'superadmin',
    'active',
    NOW(),
    NOW()
);

-- Create balance for the new superadmin (assuming user ID will be 1)
INSERT INTO "UserBalance" (
    "userId",
    "currentBalance",
    "lastUpdated"
) VALUES (
    (SELECT "id" FROM "User" WHERE "username" = 'superadmin'),
    0,
    NOW()
);
