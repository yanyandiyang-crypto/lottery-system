import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  PlusIcon,
  EyeIcon,
  TrashIcon,
  TicketIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const MobilePOSTemplates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [templateAssignments, setTemplateAssignments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    design: {
      headerText: 'NEWBETTING POS',
      footerText: 'GOOD LUCK! 🍀',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      templateType: 'mobile-pos'
    }
  });

  // Simplified dynamic fields for mobile POS
  const mobilePOSFields = [
    { id: 'ticketNumber', label: 'Ticket Number', sample: '12345678901234567' },
    { id: 'drawTime', label: 'Draw Time', sample: '14:00' },
    { id: 'drawDate', label: 'Draw Date', sample: '2025/09/16 Tue' },
    { id: 'allBets', label: 'All Bets', sample: 'Standard 1 2 3 - ₱10.00\nRambolito 4 5 6 - ₱20.00' },
    { id: 'totalBet', label: 'Total Amount', sample: '₱30.00' },
    { id: 'agentName', label: 'Agent Name', sample: 'Juan Dela Cruz' },
    { id: 'qrCode', label: 'QR Code', sample: 'QR_CODE_PLACEHOLDER' },
    { id: 'timestamp', label: 'Timestamp', sample: '2025/09/16 14:00' }
  ];

  useEffect(() => {
    fetchTemplates();
    fetchUsers();
    fetchTemplateAssignments();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ticket-templates');
      // Filter for mobile POS templates only
      const mobilePOSTemplates = response.data.data?.filter(
        template => template.design?.templateType === 'mobile-pos'
      ) || [];
      setTemplates(mobilePOSTemplates);
    } catch (err) {
      setError('Failed to fetch mobile POS templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchTemplateAssignments = async () => {
    try {
      const response = await api.get('/ticket-templates/assignments');
      setTemplateAssignments(response.data.data || []);
    } catch (err) {
      console.error('Error fetching template assignments:', err);
    }
  };

  const createMobilePOSTemplate = () => {
    const mobilePOSElements = [
      // Header for Mobile POS (58mm width optimized)
      {
        id: 'pos-header',
        type: 'text',
        content: '🖨️ NEWBETTING POS',
        x: 110,
        y: 8,
        width: 220,
        height: 12,
        style: {
          fontSize: '11px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      },
      {
        id: 'pos-title',
        type: 'text',
        content: '3D LOTTO TICKET',
        x: 110,
        y: 25,
        width: 220,
        height: 12,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      },
      {
        id: 'pos-separator',
        type: 'text',
        content: '================================',
        x: 110,
        y: 40,
        width: 220,
        height: 8,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000',
          textAlign: 'center'
        }
      },
      {
        id: 'pos-ticket-number',
        type: 'dynamic',
        fieldId: 'ticketNumber',
        content: 'TICKET: 12345678901234567',
        x: 10,
        y: 55,
        width: 200,
        height: 10,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold'
        }
      },
      {
        id: 'pos-draw-info',
        type: 'text',
        content: 'DRAW INFO:',
        x: 10,
        y: 70,
        width: 200,
        height: 8,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold'
        }
      },
      {
        id: 'pos-draw-details',
        type: 'dynamic',
        fieldId: 'drawDate',
        content: '2025/09/16 Tue 14:00',
        x: 10,
        y: 82,
        width: 200,
        height: 10,
        style: {
          fontSize: '9px',
          fontFamily: 'Courier New',
          color: '#000000'
        }
      },
      {
        id: 'pos-bets-header',
        type: 'text',
        content: 'YOUR BETS:',
        x: 10,
        y: 100,
        width: 200,
        height: 8,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold'
        }
      },
      {
        id: 'pos-bets-detail',
        type: 'dynamic',
        fieldId: 'allBets',
        content: 'Standard 1 2 3 - ₱10.00\nRambolito 4 5 6 - ₱20.00',
        x: 10,
        y: 112,
        width: 200,
        height: 40,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000'
        }
      },
      {
        id: 'pos-total-separator',
        type: 'text',
        content: '--------------------------------',
        x: 110,
        y: 160,
        width: 220,
        height: 8,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000',
          textAlign: 'center'
        }
      },
      {
        id: 'pos-total',
        type: 'dynamic',
        fieldId: 'totalBet',
        content: 'TOTAL: ₱30.00',
        x: 110,
        y: 175,
        width: 220,
        height: 12,
        style: {
          fontSize: '12px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      },
      {
        id: 'pos-agent',
        type: 'dynamic',
        fieldId: 'agentName',
        content: 'AGENT: Juan Dela Cruz',
        x: 10,
        y: 195,
        width: 200,
        height: 10,
        style: {
          fontSize: '8px',
          fontFamily: 'Courier New',
          color: '#000000'
        }
      },
      {
        id: 'pos-qr-placeholder',
        type: 'text',
        content: '[QR CODE HERE]',
        x: 110,
        y: 215,
        width: 220,
        height: 20,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#000000',
          textAlign: 'center',
          border: '1px solid #000000'
        }
      },
      {
        id: 'pos-footer',
        type: 'text',
        content: 'GOOD LUCK! 🍀',
        x: 110,
        y: 245,
        width: 220,
        height: 10,
        style: {
          fontSize: '10px',
          fontFamily: 'Courier New',
          color: '#000000',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      },
      {
        id: 'pos-timestamp',
        type: 'dynamic',
        fieldId: 'timestamp',
        content: '2025/09/16 14:00',
        x: 110,
        y: 260,
        width: 220,
        height: 8,
        style: {
          fontSize: '7px',
          fontFamily: 'Courier New',
          color: '#666666',
          textAlign: 'center'
        }
      }
    ];

    setFormData({
      name: 'Mobile POS Template',
      design: {
        elements: mobilePOSElements,
        canvasSize: { width: 220, height: 280 },
        backgroundColor: '#ffffff',
        templateType: 'mobile-pos'
      }
    });
    setShowCreateModal(true);
  };

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ticket-templates', formData);
      setShowCreateModal(false);
      setFormData({
        name: '',
        design: {
          headerText: 'NEWBETTING POS',
          footerText: 'GOOD LUCK! 🍀',
          backgroundColor: '#ffffff',
          textColor: '#000000',
          templateType: 'mobile-pos'
        }
      });
      fetchTemplates();
    } catch (err) {
      setError('Failed to create mobile POS template');
      console.error('Error creating template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this mobile POS template?')) {
      try {
        await api.delete(`/ticket-templates/${templateId}`);
        fetchTemplates();
      } catch (err) {
        setError('Failed to delete template');
        console.error('Error deleting template:', err);
      }
    }
  };

  const toggleActiveTemplate = async (templateId) => {
    try {
      await api.put(`/ticket-templates/${templateId}/toggle-active`);
      fetchTemplates();
    } catch (err) {
      setError('Failed to update template status');
      console.error('Error toggling template status:', err);
    }
  };

  const openPreviewModal = (template) => {
    setSelectedTemplate(template);
    setShowPreviewModal(true);
  };

  const handleAssignTemplate = async (userId, templateId) => {
    try {
      await api.post('/ticket-templates/assign', {
        userId,
        templateId
      });
      fetchTemplateAssignments();
    } catch (err) {
      setError('Failed to assign template');
      console.error('Error assigning template:', err);
    }
  };

  const handleUnassignTemplate = async (assignmentId) => {
    try {
      await api.delete(`/ticket-templates/assignments/${assignmentId}`);
      fetchTemplateAssignments();
    } catch (err) {
      setError('Failed to unassign template');
      console.error('Error unassigning template:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mobile POS Templates</h1>
          <p className="text-gray-600 mt-1">Manage 58mm thermal printer templates</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user?.role === 'superadmin' && (
            <>
              <button
                onClick={createMobilePOSTemplate}
                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center text-sm"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                New POS Template
              </button>
            </>
          )}
          {(user?.role === 'superadmin' || user?.role === 'admin') && (
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 flex items-center text-sm"
            >
              <UserGroupIcon className="h-4 w-4 mr-1" />
              Assignments
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Mobile POS Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <div key={template.id} className="bg-white shadow rounded-lg p-4 border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{template.name}</h3>
                <p className="text-sm text-gray-500">
                  {template.isActive ? (
                    <span className="text-green-600 font-medium">● Active</span>
                  ) : (
                    <span className="text-gray-400">○ Inactive</span>
                  )}
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    📱 Mobile POS
                  </span>
                </p>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => openPreviewModal(template)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Preview"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => toggleActiveTemplate(template.id)}
                  className={`p-1 ${template.isActive ? 'text-green-500 hover:text-green-700' : 'text-gray-400 hover:text-gray-600'}`}
                  title={template.isActive ? 'Deactivate' : 'Activate'}
                >
                  <TicketIcon className="h-4 w-4" />
                </button>
                {user?.role === 'superadmin' && (
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Mobile POS Preview */}
            <div className="border rounded p-2 bg-gray-50 font-mono text-xs">
              <div className="text-center font-bold">🖨️ NEWBETTING POS</div>
              <div className="text-center font-bold">3D LOTTO TICKET</div>
              <div className="text-center">========================</div>
              <div>TICKET: 12345678901234567</div>
              <div className="mt-1">DRAW: 2025/09/16 Tue 14:00</div>
              <div className="mt-1">YOUR BETS:</div>
              <div>Standard 1 2 3 - ₱10.00</div>
              <div>Rambolito 4 5 6 - ₱20.00</div>
              <div className="text-center mt-1">------------------------</div>
              <div className="text-center font-bold">TOTAL: ₱30.00</div>
              <div className="mt-1">AGENT: Juan Dela Cruz</div>
              <div className="text-center mt-1 border border-dashed p-1">[QR CODE]</div>
              <div className="text-center font-bold">GOOD LUCK! 🍀</div>
            </div>
          </div>
        ))}
        
        {templates.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            <TicketIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No mobile POS templates found</p>
            {user?.role === 'superadmin' && (
              <button
                onClick={createMobilePOSTemplate}
                className="mt-2 text-green-600 hover:text-green-700 font-medium"
              >
                Create your first mobile POS template
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Mobile POS Template</h3>
              <form onSubmit={handleCreateTemplate}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., Standard Mobile POS"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Text
                  </label>
                  <input
                    type="text"
                    value={formData.design.headerText || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      design: {...formData.design, headerText: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="NEWBETTING POS"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Footer Text
                  </label>
                  <input
                    type="text"
                    value={formData.design.footerText || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      design: {...formData.design, footerText: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="GOOD LUCK! 🍀"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-80 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mobile POS Preview</h3>
              <div className="border rounded p-3 bg-white font-mono text-xs leading-tight">
                <div className="text-center font-bold">🖨️ NEWBETTING POS</div>
                <div className="text-center font-bold">3D LOTTO TICKET</div>
                <div className="text-center">================================</div>
                <div>TICKET: 12345678901234567</div>
                <div className="mt-1">DRAW INFO:</div>
                <div>2025/09/16 Tue 14:00</div>
                <div className="mt-1">YOUR BETS:</div>
                <div>Standard 1 2 3 - ₱10.00</div>
                <div>Rambolito 4 5 6 - ₱20.00</div>
                <div className="text-center mt-1">--------------------------------</div>
                <div className="text-center font-bold text-sm">TOTAL: ₱30.00</div>
                <div className="mt-1">AGENT: Juan Dela Cruz</div>
                <div className="text-center mt-2 border border-dashed p-2">[QR CODE HERE]</div>
                <div className="text-center font-bold mt-1">GOOD LUCK! 🍀</div>
                <div className="text-center text-gray-500 mt-1">2025/09/16 14:00</div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Mobile POS Template Assignments</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Available Agents */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-4">Available Agents</h4>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {users.filter(u => u.role === 'agent').map(user => (
                      <div key={user.id} className="p-3 border-b border-gray-200 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{user.fullName}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                        <select
                          onChange={(e) => e.target.value && handleAssignTemplate(user.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1"
                          defaultValue=""
                        >
                          <option value="">Assign...</option>
                          {templates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Current Assignments */}
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-4">Current Assignments</h4>
                  <div className="border rounded-lg max-h-64 overflow-y-auto">
                    {templateAssignments
                      .filter(assignment => {
                        const template = templates.find(t => t.id === assignment.templateId);
                        return template?.design?.templateType === 'mobile-pos';
                      })
                      .map(assignment => {
                        const assignedUser = users.find(u => u.id === assignment.agentId);
                        const assignedTemplate = templates.find(t => t.id === assignment.templateId);
                        return (
                          <div key={assignment.id} className="p-3 border-b border-gray-200 flex justify-between items-center">
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{assignedUser?.fullName}</div>
                              <div className="text-xs text-gray-500">{assignedTemplate?.name}</div>
                            </div>
                            <button
                              onClick={() => handleUnassignTemplate(assignment.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    {templateAssignments.filter(assignment => {
                      const template = templates.find(t => t.id === assignment.templateId);
                      return template?.design?.templateType === 'mobile-pos';
                    }).length === 0 && (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No mobile POS template assignments yet
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePOSTemplates;