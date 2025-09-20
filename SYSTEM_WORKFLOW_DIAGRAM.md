# Lottery Management System - Workflow Diagram

## System Overview
```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          LOTTERY MANAGEMENT SYSTEM                              │
│                                                                                 │
│  Frontend (React - Port 3000) ←→ Backend (Node.js - Port 3001) ←→ Database    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## User Roles & Access Levels
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ SuperAdmin  │    │    Admin    │    │ Coordinator │    │    Agent    │
│             │    │             │    │             │    │             │
│ • All Access│    │ • Most      │    │ • Regional  │    │ • Betting   │
│ • User Mgmt │    │   Features  │    │   Oversight │    │ • Tickets   │
│ • System    │    │ • No User   │    │ • Agent     │    │ • Reports   │
│   Config    │    │   Creation  │    │   Management│    │ • Balance   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

## Main System Workflows

### 1. Authentication & User Management Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│  JWT Token  │───▶│ Role-Based  │
│   Screen    │    │ Generation  │    │   Access    │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                   ┌─────────────────────────────┼─────────────────────────────┐
                   │                             │                             │
            ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
            │ SuperAdmin  │              │    Admin    │              │Agent/Coord  │
            │ Dashboard   │              │ Dashboard   │              │ Dashboard   │
            └─────────────┘              └─────────────┘              └─────────────┘
                   │                             │                             │
            ┌─────────────┐              ┌─────────────┐              ┌─────────────┐
            │ Admin Mgmt  │              │ Draw Results│              │   Betting   │
            │ System Cfg  │              │ Bet Limits  │              │   History   │
            └─────────────┘              └─────────────┘              └─────────────┘
```

### 2. Betting Workflow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Agent     │───▶│   Select    │───▶│   Choose    │───▶│   Place     │
│ Dashboard   │    │ Draw Time   │    │  Numbers    │    │    Bet      │
│             │    │(2PM/5PM/9PM)│    │ & Bet Type  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                  │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Ticket    │◀───│  Generate   │◀───│  Validate   │◀───│   Payment   │
│  Printing   │    │   Ticket    │    │ Bet Limits  │    │ Processing  │
│             │    │             │    │ & Balance   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                          │
                   ┌─────────────┐
                   │   Update    │
                   │  Database   │
                   │ (Ticket,    │
                   │ Balance)    │
                   └─────────────┘
```

### 3. Draw Results & Winner Processing Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    PCSO     │───▶│    Admin    │───▶│   Input     │
│  Official   │    │  Receives   │    │  Results    │
│  Results    │    │  Results    │    │ (3-digit)   │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
                   ┌─────────────────────────────────────────┐
                   │         AUTOMATIC PROCESSING            │
                   └─────────────────────────────────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Winner    │◀───│   Create    │◀───│  Calculate  │◀───│   Match     │
│Notifications│    │  Winning    │    │   Prize     │    │  Tickets    │
│  to Agents  │    │  Records    │    │  Amounts    │    │ vs Results  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │
┌─────────────┐
│ Coordinator │
│Notifications│
│ (Agent Wins)│
└─────────────┘
```

