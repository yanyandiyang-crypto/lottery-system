import React, { useEffect, useMemo, useState, useMemo as useReactMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import TemplateAssignerUtil from '../../utils/templateAssigner';
import TicketGenerator from '../../utils/ticketGenerator';

const TemplateAssignment = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('default'); // 'default' | 'umatik'
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canAssign = useMemo(() => user && user.role === 'superadmin', [user]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get('/users');
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const onlyAgents = list.filter(u => u.role === 'agent');
        setAgents(onlyAgents);
      } catch (e) {
        setError('Failed to load users');
        setAgents([]);
      } finally {
        setLoading(false);
      }
    };
    loadAgents();
  }, []);

  useEffect(() => {
    const loadAssignment = async () => {
      if (!selectedUserId) {
        setAssignment(null);
        return;
      }
      try {
        setError('');
        const res = await api.get(`/ticket-templates/user-assignment/${selectedUserId}`);
        setAssignment(res?.data?.data || null);
      } catch (e) {
        setError('Failed to load assignment');
        setAssignment(null);
      }
    };
    loadAssignment();
  }, [selectedUserId]);

  const assignDesign = async (ev) => {
    ev.preventDefault();
    setSuccess('');
    setError('');
    if (!selectedUserId) {
      setError('Select an agent');
      return;
    }
    try {
      setLoading(true);
      // Map our two options to existing backend design ids
      const templateDesign = selectedTemplateKey === 'umatik' ? 3 : 1;
      await api.post('/ticket-templates/assign-design', { userId: Number(selectedUserId), templateDesign });
      setSuccess('Template assigned successfully');
      const res = await api.get(`/ticket-templates/user-assignment/${selectedUserId}`);
      setAssignment(res?.data?.data || null);
    } catch (e) {
      setError(e?.response?.data?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  // Build a simple preview ticket using selected agent
  const previewHtml = useMemo(() => {
    const sampleTicket = {
      ticketNumber: '00000000000000001',
      totalAmount: 100,
      createdAt: new Date().toISOString(),
      draw: { drawDate: new Date().toISOString().slice(0,10), drawTime: 'fivePM' },
      drawId: 1,
      bets: [
        { betType: 'Straight', betCombination: '215', betAmount: 50 },
        { betType: 'Rambolito', betCombination: '512', betAmount: 50 }
      ]
    };
    const sampleUser = { username: agents.find(a => String(a.id) === String(selectedUserId))?.username || 'agent' };
    if (selectedTemplateKey === 'umatik') {
      const template = { design: { templateType: 'umatik', templateDesign: 3 } };
      return TicketGenerator.generateWithTemplate(sampleTicket, sampleUser, template);
    }
    return TicketGenerator.generateTicketHTML(sampleTicket, sampleUser);
  }, [selectedTemplateKey, selectedUserId, agents]);

  if (!canAssign) {
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold">Template Assignment</h2>
        <p className="text-sm text-gray-600 mt-2">Access denied. SuperAdmin only.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-3xl">
        <h2 className="text-xl font-bold mb-4">Template Assignment</h2>
        <p className="text-sm text-gray-600 mb-6">Assign a template design (1-5) to an agent.</p>

        <form onSubmit={assignDesign} className="space-y-4 bg-white shadow rounded-lg p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agent</label>
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loading}
            >
              <option value="">Select agent…</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.fullName || a.username} (ID {a.id})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <div className="mt-1 flex gap-3">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="template"
                  className="text-blue-600"
                  value="default"
                  checked={selectedTemplateKey === 'default'}
                  onChange={() => setSelectedTemplateKey('default')}
                  disabled={loading}
                />
                Default
              </label>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="template"
                  className="text-blue-600"
                  value="umatik"
                  checked={selectedTemplateKey === 'umatik'}
                  onChange={() => setSelectedTemplateKey('umatik')}
                  disabled={loading}
                />
                Umatik
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !selectedUserId}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${loading || !selectedUserId ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'}`}
            >
              {loading ? 'Assigning…' : 'Assign Template'}
            </button>
            {success && <span className="text-green-600 text-sm">{success}</span>}
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>
        </form>

        {/* Live Preview */}
        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Preview</h3>
          <div className="overflow-auto border rounded-md">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>

        <div className="mt-6 bg-white shadow rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3">Current Assignment</h3>
          {!selectedUserId && <p className="text-sm text-gray-500">Select an agent to view assignment.</p>}
          {selectedUserId && !assignment && <p className="text-sm text-gray-500">No assignment found.</p>}
          {assignment && (
            <div className="text-sm text-gray-700">
              <div>Template: <span className="font-medium">{assignment?.template?.name || '—'}</span></div>
              <div>Design: <span className="font-medium">{assignment?.template?.design?.templateDesign ?? '—'}</span></div>
              <div>Assigned At: <span className="font-medium">{assignment?.assignment?.assignedAt ? new Date(assignment.assignment.assignedAt).toLocaleString() : '—'}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateAssignment;


