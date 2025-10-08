import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { DataModeProvider } from './contexts/DataModeContext';
import Layout from './components/Layout/Layout';
import LoadingSpinner from './components/UI/LoadingSpinner';

// Critical pages - load immediately
import Login from './pages/Auth/Login';

// Role-based Dashboard imports
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AreaCoordinatorDashboard = lazy(() => import('./pages/AreaCoordinator/Dashboard'));
const CoordinatorDashboard = lazy(() => import('./pages/Coordinator/Dashboard'));
const AgentDashboard = lazy(() => import('./pages/Agent/Dashboard'));

// SuperAdmin Pages
const SuperAdminUsers = lazy(() => import('./pages/SuperAdmin/Users'));
const SuperAdminManagement = lazy(() => import('./pages/SuperAdmin/AdminManagement'));
const SuperAdminAgentManagement = lazy(() => import('./pages/SuperAdmin/AgentManagement'));
const SuperAdminCoordinatorManagement = lazy(() => import('./pages/SuperAdmin/CoordinatorManagement'));
const SuperAdminAreaCoordinatorManagement = lazy(() => import('./pages/SuperAdmin/AreaCoordinatorManagement'));
const SuperAdminBalanceManagement = lazy(() => import('./pages/SuperAdmin/BalanceManagement'));
const SuperAdminSalesPerDraw = lazy(() => import('./pages/SuperAdmin/SalesPerDraw'));
const SuperAdminSalesReports = lazy(() => import('./pages/SuperAdmin/SalesReports'));
const SuperAdminDrawResults = lazy(() => import('./pages/SuperAdmin/DrawResults'));
const SuperAdminWinningTickets = lazy(() => import('./pages/SuperAdmin/WinningTickets'));
const SuperAdminAgentTickets = lazy(() => import('./pages/SuperAdmin/AgentTickets'));
const SuperAdminBetLimits = lazy(() => import('./pages/SuperAdmin/BetLimits'));
const SuperAdminPrizeConfiguration = lazy(() => import('./pages/SuperAdmin/PrizeConfiguration'));
// Template assignment removed - single backend template only
const SuperAdminAuditDashboard = lazy(() => import('./pages/SuperAdmin/AuditDashboard'));
const SuperAdminClaimApprovals = lazy(() => import('./pages/SuperAdmin/ClaimApprovals'));
const SuperAdminNotifications = lazy(() => import('./pages/SuperAdmin/Notifications'));

// Admin Pages
const AdminUsers = lazy(() => import('./pages/Admin/Users'));
const AdminAgentManagement = lazy(() => import('./pages/Admin/AgentManagement'));
const AdminCoordinatorManagement = lazy(() => import('./pages/Admin/CoordinatorManagement'));
const AdminAreaCoordinatorManagement = lazy(() => import('./pages/Admin/AreaCoordinatorManagement'));
const AdminBalanceManagement = lazy(() => import('./pages/Admin/BalanceManagement'));
const AdminSalesPerDraw = lazy(() => import('./pages/Admin/SalesPerDraw'));
const AdminSalesReports = lazy(() => import('./pages/Admin/SalesReports'));
const AdminDrawResults = lazy(() => import('./pages/Admin/DrawResults'));
const AdminWinningTickets = lazy(() => import('./pages/Admin/WinningTickets'));
const AdminAgentTickets = lazy(() => import('./pages/Admin/AgentTickets'));
const AdminBetLimits = lazy(() => import('./pages/Admin/BetLimits'));
const AdminAuditDashboard = lazy(() => import('./pages/Admin/AuditDashboard'));
const AdminClaimApprovals = lazy(() => import('./pages/Admin/ClaimApprovals'));
const AdminNotifications = lazy(() => import('./pages/Admin/Notifications'));

// Area Coordinator Pages
const AreaCoordinatorUsers = lazy(() => import('./pages/AreaCoordinator/Users'));
const AreaCoordinatorBalanceManagement = lazy(() => import('./pages/AreaCoordinator/BalanceManagement'));
const AreaCoordinatorSalesPerDraw = lazy(() => import('./pages/AreaCoordinator/SalesPerDraw'));
const AreaCoordinatorSalesReports = lazy(() => import('./pages/AreaCoordinator/SalesReports'));
const AreaCoordinatorDrawResults = lazy(() => import('./pages/AreaCoordinator/DrawResults'));
const AreaCoordinatorWinningTickets = lazy(() => import('./pages/AreaCoordinator/WinningTickets'));
const AreaCoordinatorAgentTickets = lazy(() => import('./pages/AreaCoordinator/AgentTickets'));