### 4. Balance Management Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ SuperAdmin/ │───▶│   Select    │───▶│   Load      │
│    Admin    │    │   User      │    │  Balance    │
│             │    │ (Coord/Agent│    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Transaction │◀───│   Update    │◀───│  Validate   │
│   History   │    │   User      │    │   Amount    │
│   Record    │    │  Balance    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                   ┌─────────────┐
                   │   Agent     │
                   │ Can Place   │
                   │    Bets     │
                   └─────────────┘
```

### 5. Ticket Template Management Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Admin    │───▶│   Open      │───▶│  Design     │
│  Creates    │    │ Template    │    │  Template   │
│  Template   │    │  Designer   │    │ (Photoshop-│
└─────────────┘    └─────────────┘    │   like)     │
                                      └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Assign    │◀───│    Save     │◀───│   Add       │
│ Template to │    │  Template   │    │  Dynamic    │
│   Agents    │    │             │    │   Fields    │
└─────────────┘    └─────────────┘    └─────────────┘
       │
┌─────────────┐
│   Agents    │
│   Print     │
│  Tickets    │
│   Using     │
│  Template   │
└─────────────┘
```

### 6. Bet Limits Management Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Admin    │───▶│   Select    │───▶│    Set      │
│   Access    │    │    Draw     │    │  Limits     │
│ Bet Limits  │    │             │    │ Per Number  │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Betting   │◀───│   System    │◀───│   Bulk      │
│ Validation  │    │ Validates   │    │  Setting    │
│ (Real-time) │    │ Against     │    │ (All Numbers│
│             │    │  Limits     │    │  at Once)   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 7. Sales Reporting Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Users     │───▶│   Select    │───▶│   View      │
│ (All Roles) │    │ Date Range  │    │  Reports    │
│             │    │ & Filters   │    │ (Hierarchy) │
└─────────────┘    └─────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Excel     │◀───│   Export    │◀───│  Real-time  │
│  Download   │    │   Option    │    │   Sales     │
│             │    │             │    │   Data      │
└─────────────┘    └─────────────┘    └─────────────┘
```

## System Architecture Components

### Frontend (React - Port 3000)
```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND COMPONENTS                      │
├─────────────────────────────────────────────────────────────┤
│ • Authentication (Login/Logout)                             │
│ • Role-based Dashboards (SuperAdmin/Admin/Coordinator/Agent)│
│ • Betting Interface (Number Selection, Bet Placement)       │
│ • Draw Results Display                                      │
│ • Balance Management                                        │
│ • Ticket Template Designer (Photoshop-like)                │
│ • Sales Reports & Analytics                                 │
│ • Admin Management                                          │
│ • Bet Limits Management                                     │
│ • Ticket Reprint System                                     │
│ • Winner Notifications                                      │
└─────────────────────────────────────────────────────────────┘
```

### Backend (Node.js - Port 3001)
```
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND SERVICES                        │
├─────────────────────────────────────────────────────────────┤
│ • Authentication & Authorization (JWT)                      │
│ • User Management (CRUD)                                    │
│ • Betting Logic & Validation                                │
│ • Draw Scheduler & Results Processing                       │
│ • Balance Management                                        │
│ • Ticket Generation & Templates                             │
│ • Sales Analytics                                           │
│ • Notification System                                       │
│ • Bet Limits Enforcement                                    │
│ • Winner Calculation                                        │
└─────────────────────────────────────────────────────────────┘
```

### Database (Prisma/PostgreSQL)
```
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE TABLES                        │
├─────────────────────────────────────────────────────────────┤
│ • Users (SuperAdmin/Admin/Coordinator/Agent)                │
│ • Tickets (Betting Records)                                 │
│ • Draws (2PM/5PM/9PM Daily)                                │
│ • DrawResults (PCSO Official Results)                       │
│ • WinningTickets (Prize Records)                            │
│ • TicketTemplates (Custom Designs)                          │
│ • TemplateAssignments (Agent-Template Mapping)             │
│ • BetLimitsPerDraw (Per-Number Limits)                     │
│ • TicketReprint (Reprint History)                          │
│ • Notifications (System Messages)                          │
└─────────────────────────────────────────────────────────────┘
```

## Daily Operations Timeline
```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY OPERATIONS                         │
├─────────────────────────────────────────────────────────────┤
│ 12:00 AM │ System Reset, New Day Initialization             │
│ 08:00 AM │ Betting Opens for 2PM Draw                       │
│ 01:45 PM │ 2PM Draw Betting Closes                          │
│ 02:00 PM │ 2PM Draw Conducted (PCSO)                        │
│ 02:15 PM │ Results Input & Winner Processing                │
│ 02:30 PM │ Betting Opens for 5PM Draw                       │
│ 04:45 PM │ 5PM Draw Betting Closes                          │
│ 05:00 PM │ 5PM Draw Conducted (PCSO)                        │
│ 05:15 PM │ Results Input & Winner Processing                │
│ 05:30 PM │ Betting Opens for 9PM Draw                       │
│ 08:45 PM │ 9PM Draw Betting Closes                          │
│ 09:00 PM │ 9PM Draw Conducted (PCSO)                        │
│ 09:15 PM │ Results Input & Winner Processing                │
│ 11:59 PM │ Daily Reports Generation                         │
└─────────────────────────────────────────────────────────────┘
```

## Security & Access Control
```
┌─────────────────────────────────────────────────────────────┐
│                   SECURITY FEATURES                         │
├─────────────────────────────────────────────────────────────┤
│ • JWT Token Authentication                                  │
│ • Role-based Access Control (RBAC)                         │
│ • Password Hashing (bcrypt)                                │
│ • API Route Protection                                      │
│ • SuperAdmin Privilege Protection                          │
│ • Bet Limits Enforcement                                   │
│ • Balance Validation                                       │
│ • Ticket Reprint Limits (Max 2)                           │
│ • Audit Trail (Transaction History)                       │
│ • Input Validation & Sanitization                         │
└─────────────────────────────────────────────────────────────┘
```

## Integration Points
```
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SYSTEMS                         │
├─────────────────────────────────────────────────────────────┤
│ • PCSO (Philippine Charity Sweepstakes Office)             │
│   - Official Draw Results                                   │
│   - Draw Schedule Synchronization                          │
│                                                            │
│ • Payment Systems                                          │
│   - Balance Loading                                        │
│   - Transaction Processing                                 │
│                                                            │
│ • Printing Systems                                         │
│   - Ticket Template Rendering                             │
│   - Physical Ticket Generation                            │
└─────────────────────────────────────────────────────────────┘
```
