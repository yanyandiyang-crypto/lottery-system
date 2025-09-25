# 🎲 NewBetting 3-Digit Lottery System - Flow Documentation

## 📋 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [User Roles & Hierarchy](#user-roles--hierarchy)
3. [Core Business Flows](#core-business-flows)
4. [Technical Implementation Flows](#technical-implementation-flows)
5. [API Endpoints & Data Flow](#api-endpoints--data-flow)
6. [Security & Authentication Flow](#security--authentication-flow)

---

## 🏗️ System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React.js)    │◄──►│   (Node.js)     │◄──►│   (PostgreSQL)  │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Socket.IO     │    │   Prisma ORM    │    │   Redis Cache   │
│   Real-time     │    │   Database      │    │   Session Mgmt  │
│   Updates       │    │   Management    │    │   & Caching     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Frontend**: React.js, Tailwind CSS, Heroicons, React Query
- **Backend**: Node.js, Express.js, Socket.IO
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with role-based access control
- **Real-time**: Socket.IO for live updates

---

## 👥 User Roles & Hierarchy

### Role Hierarchy (Top to Bottom)
```
SuperAdmin (System Owner)
    │
    ├── Admin (Regional Manager)
    │       │
    │       ├── Area Coordinator (Regional Supervisor)
    │       │       │
    │       │       ├── Coordinator (Area Supervisor)
    │       │       │       │
    │       │       │       └── Agent (Betting Operator)
    │       │       │
    │       │       └── Agent (Direct to Area Coordinator)
    │       │
    │       └── Operator (System Monitor)
```

### Role Permissions Matrix

| Feature | SuperAdmin | Admin | Area Coordinator | Coordinator | Agent | Operator |
|---------|------------|-------|------------------|-------------|-------|----------|
| **User Management** | ✅ All Roles | ✅ All except SuperAdmin | ✅ Coordinators & Agents | ✅ Agents only | ❌ | ❌ |
| **Balance Management** | ✅ All Users | ✅ All Users | ✅ Regional Users | ✅ Assigned Agents | ✅ Own Balance | ❌ |
| **Betting Interface** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Draw Results Input** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Ticket Management** | ✅ All Tickets | ✅ All Tickets | ✅ Regional Tickets | ✅ Agent Tickets | ✅ Own Tickets | ✅ View Only |
| **Reports & Analytics** | ✅ Global | ✅ Regional | ✅ Regional | ✅ Agent Level | ✅ Personal | ✅ System Stats |
| **System Configuration** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔄 Core Business Flows

### 1. User Registration & Onboarding Flow

```
SuperAdmin/Admin
    │
    ├── Create Area Coordinator
    │   ├── Set Region Assignment
    │   ├── Set Initial Balance (₱0)
    │   └── Send Login Credentials
    │
    ├── Create Coordinator
    │   ├── Assign to Area Coordinator
    │   ├── Set Initial Balance (₱0)
    │   └── Send Login Credentials
    │
    └── Create Agent
        ├── Assign to Coordinator
        ├── Set Initial Balance (₱0)
        └── Send Login Credentials
```

**Implementation Details:**
- All users start with ₱0 balance
- Credentials are auto-generated or manually set
- Email notifications sent for new accounts
- Account status: `active` by default

### 2. Balance Management Flow

```
Area Coordinator/Coordinator
    │
    ├── Load Balance to User
    │   ├── Select Target User (Agent/Coordinator)
    │   ├── Enter Amount (₱10 - ₱100,000)
    │   ├── Add Transaction Note
    │   └── Confirm Transaction
    │
    └── Transaction Processing
        ├── Validate Sufficient Balance
        ├── Create Balance Transaction Record
        ├── Update User Balance
        ├── Send Notification to User
        └── Log Transaction History
```

**Balance Rules:**
- Minimum load: ₱10
- Maximum load: ₱100,000
- All transactions are logged
- Real-time balance updates via Socket.IO

### 3. Betting Process Flow

```
Agent (Betting Interface)
    │
    ├── Select Draw Time
    │   ├── 2PM Draw (Cutoff: 1:55 PM)
    │   ├── 5PM Draw (Cutoff: 4:55 PM)
    │   └── 9PM Draw (Cutoff: 8:55 PM)
    │
    ├── Enter Bet Details
    │   ├── Bet Type: Standard or Rambolito
    │   ├── 3-Digit Number (000-999)
    │   ├── Bet Amount (₱10 minimum)
    │   └── Validate Bet Rules
    │
    ├── Bet Validation
    │   ├── Check Draw Status (must be OPEN)
    │   ├── Check Bet Limits
    │   ├── Check Sufficient Balance
    │   ├── Validate Number Format
    │   └── Check Rambolito Rules (no triples)
    │
    └── Ticket Creation
        ├── Generate Unique Ticket Number
        ├── Create Ticket Record
        ├── Create Bet Records
        ├── Deduct Balance
        ├── Generate QR Code
        ├── Print Ticket
        └── Send Real-time Update
```

**Betting Rules:**
- **Standard Bet**: Exact 3-digit match required
  - Prize: ₱4,500
  - Example: Bet 123, win if draw = 123
- **Rambolito Bet**: Any permutation wins
  - All different digits (6 combinations): ₱750
  - Double digits (3 combinations): ₱1,500
  - Triple digits: Not allowed

### 4. Draw Management Flow

```
System (Automatic) / Admin (Manual)
    │
    ├── Draw Scheduling
    │   ├── Create Daily Draws (2PM, 5PM, 9PM)
    │   ├── Set Draw Status: OPEN
    │   ├── Set Cutoff Times
    │   └── Notify Users
    │
    ├── Betting Window
    │   ├── Accept Bets (Status: OPEN)
    │   ├── Validate Bet Limits
    │   ├── Process Tickets
    │   └── Monitor Sales
    │
    ├── Draw Cutoff
    │   ├── Stop Accepting Bets (Status: CLOSED)
    │   ├── Finalize Ticket Count
    │   ├── Prepare for Result Input
    │   └── Notify Admin
    │
    └── Result Processing
        ├── Admin Inputs 3-Digit Result
        ├── Calculate Winners
        ├── Update Draw Status: SETTLED
        ├── Process Payouts
        ├── Send Winner Notifications
        └── Update Statistics
```

### 5. Winner Processing Flow

```
Draw Result Input (Admin/SuperAdmin)
    │
    ├── Input 3-Digit Result
    │   ├── Validate Result Format
    │   ├── Confirm Result Entry
    │   └── Submit Result
    │
    ├── Winner Calculation
    │   ├── Scan All Tickets for Draw
    │   ├── Check Standard Bets (exact match)
    │   ├── Check Rambolito Bets (permutations)
    │   ├── Calculate Prize Amounts
    │   └── Create Winner Records
    │
    ├── Payout Processing
    │   ├── Add Prize to User Balance
    │   ├── Create Balance Transaction
    │   ├── Update Ticket Status
    │   └── Log Payout Details
    │
    └── Notifications
        ├── Send Winner Notifications
        ├── Update Dashboard Stats
        ├── Real-time Updates via Socket.IO
        └── Generate Winner Reports
```

---

## 🔧 Technical Implementation Flows

### 1. Authentication Flow

```
User Login
    │
    ├── Submit Credentials
    │   ├── Username/Password
    │   └── Role Selection
    │
    ├── Server Validation
    │   ├── Verify Credentials
    │   ├── Check Account Status
    │   ├── Generate JWT Token
    │   └── Return User Data
    │
    ├── Client Storage
    │   ├── Store JWT Token
    │   ├── Store User Data
    │   ├── Set Auth Context
    │   └── Redirect to Dashboard
    │
    └── Protected Routes
        ├── Check Token Validity
        ├── Verify Role Permissions
        ├── Allow/Deny Access
        └── Redirect if Unauthorized
```

### 2. Real-time Updates Flow (Socket.IO)

```
Socket Connection
    │
    ├── Client Connection
    │   ├── Authenticate Socket
    │   ├── Join User-specific Room
    │   ├── Join Role-based Room
    │   └── Join Global Room
    │
    ├── Event Broadcasting
    │   ├── Balance Updates
    │   ├── Draw Status Changes
    │   ├── Winner Notifications
    │   ├── New Tickets Created
    │   └── System Announcements
    │
    └── Client Handling
        ├── Listen for Events
        ├── Update UI Components
        ├── Show Notifications
        └── Refresh Data
```

### 3. Database Transaction Flow

```
API Request
    │
    ├── Request Validation
    │   ├── Validate Input Data
    │   ├── Check Authentication
    │   ├── Verify Permissions
    │   └── Validate Business Rules
    │
    ├── Database Transaction
    │   ├── Begin Transaction
    │   ├── Execute Multiple Operations
    │   ├── Validate Constraints
    │   ├── Commit Transaction
    │   └── Handle Rollback if Error
    │
    ├── Response Processing
    │   ├── Format Response Data
    │   ├── Include Related Data
    │   ├── Calculate Derived Fields
    │   └── Apply Business Logic
    │
    └── Real-time Updates
        ├── Emit Socket Events
        ├── Update Cache
        ├── Trigger Notifications
        └── Log Activity
```

---

## 🌐 API Endpoints & Data Flow

### Core API Endpoints

#### Authentication
- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user data

#### User Management
- `GET /api/v1/user-management` - List users (with filters)
- `POST /api/v1/user-management` - Create new user
- `PUT /api/v1/user-management/:id` - Update user
- `DELETE /api/v1/user-management/:id` - Delete user

#### Betting & Tickets
- `POST /api/v1/tickets` - Create new ticket
- `GET /api/v1/tickets` - List tickets (with filters)
- `GET /api/v1/tickets/:id` - Get ticket details
- `GET /api/v1/tickets/agent/:agentId` - Get agent's tickets

#### Draw Management
- `GET /api/v1/draws` - List draws
- `POST /api/v1/draw-results/input` - Input draw result
- `GET /api/v1/draw-results/:drawId` - Get draw results

#### Balance Management
- `GET /api/v1/balance-management/users` - List users for balance management
- `POST /api/v1/balance-management/load` - Load balance to user
- `GET /api/v1/balance-management/transactions/:userId` - Get user transactions

### Data Flow Examples

#### Creating a Ticket
```
Frontend (BettingInterface.js)
    │
    ├── User Input Validation
    │   ├── Check bet digits (3 digits)
    │   ├── Validate bet amount (≥₱10)
    │   ├── Check sufficient balance
    │   └── Validate draw status
    │
    ├── API Call
    │   └── POST /api/v1/tickets
    │       ├── drawId: selectedDraw.id
    │       ├── userId: user.id
    │       └── bets: [{ betCombination, betType, betAmount }]
    │
    ├── Backend Processing (routes/tickets.js)
    │   ├── Validate request data
    │   ├── Check draw status
    │   ├── Validate bet limits
    │   ├── Check user balance
    │   ├── Create ticket record
    │   ├── Create bet records
    │   ├── Deduct balance
    │   └── Return ticket data
    │
    ├── Frontend Response
    │   ├── Generate QR code
    │   ├── Print ticket
    │   ├── Update balance display
    │   ├── Show success message
    │   └── Reset form
    │
    └── Real-time Updates
        ├── Emit 'ticket_created' event
        ├── Update dashboard stats
        └── Notify relevant users
```

#### Loading Balance
```
Frontend (BalanceManagement.js)
    │
    ├── User Selection
    │   ├── Select target user
    │   ├── Enter amount
    │   ├── Add transaction note
    │   └── Confirm transaction
    │
    ├── API Call
    │   └── POST /api/v1/balance-management/load
    │       ├── userId: targetUser.id
    │       ├── amount: loadAmount
    │       ├── notes: transactionNote
    │       └── loadedBy: currentUser.id
    │
    ├── Backend Processing (routes/balance-management.js)
    │   ├── Validate permissions
    │   ├── Check amount limits
    │   ├── Begin database transaction
    │   ├── Create balance transaction record
    │   ├── Update user balance
    │   ├── Commit transaction
    │   └── Return success response
    │
    ├── Frontend Response
    │   ├── Show success message
    │   ├── Refresh user list
    │   ├── Update balance displays
    │   └── Close modal
    │
    └── Real-time Updates
        ├── Emit 'balance_updated' event
        ├── Update target user's balance
        └── Send notification
```

---

## 🔐 Security & Authentication Flow

### JWT Token Flow
```
Login Request
    │
    ├── Credential Validation
    │   ├── Verify username/password
    │   ├── Check account status
    │   ├── Validate role permissions
    │   └── Generate JWT token
    │
    ├── Token Structure
    │   ├── Header: { alg: "HS256", typ: "JWT" }
    │   ├── Payload: { userId, role, permissions, exp }
    │   └── Signature: HMACSHA256(header + payload, secret)
    │
    ├── Client Storage
    │   ├── Store token in localStorage
    │   ├── Include in API headers
    │   ├── Auto-refresh before expiry
    │   └── Clear on logout
    │
    └── Request Validation
        ├── Extract token from header
        ├── Verify signature
        ├── Check expiration
        ├── Validate permissions
        └── Allow/deny request
```

### Role-Based Access Control
```
API Request
    │
    ├── Authentication Middleware
    │   ├── Extract JWT token
    │   ├── Verify token validity
    │   ├── Decode user information
    │   └── Attach user to request
    │
    ├── Authorization Middleware
    │   ├── Check required role
    │   ├── Verify user permissions
    │   ├── Validate resource access
    │   └── Allow/deny access
    │
    ├── Route Handler
    │   ├── Process business logic
    │   ├── Access database
    │   ├── Apply role-specific filters
    │   └── Return response
    │
    └── Response
        ├── Format data based on role
        ├── Include relevant information
        ├── Exclude sensitive data
        └── Return to client
```

---

## 📊 Key Business Rules

### Betting Rules
1. **Minimum Bet**: ₱10
2. **Maximum Bet**: No limit per ticket
3. **Bet Limits**: ₱1,000 standard, ₱1,500 rambolito per number per draw
4. **Draw Cutoff**: 5 minutes before draw time
5. **Rambolito Restrictions**: No triple numbers (000, 111, etc.)

### Balance Rules
1. **Initial Balance**: ₱0 for all new users
2. **Minimum Load**: ₱10
3. **Maximum Load**: ₱100,000 per transaction
4. **Balance Deduction**: Immediate on ticket creation
5. **Prize Addition**: Immediate on draw result input

### Draw Rules
1. **Draw Times**: 2PM, 5PM, 9PM daily
2. **Draw Status**: OPEN → CLOSED → SETTLED
3. **Result Input**: Only by Admin/SuperAdmin
4. **Winner Calculation**: Automatic on result input
5. **Payout Processing**: Immediate after result input

---

## 🚀 Performance Considerations

### Database Optimization
- Indexed foreign keys for fast joins
- Pagination for large datasets
- Connection pooling for concurrent users
- Query optimization with Prisma

### Frontend Optimization
- React Query for data caching
- Lazy loading for large components
- Debounced search inputs
- Optimistic updates for better UX

### Real-time Updates
- Socket.IO rooms for targeted updates
- Event throttling to prevent spam
- Connection management for mobile users
- Graceful fallback for connection issues

---

This comprehensive flow documentation covers all major aspects of your lottery system. Each flow includes the technical implementation details, business rules, and security considerations. You can use this as a reference for system review, onboarding new developers, or planning future enhancements.
