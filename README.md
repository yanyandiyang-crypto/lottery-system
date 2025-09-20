# NewBetting 3-Digit Lottery System

A comprehensive, secure, and scalable 3-digit lottery management system with web and mobile POS support, designed to handle up to 500 concurrent users with full PCSO compliance.

## 🎯 Features

### Core Functionality
- **Role-Based Access Control**: SuperAdmin, Admin, AreaCoordinator, Coordinator, Agent, Operator
- **3-Digit Lottery Betting**: Standard and Rambolito betting types
- **Real-Time Notifications**: Socket.io powered live updates
- **Ticket Management**: QR code generation, multiple templates, reprinting
- **Draw Management**: Auto-scheduled draws (2PM, 5PM, 9PM daily)
- **Sales Reporting**: Comprehensive Excel export functionality
- **Balance Management**: Credit system for agents and coordinators
- **Bet Limits**: Per-draw, per-number betting limits
- **Winning Validation**: Automatic prize calculation and notification

### Security Features
- JWT Authentication with bcrypt password hashing
- Role-based authorization middleware
- HTTPS enforcement
- Input validation and sanitization
- Rate limiting
- Immutable ticket system

### Technical Features
- **Backend**: Node.js + Express + PostgreSQL + Prisma ORM
- **Frontend**: React.js with Tailwind CSS
- **Real-time**: Socket.io for live updates
- **Mobile**: React Native POS app (planned)
- **Database**: PostgreSQL with proper normalization
- **Timezone**: UTC+08:00 (Asia/Manila)

## 🏗️ Architecture

### Database Schema
The system uses a normalized PostgreSQL database with the following key entities:

- **Users**: Hierarchical user management
- **Regions**: Area-based organization
- **Draws**: Auto-scheduled lottery draws
- **Tickets**: Betting tickets with QR codes
- **Sales**: Transaction tracking
- **Winning Tickets**: Optimized winner queries
- **Notifications**: Real-time messaging
- **Balance Management**: Credit system

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (Admin only)
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

#### User Management
- `GET /api/users` - List users (role-based filtering)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

#### Ticket Management
- `POST /api/tickets` - Create ticket (Agent only)
- `GET /api/tickets` - List tickets
- `GET /api/tickets/:id` - Get ticket details
- `POST /api/tickets/:id/validate` - Validate winning ticket

#### Draw Management
- `GET /api/draws` - List draws
- `GET /api/draws/:id` - Get draw details
- `POST /api/draws/:id/result` - Set winning number (Admin only)
- `GET /api/draws/current/active` - Get active draws

#### Sales & Reporting
- `GET /api/sales/agent/:id` - Agent sales
- `GET /api/sales/draw/:id` - Draw sales
- `GET /api/sales/daily` - Daily sales summary
- `GET /api/reports/sales/excel` - Export sales to Excel
- `GET /api/reports/winners/excel` - Export winners to Excel

#### Balance Management
- `GET /api/balance/:userId` - Get user balance
- `POST /api/balance/:userId/load` - Load credits
- `GET /api/balance/:userId/transactions` - Transaction history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- npm or yarn

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd newbetting-lottery-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb newbetting
   
   # Run database migrations
   npx prisma migrate dev
   
   # Generate Prisma client
   npx prisma generate
   ```

4. **Environment configuration**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials and JWT secret
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## 📱 User Roles & Permissions

### SuperAdmin
- Full system access
- User management (all roles)
- System configuration
- Global reporting

### Admin
- User management (except SuperAdmin)
- Draw result input
- System monitoring
- Regional reporting

### Area Coordinator
- Manage coordinators and agents in their region
- Load credits to users
- Regional sales reporting
- Agent performance monitoring

### Coordinator
- Manage assigned agents
- Load credits to agents
- Agent sales reporting
- Ticket validation

### Agent
- Place bets via betting interface
- View personal sales and tickets
- Ticket reprinting
- Balance management

### Operator
- Live sales monitoring
- Draw status tracking
- System overview dashboard

## 🎲 Betting System

### Bet Types

#### Standard Betting
- **Rules**: Exact 3-digit match required
- **Prize**: ₱4,500
- **Example**: Bet 123, win if draw result is 123

#### Rambolito Betting
- **Rules**: Any permutation of 3 digits wins
- **Prizes**:
  - All different digits (6 combinations): ₱750
  - Double digits (3 combinations): ₱1,500
  - Triple digits: Not allowed
- **Example**: Bet 123, win if draw result is 123, 132, 213, 231, 312, or 321

### Draw Schedule
- **2PM Draw**: Cutoff at 1:55 PM
- **5PM Draw**: Cutoff at 4:55 PM
- **9PM Draw**: Cutoff at 8:55 PM

### Bet Limits
- **Standard**: ₱1,000 per number per draw
- **Rambolito**: ₱1,500 per number per draw
- Limits reset after each draw

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/newbetting"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Server
PORT=3000
NODE_ENV="development"

# Timezone
TZ="Asia/Manila"

# Betting Configuration
MIN_BET_AMOUNT=1.00
STANDARD_PRIZE=4500.00
RAMBOLITO_PRIZE_6=750.00
RAMBOLITO_PRIZE_3=1500.00
```

### System Settings
The system includes configurable settings stored in the database:
- Minimum bet amounts
- Prize amounts
- Cutoff times
- Bet limits
- Commission rates

## 📊 Reporting

### Sales Reports
- **Hierarchical Reports**: By region, coordinator, agent
- **Time-based Reports**: Daily, weekly, monthly
- **Excel Export**: Full data export with formatting
- **Real-time Dashboard**: Live sales monitoring

### Winner Reports
- **Draw-based Reports**: Winners per draw
- **Agent Reports**: Agent performance
- **Prize Distribution**: Payout tracking

## 🔒 Security

### Authentication
- JWT tokens with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Role-based access control

### Data Protection
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection
- CSRF protection

### Network Security
- HTTPS enforcement
- Rate limiting
- CORS configuration
- Helmet.js security headers

## 🚀 Deployment

### Production Checklist
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 📱 Mobile POS App

The system includes a React Native mobile POS app for agents:
- Offline betting capability
- Bluetooth thermal printer support
- QR code scanning
- Real-time sync when online

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete betting system
- Role-based access control
- Real-time notifications
- Excel reporting
- Mobile POS support

---

**NewBetting Lottery System** - Secure, Scalable, and User-Friendly 3-Digit Lottery Management