// Coordinator Pages
const CoordinatorUsers = lazy(() => import('./pages/Coordinator/Users'));
const CoordinatorBalanceManagement = lazy(() => import('./pages/Coordinator/BalanceManagement'));
const CoordinatorSalesPerDraw = lazy(() => import('./pages/Coordinator/SalesPerDraw'));
const CoordinatorSalesReports = lazy(() => import('./pages/Coordinator/SalesReports'));
const CoordinatorDrawResults = lazy(() => import('./pages/Coordinator/DrawResults'));
const CoordinatorWinningTickets = lazy(() => import('./pages/Coordinator/WinningTickets'));
const CoordinatorAgentTickets = lazy(() => import('./pages/Coordinator/AgentTickets'));

// Agent Pages
const AgentBettingInterface = lazy(() => import('./pages/Agent/BettingInterface'));
const AgentBetHistory = lazy(() => import('./pages/Agent/BetHistory'));
const AgentResults = lazy(() => import('./pages/Agent/AgentResults'));
const AgentSales = lazy(() => import('./pages/Agent/AgentSales'));
const AgentTickets = lazy(() => import('./pages/Agent/AgentTickets'));
const AgentWinningTickets = lazy(() => import('./pages/Agent/WinningTickets'));
const AgentSalesPerDraw = lazy(() => import('./pages/Agent/SalesPerDraw'));
const AgentNotifications = lazy(() => import('./pages/Agent/Notifications'));

// Coordinator Pages
const CoordinatorNotifications = lazy(() => import('./pages/Coordinator/Notifications'));

// Area Coordinator Pages  
const AreaCoordinatorNotifications = lazy(() => import('./pages/AreaCoordinator/Notifications'));

// Shared Pages (not role-specific)
const Tickets = lazy(() => import('./pages/Tickets/Tickets'));
const Sales = lazy(() => import('./pages/Sales/Sales'));
const Reports = lazy(() => import('./pages/Reports/Reports'));
const Account = lazy(() => import('./pages/Account/Account'));
const OperatorDashboard = lazy(() => import('./pages/Operator/OperatorDashboard'));
const OperatorSales = lazy(() => import('./pages/Operator/OperatorSales'));
const AccountInfo = lazy(() => import('./pages/Account/AccountInfo'));
const TicketReprint = lazy(() => import('./pages/Tickets/TicketReprint'));
const MobileTicketShare = lazy(() => import('./pages/Tickets/MobileTicketShare'));
const TransactionHistory = lazy(() => import('./pages/Account/TransactionHistory'));
const TicketSearch = lazy(() => import('./components/TicketSearch'));
const TicketClaiming = lazy(() => import('./components/TicketClaiming'));
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

