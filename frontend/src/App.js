import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DataModeProvider } from './contexts/DataModeContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';
import { useLowSpecMode } from './hooks/useLowSpecMode';
import './styles/low-spec-optimizations.css';

// Critical pages - load immediately
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';

// Lazy load all other pages for better performance
const Users = lazy(() => import('./pages/Users/Users'));
const Tickets = lazy(() => import('./pages/Tickets/Tickets'));
const Sales = lazy(() => import('./pages/Sales/Sales'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Notifications = lazy(() => import('./pages/Notifications/Notifications'));
const BettingInterface = lazy(() => import('./pages/Betting/BettingInterface'));
const Account = lazy(() => import('./pages/Account/Account'));
const BalanceManagement = lazy(() => import('./pages/BalanceManagement/BalanceManagement'));
const OperatorDashboard = lazy(() => import('./pages/Operator/OperatorDashboard'));
const OperatorSales = lazy(() => import('./pages/Operator/OperatorSales'));
const BetLimits = lazy(() => import('./pages/BetLimits/BetLimits'));
const DrawResults = lazy(() => import('./pages/DrawResults/DrawResults'));
const AdminManagement = lazy(() => import('./pages/UserManagement/AdminManagement'));
const AgentManagement = lazy(() => import('./pages/UserManagement/AgentManagement'));
const CoordinatorManagement = lazy(() => import('./pages/UserManagement/CoordinatorManagement'));
const AreaCoordinatorManagement = lazy(() => import('./pages/UserManagement/AreaCoordinatorManagement'));
const AccountInfo = lazy(() => import('./pages/Account/AccountInfo'));
const SalesReports = lazy(() => import('./pages/Reports/SalesReports'));
const TicketReprint = lazy(() => import('./pages/Tickets/TicketReprint'));
const BetHistory = lazy(() => import('./pages/BetHistory/BetHistory'));
const SalesPerDraw = lazy(() => import('./pages/SalesPerDraw/SalesPerDraw'));
const AgentSales = lazy(() => import('./pages/AgentSales/AgentSales'));
const AgentTickets = lazy(() => import('./pages/AgentTickets/AgentTickets'));
const AgentResults = lazy(() => import('./pages/AgentResults/AgentResults'));
const WinningTickets = lazy(() => import('./pages/WinningTickets/WinningTickets'));
const PrizeConfiguration = lazy(() => import('./pages/PrizeConfiguration/PrizeConfiguration'));
const MobileTicketShare = lazy(() => import('./pages/Tickets/MobileTicketShare'));
const AuditDashboard = lazy(() => import('./pages/Admin/AuditDashboard'));
const TransactionHistory = lazy(() => import('./pages/Account/TransactionHistory'));
const TemplateAssignment = lazy(() => import('./pages/TicketTemplates/TemplateAssignment'));
const TicketSearch = lazy(() => import('./components/TicketSearch'));
const TicketClaiming = lazy(() => import('./components/TicketClaiming'));
const ClaimApprovals = lazy(() => import('./pages/ClaimApprovals/ClaimApprovals'));
const PrinterManager = lazy(() => import('./components/Printer/PrinterManager'));

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Role-based route components
const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
    {children}
  </ProtectedRoute>
);

const AgentRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['agent']}>
    {children}
  </ProtectedRoute>
);

const OperatorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['operator']}>
    {children}
  </ProtectedRoute>
);

const SuperAdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['superadmin']}>
    {children}
  </ProtectedRoute>
);

const ManagementRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator']}>
    {children}
  </ProtectedRoute>
);

