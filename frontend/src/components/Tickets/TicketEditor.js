import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon, PencilIcon } from '@heroicons/react/24/outline';

const TicketEditor = ({ ticket, user, template, onSave, onCancel, isOpen }) => {
  const [editedTicket, setEditedTicket] = useState(ticket);
  const [editedUser, setEditedUser] = useState(user);
  const [customMessage, setCustomMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (ticket) {
      setEditedTicket(ticket);
    }
  }, [ticket]);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  const handleTicketChange = (field, value) => {
    setEditedTicket(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBetChange = (betIndex, field, value) => {
    setEditedTicket(prev => ({
      ...prev,
      bets: prev.bets.map((bet, index) => 
        index === betIndex ? { ...bet, [field]: value } : bet
      )
    }));
  };

  const handleUserChange = (field, value) => {
    setEditedUser(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const editedData = {
      ticket: editedTicket,
      user: editedUser,
      customMessage: customMessage.trim()
    };
    onSave(editedData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <PencilIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Edit Ticket for Sharing</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Editor Panel */}
          <div className="w-1/2 p-4 overflow-y-auto border-r">
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Ticket Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ticket Number
                    </label>
                    <input
                      type="text"
                      value={editedTicket.ticketNumber || ''}
                      onChange={(e) => handleTicketChange('ticketNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Draw Time
                    </label>
                    <select
                      value={editedTicket.draw?.drawTime || ''}
                      onChange={(e) => handleTicketChange('draw', { ...editedTicket.draw, drawTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="14:00">2:00 PM</option>
                      <option value="17:00">5:00 PM</option>
                      <option value="21:00">9:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Draw Date
                    </label>
                    <input
                      type="date"
                      value={editedTicket.draw?.drawDate || ''}
                      onChange={(e) => handleTicketChange('draw', { ...editedTicket.draw, drawDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editedTicket.totalAmount || ''}
                      onChange={(e) => handleTicketChange('totalAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bet Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Bet Information</h3>
                
                <div className="space-y-3">
                  {editedTicket.bets?.map((bet, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">
                          Bet {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Bet Type
                          </label>
                          <select
                            value={bet.betType || ''}
                            onChange={(e) => handleBetChange(index, 'betType', e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="standard">Standard</option>
                            <option value="rambolito">Rambolito</option>
                            <option value="straight">Straight</option>
                            <option value="boxed">Boxed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Bet Combination
                          </label>
                          <input
                            type="text"
                            maxLength="3"
                            value={bet.betCombination || ''}
                            onChange={(e) => handleBetChange(index, 'betCombination', e.target.value.replace(/\D/g, '').slice(0, 3))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="123"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Bet Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={bet.betAmount || ''}
                            onChange={(e) => handleBetChange(index, 'betAmount', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Agent Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={editedUser.fullName || ''}
                      onChange={(e) => handleUserChange('fullName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editedUser.username || ''}
                      onChange={(e) => handleUserChange('username', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Message */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">Custom Share Message</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personal Message (Optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal message for sharing..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="w-1/2 p-4 overflow-y-auto bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Preview</h3>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {showPreview && (
              <div className="space-y-4">
                {/* Ticket Preview */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Ticket Preview</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Ticket:</strong> #{editedTicket.ticketNumber}</p>
                    <p><strong>Draw:</strong> {editedTicket.draw?.drawTime || 'No Time'} - {editedTicket.draw?.drawDate || 'No Date'}</p>
                    <p><strong>Total:</strong> ₱{parseFloat(editedTicket.totalAmount || 0).toFixed(2)}</p>
                    <p><strong>Agent:</strong> {editedUser.fullName || editedUser.username}</p>
                  </div>
                </div>

                {/* Share Message Preview */}
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Share Message Preview</h4>
                  <div className="text-sm bg-gray-100 p-3 rounded">
                    <p>🎲 NEWBETTING - Ticket #{editedTicket.ticketNumber}</p>
                    <p>Check out my lottery ticket!</p>
                    <p>Draw: {editedTicket.draw?.drawTime || 'No Time'}</p>
                    <p>Total: ₱{parseFloat(editedTicket.totalAmount || 0).toFixed(2)}</p>
                    {customMessage && <p className="mt-2 italic">"{customMessage}"</p>}
                    <p className="mt-2">Good luck! 🍀</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <CheckIcon className="h-4 w-4" />
            <span>Save & Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TicketEditor;