// Dynamic Dashboard Component based on role
const DynamicDashboard = () => {
  const { user } = useAuth();
  
  switch(user?.role) {
    case 'superadmin':
      return <SuperAdminDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'area_coordinator':
      return <AreaCoordinatorDashboard />;
    case 'coordinator':
      return <CoordinatorDashboard />;
    case 'agent':
      return <AgentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// Role-based component selector
const getRoleBasedComponent = (user, componentName) => {
  switch(user?.role) {
    case 'superadmin':
      return {
        Users: SuperAdminUsers,
        AgentManagement: SuperAdminAgentManagement,
        CoordinatorManagement: SuperAdminCoordinatorManagement,
        AreaCoordinatorManagement: SuperAdminAreaCoordinatorManagement,
        BalanceManagement: SuperAdminBalanceManagement,
        SalesPerDraw: SuperAdminSalesPerDraw,
        SalesReports: SuperAdminSalesReports,
        DrawResults: SuperAdminDrawResults,
        WinningTickets: SuperAdminWinningTickets,
        AgentTickets: SuperAdminAgentTickets,
        BetLimits: SuperAdminBetLimits,
        PrizeConfiguration: SuperAdminPrizeConfiguration,
        // TemplateAssignment: removed - single backend template only
        AuditDashboard: SuperAdminAuditDashboard,
        ClaimApprovals: SuperAdminClaimApprovals,
        Notifications: SuperAdminNotifications,
        AdminManagement: SuperAdminManagement,
      }[componentName];
    case 'admin':
      return {
        Users: AdminUsers,
        AgentManagement: AdminAgentManagement,
        CoordinatorManagement: AdminCoordinatorManagement,
        AreaCoordinatorManagement: AdminAreaCoordinatorManagement,
        BalanceManagement: AdminBalanceManagement,
        SalesPerDraw: AdminSalesPerDraw,
        SalesReports: AdminSalesReports,
        DrawResults: AdminDrawResults,
        WinningTickets: AdminWinningTickets,
        AgentTickets: AdminAgentTickets,
        BetLimits: AdminBetLimits,
        AuditDashboard: AdminAuditDashboard,
        ClaimApprovals: AdminClaimApprovals,
        Notifications: AdminNotifications,
      }[componentName];
    case 'area_coordinator':
      return {
        Users: AreaCoordinatorUsers,
        BalanceManagement: AreaCoordinatorBalanceManagement,
        SalesPerDraw: AreaCoordinatorSalesPerDraw,
        SalesReports: AreaCoordinatorSalesReports,
        DrawResults: AreaCoordinatorDrawResults,
        WinningTickets: AreaCoordinatorWinningTickets,
        AgentTickets: AreaCoordinatorAgentTickets,
        Notifications: AreaCoordinatorNotifications,
      }[componentName];
    case 'coordinator':
      return {
        Users: CoordinatorUsers,
        BalanceManagement: CoordinatorBalanceManagement,
        SalesPerDraw: CoordinatorSalesPerDraw,
        SalesReports: CoordinatorSalesReports,
        DrawResults: CoordinatorDrawResults,
        WinningTickets: CoordinatorWinningTickets,
        AgentTickets: CoordinatorAgentTickets,
        Notifications: CoordinatorNotifications,
      }[componentName];
    case 'agent':
      return {
        BettingInterface: AgentBettingInterface,
        BetHistory: AgentBetHistory,
        AgentResults: AgentResults,
        AgentSales: AgentSales,
        AgentTickets: AgentTickets,
        WinningTickets: AgentWinningTickets,
        SalesPerDraw: AgentSalesPerDraw,
        Notifications: AgentNotifications,
      }[componentName];
    default:
      return null;
  }
};

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

  // Get role-specific components
  const UsersComponent = getRoleBasedComponent(user, 'Users');
  const AgentManagementComponent = getRoleBasedComponent(user, 'AgentManagement');
  const CoordinatorManagementComponent = getRoleBasedComponent(user, 'CoordinatorManagement');
  const AreaCoordinatorManagementComponent = getRoleBasedComponent(user, 'AreaCoordinatorManagement');
  const BalanceManagementComponent = getRoleBasedComponent(user, 'BalanceManagement');
  const SalesPerDrawComponent = getRoleBasedComponent(user, 'SalesPerDraw');
  const SalesReportsComponent = getRoleBasedComponent(user, 'SalesReports');
  const DrawResultsComponent = getRoleBasedComponent(user, 'DrawResults');
  const WinningTicketsComponent = getRoleBasedComponent(user, 'WinningTickets');
  const AgentTicketsComponent = getRoleBasedComponent(user, 'AgentTickets');
  const BetLimitsComponent = getRoleBasedComponent(user, 'BetLimits');
  const BettingInterfaceComponent = getRoleBasedComponent(user, 'BettingInterface');
  const BetHistoryComponent = getRoleBasedComponent(user, 'BetHistory');
  const AgentResultsComponent = getRoleBasedComponent(user, 'AgentResults');
  const AgentSalesComponent = getRoleBasedComponent(user, 'AgentSales');
  const PrizeConfigurationComponent = getRoleBasedComponent(user, 'PrizeConfiguration');
  // const TemplateAssignmentComponent = getRoleBasedComponent(user, 'TemplateAssignment'); // Removed
  const AuditDashboardComponent = getRoleBasedComponent(user, 'AuditDashboard');
  const ClaimApprovalsComponent = getRoleBasedComponent(user, 'ClaimApprovals');
  const NotificationsComponent = getRoleBasedComponent(user, 'Notifications');
  const AdminManagementComponent = getRoleBasedComponent(user, 'AdminManagement');

  return (
    <Layout>
        <Suspense fallback={<LoadingSpinner fullScreen={true} />}>
          <Routes>
          {/* Dashboard - Role-based */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DynamicDashboard />} />

        {/* User Management - Role-based */}
        {UsersComponent && <Route path="/users" element={<ManagementRoute><UsersComponent /></ManagementRoute>} />}

        {/* Sales per Draw - Role-based */}
        {SalesPerDrawComponent && <Route path="/sales-per-draw" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']}><SalesPerDrawComponent /></ProtectedRoute>} />}

        {/* Balance Management - Role-based */}
        {BalanceManagementComponent && <Route path="/balance-management" element={<ManagementRoute><BalanceManagementComponent /></ManagementRoute>} />}

        {/* Draw Results - Role-based */}
        {DrawResultsComponent && <Route path="/draw-results" element={<ManagementRoute><DrawResultsComponent /></ManagementRoute>} />}

        {/* Bet Limits - Role-based */}
        {BetLimitsComponent && <Route path="/bet-limits" element={<ManagementRoute><BetLimitsComponent /></ManagementRoute>} />}

        {/* User Management - SuperAdmin and Admin */}
        {AdminManagementComponent && <Route path="/admin-management" element={<SuperAdminRoute><AdminManagementComponent /></SuperAdminRoute>} />}
        {AgentManagementComponent && <Route path="/agent-management" element={<AdminRoute><AgentManagementComponent /></AdminRoute>} />}
        {CoordinatorManagementComponent && <Route path="/coordinator-management" element={<AdminRoute><CoordinatorManagementComponent /></AdminRoute>} />}
        {AreaCoordinatorManagementComponent && <Route path="/area-coordinator-management" element={<AdminRoute><AreaCoordinatorManagementComponent /></AdminRoute>} />}

        {/* Prize Configuration - SuperAdmin only */}
        {PrizeConfigurationComponent && <Route path="/prize-configuration" element={<SuperAdminRoute><PrizeConfigurationComponent /></SuperAdminRoute>} />}
        {/* Template Assignment - Removed (single backend template only) */}
        {/* Claim Approvals - SuperAdmin and Admin only */}
        {ClaimApprovalsComponent && <Route path="/claim-approvals" element={<AdminRoute><ClaimApprovalsComponent /></AdminRoute>} />}



        {/* Operator Dashboard - Operator only */}
        <Route path="/operator-dashboard" element={<OperatorRoute><OperatorDashboard /></OperatorRoute>} />
        <Route path="/operator-sales" element={<OperatorRoute><OperatorSales /></OperatorRoute>} />

        {/* Tickets */}
        <Route path="/tickets" element={<Tickets />} />
        
        {/* Ticket Reprint */}
        <Route path="/tickets/reprint" element={<TicketReprint />} />
        
        {/* Betting - Agent only */}
        {BettingInterfaceComponent && <Route path="/betting" element={<AgentRoute><BettingInterfaceComponent /></AgentRoute>} />}

        {/* Bet History - Agent only */}
        {BetHistoryComponent && <Route path="/bet-history" element={<AgentRoute><BetHistoryComponent /></AgentRoute>} />}
        
        {/* Notifications - All roles except operators */}
        {NotificationsComponent && (
          <Route path="/notifications" element={
            user?.role === 'superadmin' || user?.role === 'admin' ? (
              <AdminRoute><NotificationsComponent /></AdminRoute>
            ) : user?.role === 'area_coordinator' || user?.role === 'coordinator' ? (
              <ManagementRoute><NotificationsComponent /></ManagementRoute>
            ) : (
              <AgentRoute><NotificationsComponent /></AgentRoute>
            )
          } />
        )}

        {/* Agent Results - Agent only */}
        {AgentResultsComponent && <Route path="/agent-results" element={<AgentRoute><AgentResultsComponent /></AgentRoute>} />}

        {/* Agent Sales - Agent only */}
        {AgentSalesComponent && <Route path="/agent-sales" element={<AgentRoute><AgentSalesComponent /></AgentRoute>} />}

        {/* Agent Tickets - Management roles and Agent */}
        {AgentTicketsComponent && <Route path="/agent-tickets" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']}><AgentTicketsComponent /></ProtectedRoute>} />}

        {/* Winning Tickets - Management roles and Agent */}
        {WinningTicketsComponent && <Route path="/winning-tickets" element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']}><WinningTicketsComponent /></ProtectedRoute>} />}

        {/* Sales */}
        <Route path="/sales" element={<Sales />} />

        {/* Reports */}
        <Route path="/reports" element={<Reports />} />

        {/* Sales Reports */}
        {SalesReportsComponent && <Route path="/reports/sales" element={<ManagementRoute><SalesReportsComponent /></ManagementRoute>} />}

        {/* Notifications */}
        {NotificationsComponent && <Route path="/notifications" element={<NotificationsComponent />} />}

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
        {AuditDashboardComponent && <Route path="/admin/audit" element={<AdminRoute><AuditDashboardComponent /></AdminRoute>} />}

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