function AppRoutes() {
  const { user, loading } = useAuth();
  
  // Enable low-spec mode for better performance on weak devices
  useLowSpecMode();

  if (loading) {
    return <LoadingSpinner fullScreen={true} />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Mobile navigation removed - no longer needed

  return (
    <Layout>
        <Suspense fallback={<LoadingSpinner fullScreen={true} />}>
          <Routes>
          {/* Dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

        {/* User Management - Management roles */}
        <Route path="/users" element={<ManagementRoute><Users /></ManagementRoute>} />


        {/* Sales per Draw - Management roles and Agent */}
        <Route path="/sales-per-draw" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']}><SalesPerDraw /></ProtectedRoute>} />

        {/* Balance Management - Area Coordinator and above */}
        <Route path="/balance-management" element={<ManagementRoute><BalanceManagement /></ManagementRoute>} />

        {/* Draw Results - Area Coordinator and above */}
        <Route path="/draw-results" element={<ManagementRoute><DrawResults /></ManagementRoute>} />

        {/* Bet Limits - Area Coordinator and above */}
        <Route path="/bet-limits" element={<ManagementRoute><BetLimits /></ManagementRoute>} />

        {/* Simple Tickets - All authenticated users */}

        {/* User Management - SuperAdmin only */}
        <Route path="/admin-management" element={<SuperAdminRoute><AdminManagement /></SuperAdminRoute>} />
        <Route path="/agent-management" element={<AdminRoute><AgentManagement /></AdminRoute>} />
        <Route path="/coordinator-management" element={<AdminRoute><CoordinatorManagement /></AdminRoute>} />
        <Route path="/area-coordinator-management" element={<AdminRoute><AreaCoordinatorManagement /></AdminRoute>} />

        {/* Prize Configuration - SuperAdmin only */}
        <Route path="/prize-configuration" element={<SuperAdminRoute><PrizeConfiguration /></SuperAdminRoute>} />
        {/* Template Assignment - SuperAdmin only */}
        <Route path="/template-assignment" element={<SuperAdminRoute><TemplateAssignment /></SuperAdminRoute>} />
        {/* Claim Approvals - SuperAdmin and Admin only */}
        <Route path="/claim-approvals" element={<AdminRoute><ClaimApprovals /></AdminRoute>} />



        {/* Operator Dashboard - Operator only */}
        <Route path="/operator-dashboard" element={<OperatorRoute><OperatorDashboard /></OperatorRoute>} />
        <Route path="/operator-sales" element={<OperatorRoute><OperatorSales /></OperatorRoute>} />

        {/* Tickets */}
        <Route path="/tickets" element={<Tickets />} />
        
        {/* Ticket Reprint */}
        <Route path="/tickets/reprint" element={<TicketReprint />} />
        
        {/* Betting - Agent only */}
        <Route path="/betting" element={<AgentRoute><BettingInterface /></AgentRoute>} />

        {/* Bet History - Agent only */}
        <Route path="/bet-history" element={<AgentRoute><BetHistory /></AgentRoute>} />

        {/* Agent Results - Agent only */}
        <Route path="/agent-results" element={<AgentRoute><AgentResults /></AgentRoute>} />

        {/* Agent Sales - Agent only */}
        <Route path="/agent-sales" element={<AgentRoute><AgentSales /></AgentRoute>} />

        {/* Agent Tickets - Management roles and Agent */}
        <Route path="/agent-tickets" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']}><AgentTickets /></ProtectedRoute>} />

        {/* Winning Tickets - Management roles and Agent */}
        <Route path="/winning-tickets" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']}><WinningTickets /></ProtectedRoute>} />

        {/* Sales */}
        <Route path="/sales" element={<Sales />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />

        {/* Sales Reports */}
        <Route path="/reports/sales" element={<ManagementRoute><SalesReports /></ManagementRoute>} />

        {/* Notifications */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Account */}
        <Route path="/account" element={<Account />} />

        {/* Transaction History */}
        <Route path="/account/transactions" element={<TransactionHistory />} />

        {/* Account Info */}
        <Route path="/account/info" element={<AccountInfo />} />

        {/* Mobile Ticket Share - Public route */}
        <Route path="/ticket/:ticketNumber" element={<MobileTicketShare />} />

        {/* Ticket Verification & Claiming - Public routes */}
        <Route path="/verify" element={<TicketSearch />} />
        <Route path="/claim" element={<TicketClaiming />} />

        {/* Test Routes - WebShareTest removed */}

        {/* Security Audit Dashboard - Admins only */}
        <Route path="/admin/audit" element={<AdminRoute><AuditDashboard /></AdminRoute>} />

        {/* Printer Manager - Agent only (for mobile POS) */}
        <Route path="/printer" element={<AgentRoute><PrinterManager /></AgentRoute>} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
      </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <DataModeProvider>
            <AppRoutes />
          </DataModeProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

