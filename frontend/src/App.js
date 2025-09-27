import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DataModeProvider } from './contexts/DataModeContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Users from './pages/Users/Users';
import Tickets from './pages/Tickets/Tickets';
import Sales from './pages/Sales/Sales';
import Reports from './pages/Reports/Reports';
import Notifications from './pages/Notifications/Notifications';
import BettingInterface from './pages/Betting/BettingInterface';
import Account from './pages/Account/Account';
import LoadingSpinner from './components/UI/LoadingSpinner';

// New feature pages
import BalanceManagement from './pages/BalanceManagement/BalanceManagement';
import OperatorDashboard from './pages/Operator/OperatorDashboard';
import OperatorSales from './pages/Operator/OperatorSales';
import BetLimits from './pages/BetLimits/BetLimits';
import DrawResults from './pages/DrawResults/DrawResults';
import AdminManagement from './pages/UserManagement/AdminManagement';
import AgentManagement from './pages/UserManagement/AgentManagement';
import CoordinatorManagement from './pages/UserManagement/CoordinatorManagement';
import AreaCoordinatorManagement from './pages/UserManagement/AreaCoordinatorManagement';
import AccountInfo from './pages/Account/AccountInfo';
import SalesReports from './pages/Reports/SalesReports';
import TicketReprint from './pages/Tickets/TicketReprint';
import BetHistory from './pages/BetHistory/BetHistory';
import SalesPerDraw from './pages/SalesPerDraw/SalesPerDraw';
import FunctionManagement from './pages/FunctionManagement/FunctionManagement';
import AgentSales from './pages/AgentSales/AgentSales';
import AgentTickets from './pages/AgentTickets/AgentTickets';
import AgentResults from './pages/AgentResults/AgentResults';
import WinningTickets from './pages/WinningTickets/WinningTickets';
import PrizeConfiguration from './pages/PrizeConfiguration/PrizeConfiguration';
import MobileTicketShare from './pages/Tickets/MobileTicketShare';
// WebShareTest removed - test component no longer needed
import AuditDashboard from './pages/Admin/AuditDashboard';
import TransactionHistory from './pages/Account/TransactionHistory';
import TemplateAssignment from './pages/TicketTemplates/TemplateAssignment';
import TicketSearch from './components/TicketSearch';
import TicketClaiming from './components/TicketClaiming';
import ClaimApprovals from './pages/ClaimApprovals/ClaimApprovals';

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

  return (
    <Layout>
      <Routes>
        {/* Dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* User Management - Management roles */}
        <Route path="/users" element={<ManagementRoute><Users /></ManagementRoute>} />

        {/* Function Management - SuperAdmin only */}
        <Route path="/function-management" element={<SuperAdminRoute><FunctionManagement /></SuperAdminRoute>} />

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

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
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

