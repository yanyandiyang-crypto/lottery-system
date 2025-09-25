# 🚀 NewBetting System - Quick Start Guide

## Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- Git (optional)

## Step-by-Step Setup

### 1. Database Setup

#### Option A: Using psql command line
```bash
# Create database
psql -U postgres -c "CREATE DATABASE newbetting;"

# Run schema
psql -U postgres -d newbetting -f database_schema.sql
```

#### Option B: Using pgAdmin
1. Open pgAdmin
2. Create new database named `newbetting`
3. Run the SQL from `database_schema.sql` in the Query Tool

### 2. Environment Configuration

Edit the `.env` file with your database credentials:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/newbetting"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3000
NODE_ENV="development"
```

### 3. Install Dependencies

#### Backend
```bash
npm install
```

#### Frontend
```bash
cd frontend
npm install
cd ..
```

### 4. Run the System

#### Option A: Using the batch file (Windows)
```bash
run-system.bat
```

#### Option B: Manual start

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 5. Access the System

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/versions

## Default Login Credentials

After running the database schema, you'll need to create your first admin user:

### Create SuperAdmin User
```sql
INSERT INTO users (username, password_hash, full_name, role, status, created_by) 
VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Qz8K2O', 'System Administrator', 'superadmin', 'active', 1);

INSERT INTO user_balances (user_id, current_balance, total_loaded, total_used) 
VALUES (1, 10000.00, 10000.00, 0.00);
```

**Default Password**: `admin123`

## System Features

### ✅ What's Working
- User authentication and authorization
- Role-based access control (6 user types)
- 3-digit lottery betting (Standard & Rambolito)
- Real-time notifications via WebSocket
- Draw management with auto-scheduling
- Sales reporting with Excel export
- Balance management system
- API versioning (v1 stable, v2 beta)
- Enhanced security features

### 🎯 User Roles
1. **SuperAdmin** - Full system access
2. **Admin** - User management, draw results
3. **AreaCoordinator** - Regional management
4. **Coordinator** - Agent management
5. **Agent** - Betting interface
6. **Operator** - Live monitoring

### 🎲 Betting System
- **Standard**: Exact 3-digit match (₱4,500 prize)
- **Rambolito**: Any permutation (₱750/₱1,500 prizes)
- **Draw Times**: 2PM, 5PM, 9PM daily
- **Cutoff**: 5 minutes before each draw
- **Bet Limits**: ₱1,000 Standard, ₱1,500 Rambolito

## Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running and check your DATABASE_URL

#### 2. Port Already in Use
```
Error: listen EADDRINUSE :::3000
```
**Solution**: Change PORT in .env file or kill the process using the port

#### 3. Module Not Found
```
Error: Cannot find module 'express'
```
**Solution**: Run `npm install` in both backend and frontend directories

#### 4. CORS Error
```
Access to fetch at 'http://localhost:3000' from origin 'http://localhost:3001' has been blocked by CORS policy
```
**Solution**: Check CORS_ORIGIN in .env file

### Database Issues

#### Reset Database
```sql
DROP DATABASE newbetting;
CREATE DATABASE newbetting;
\c newbetting;
\i database_schema.sql
```

#### Check Database Connection
```bash
psql -U postgres -d newbetting -c "SELECT version();"
```

## Development

### File Structure
```
newbetting-system/
├── backend/
│   ├── routes/          # API routes
│   ├── middleware/      # Security & auth
│   ├── services/        # Business logic
│   └── utils/           # Utilities
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # React contexts
│   │   └── utils/       # Frontend utilities
│   └── public/
├── database_schema.sql  # Database schema
├── docker-compose.yml   # Docker setup
└── README.md           # Documentation
```

### API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Register (Admin only)
- `GET /api/v1/auth/me` - Get current user

#### Tickets
- `POST /api/v1/tickets` - Create ticket (Agent only)
- `GET /api/v1/tickets` - List tickets
- `POST /api/v1/tickets/:id/validate` - Validate ticket

#### Draws
- `GET /api/v1/draws` - List draws
- `POST /api/v1/draws/:id/result` - Set result (Admin only)
- `GET /api/v1/draws/current/active` - Active draws

## Production Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Set `NODE_ENV=production` in .env
2. Run `npm run build` in frontend
3. Use PM2 or similar for process management
4. Set up reverse proxy (nginx)
5. Configure SSL certificates

## Support

If you encounter any issues:
1. Check the console logs
2. Verify database connection
3. Check environment variables
4. Review the API documentation
5. Check the troubleshooting section above

---

**NewBetting Lottery System** - Ready to run! 🎉




