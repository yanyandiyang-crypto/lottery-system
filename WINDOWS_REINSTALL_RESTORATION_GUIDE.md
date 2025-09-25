# 🚀 Windows Reinstall - Database Restoration Guide

## 📋 BACKUP SUMMARY

**Backup Date:** September 25, 2025  
**Database:** lottery_system_local  
**PostgreSQL Version:** 16  
**Total Backup Size:** ~15.5 MB  

## 📁 BACKUP FILES CREATED

### Database Backups (in `backups/` folder):
- `database-backup-2025-09-25.json` - JSON format backup (0.05 MB)
- `pg-dump-complete-2025-09-25.sql` - Complete PostgreSQL dump (0.12 MB)
- `pg-dump-data-only-2025-09-25.sql` - Data only backup (0.05 MB)
- `pg-dump-schema-only-2025-09-25.sql` - Schema only backup (0.07 MB)
- `backup-summary-2025-09-25.json` - Backup summary

### Configuration Backup (in `backups/config-backup/` folder):
- All source code files
- Configuration files (.env, package.json, etc.)
- Database schemas
- Documentation
- Scripts and utilities
- Frontend code
- **Total Size:** 15.22 MB

## 🔧 STEP-BY-STEP RESTORATION

### 1. Install Prerequisites

#### Install Node.js
```bash
# Download and install Node.js 18+ from https://nodejs.org
# Verify installation:
node --version
npm --version
```

#### Install PostgreSQL 16
```bash
# Download PostgreSQL 16 from https://www.postgresql.org/download/windows/
# During installation, remember the password you set for 'postgres' user
# Default port: 5432
```

### 2. Restore Database

#### Option A: Using pg_restore (Recommended)
```bash
# Open Command Prompt as Administrator
# Navigate to your project directory

# Create the database
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE lottery_system_local;"

# Restore complete database
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d lottery_system_local -f "backups/pg-dump-complete-2025-09-25.sql"
```

#### Option B: Using pgAdmin (GUI Method)
1. Open pgAdmin
2. Connect to PostgreSQL server
3. Right-click "Databases" → "Create" → "Database"
4. Name: `lottery_system_local`
5. Right-click the new database → "Restore"
6. Select `pg-dump-complete-2025-09-25.sql`
7. Click "Restore"

### 3. Restore Project Files

```bash
# Copy the entire project folder to your new Windows installation
# Navigate to the project directory
cd "path\to\your\project"

# Install dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Configure Environment

#### Create .env file:
```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/lottery_system_local"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
NODE_ENV="development"
```

**⚠️ IMPORTANT:** Change the JWT_SECRET to a new value for security!

### 5. Verify Database Connection

```bash
# Test database connection
node check-db-connection.js

# Expected output:
# ✅ Database connection successful
# 📊 Current database: lottery_system_local
# 👥 Total users: 4
```

### 6. Start the System

#### Option A: Using batch file
```bash
run-system.bat
```

#### Option B: Manual start
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### 7. Verify System

- **Backend API:** http://localhost:3000
- **Frontend:** http://localhost:3001
- **Database:** PostgreSQL on port 5432

## 🔐 DEFAULT LOGIN CREDENTIALS

After restoration, you can login with:

- **Username:** superadmin
- **Password:** admin123

**⚠️ SECURITY:** Change default passwords immediately after restoration!

## 📊 DATABASE CONTENTS RESTORED

- **Users:** 4 (superadmin, areacor, cor1, agent1)
- **Draws:** 45
- **Tickets:** 9
- **Bets:** 9
- **Sales:** 2
- **Regions:** 1
- **All system configurations and settings**

## 🚨 TROUBLESHOOTING

### Database Connection Issues
```bash
# Check if PostgreSQL is running
net start postgresql-x64-16

# Test connection
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT version();"
```

### Port Conflicts
- Backend: Port 3000
- Frontend: Port 3001
- Database: Port 5432

### Permission Issues
- Run Command Prompt as Administrator
- Ensure PostgreSQL service is running
- Check firewall settings

## 📞 SUPPORT INFORMATION

### System Details
- **Database:** PostgreSQL 16
- **Backend:** Node.js with Express
- **Frontend:** React
- **ORM:** Prisma
- **Authentication:** JWT

### Backup Verification
To verify your backup is complete, check:
1. All files in `backups/` folder
2. Database connection test passes
3. All 4 users are restored
4. All 45 draws are restored

## ✅ RESTORATION CHECKLIST

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 16 installed
- [ ] Database restored successfully
- [ ] Project files copied
- [ ] Dependencies installed (npm install)
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] System starts without errors
- [ ] Frontend and backend accessible
- [ ] Default login works
- [ ] All data restored (users, draws, tickets, etc.)

## 🎯 FINAL NOTES

1. **Keep backups safe:** Store the `backups/` folder in multiple locations
2. **Update passwords:** Change all default passwords after restoration
3. **Test thoroughly:** Verify all functionality before going live
4. **Documentation:** Keep this guide for future reference

**Good luck with your Windows reinstall! 🚀**
