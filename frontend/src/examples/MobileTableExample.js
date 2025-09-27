import React from 'react';
import MobileTable, { SimpleTable, DataTable } from '../components/UI/MobileTable';

/**
 * Example showing how to use the mobile-friendly table components
 * This demonstrates how to convert existing tables to mobile-friendly versions
 */

// Example 1: Using MobileTable for Users data
const UsersTableExample = () => {
  const usersData = [
    { id: 1, username: 'john_doe', email: 'john@example.com', role: 'agent', status: 'active', balance: 1500.50 },
    { id: 2, username: 'jane_smith', email: 'jane@example.com', role: 'coordinator', status: 'active', balance: 2300.75 },
    { id: 3, username: 'bob_wilson', email: 'bob@example.com', role: 'admin', status: 'inactive', balance: 0 }
  ];

  const usersColumns = [
    {
      header: 'Username',
      accessor: 'username',
      render: (value, row) => (
        <div className="font-semibold text-blue-600">{value}</div>
      )
    },
    {
      header: 'Email',
      accessor: 'email'
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'coordinator' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      header: 'Balance',
      accessor: 'balance',
      render: (value) => `₱${value.toLocaleString()}`
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Users Table (Mobile-Friendly)</h2>
      <MobileTable 
        data={usersData}
        columns={usersColumns}
        showSearch={true}
        searchPlaceholder="Search users..."
      />
    </div>
  );
};

// Example 2: Using SimpleTable for basic data
const SimpleTableExample = () => {
  const headers = ['Ticket #', 'Amount', 'Status', 'Date'];
  const rows = [
    ['T001', '₱150', 'Won', '2024-01-15'],
    ['T002', '₱200', 'Lost', '2024-01-15'],
    ['T003', '₱100', 'Pending', '2024-01-16']
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Simple Table Example</h2>
      <SimpleTable 
        headers={headers}
        rows={rows}
      />
    </div>
  );
};

// Example 3: Using DataTable with advanced features
const DataTableExample = () => {
  const salesData = [
    { id: 1, agent: 'John Doe', sales: 15000, tickets: 150, date: '2024-01-15', commission: 1500 },
    { id: 2, agent: 'Jane Smith', sales: 22000, tickets: 220, date: '2024-01-15', commission: 2200 },
    { id: 3, agent: 'Bob Wilson', sales: 8500, tickets: 85, date: '2024-01-15', commission: 850 }
  ];

  const salesColumns = [
    {
      header: 'Agent',
      accessor: 'agent',
      render: (value) => <div className="font-semibold">{value}</div>
    },
    {
      header: 'Sales',
      accessor: 'sales',
      render: (value) => <div className="font-bold text-green-600">₱{value.toLocaleString()}</div>
    },
    {
      header: 'Tickets',
      accessor: 'tickets'
    },
    {
      header: 'Commission',
      accessor: 'commission',
      render: (value) => `₱${value.toLocaleString()}`
    },
    {
      header: 'Date',
      accessor: 'date'
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Advanced Data Table</h2>
      <DataTable 
        data={salesData}
        columns={salesColumns}
        pageSize={5}
        showPagination={true}
        showSearch={true}
      />
    </div>
  );
};

// Example 4: Quick CSS-only solution for existing tables
const CSSOnlyTableExample = () => {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">CSS-Only Mobile Table Fix</h2>
      
      {/* Desktop Table */}
      <div className="table-desktop">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-3 py-4 text-sm text-gray-900">John Doe</td>
              <td className="px-3 py-4 text-sm text-gray-900">john@example.com</td>
              <td className="px-3 py-4 text-sm text-gray-900">Agent</td>
              <td className="px-3 py-4 text-sm text-gray-900">Active</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="table-mobile-cards">
        <div className="mobile-card-table">
          <div className="table-card">
            <div className="table-card-header">
              <div>
                <div className="table-card-title">John Doe</div>
                <div className="table-card-subtitle">john@example.com</div>
              </div>
            </div>
            <div className="table-card-body">
              <div className="table-card-row">
                <span className="table-card-label">Role:</span>
                <span className="table-card-value">Agent</span>
              </div>
              <div className="table-card-row">
                <span className="table-card-label">Status:</span>
                <span className="table-card-value">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main example component
const MobileTableExamples = () => {
  return (
    <div className="space-y-8">
      <UsersTableExample />
      <SimpleTableExample />
      <DataTableExample />
      <CSSOnlyTableExample />
    </div>
  );
};

export default MobileTableExamples;
