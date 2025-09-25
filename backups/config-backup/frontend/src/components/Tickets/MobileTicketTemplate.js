import React from 'react';
import QRCode from 'qrcode.react';
import MobileTicketUtils from '../../utils/mobileTicketUtils';

const MobileTicketTemplate = ({ ticket, user, onShare, onPrint }) => {
  const handleDebugShare = () => {
    MobileTicketUtils.debugWebShareSupport();
  };

  const handleShareClick = async () => {
    if (onShare) {
      await onShare();
    } else {
      // Fallback to direct sharing
      try {
        const result = await MobileTicketUtils.shareTicket(ticket, user);
        if (result.success) {
          console.log('Ticket shared successfully:', result.method);
        } else {
          console.error('Failed to share ticket:', result.error);
        }
      } catch (error) {
        console.error('Error sharing ticket:', error);
      }
    }
  };
  const formatDrawTimeForTicket = (drawTime) => {
    if (!drawTime) return 'No Time';
    const timeMap = {
      '14:00': '2:00 PM',
      '17:00': '5:00 PM', 
      '21:00': '9:00 PM'
    };
    return timeMap[drawTime] || drawTime;
  };

  const formatCurrency = (amount) => {
    return `₱${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA') + ' ' + date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const bets = ticket.bets || [];
  const firstBet = bets[0] || {};

  return (
    <div className="mobile-ticket-container">
      {/* Mobile Ticket Template - Optimized for 58mm Thermal Printers */}
      <div className="mobile-ticket" id="mobile-ticket">
        {/* Header */}
        <div className="ticket-header">
          <div className="logo">🎲 NEWBETTING</div>
          <div className="ticket-title">3D LOTTO TICKET</div>
          <div className="ticket-number">#{ticket.ticketNumber}</div>
        </div>

        {/* Draw Information */}
        <div className="draw-info">
          <div className="draw-time">
            {formatDrawTimeForTicket(ticket.draw?.drawTime)}
          </div>
          <div className="draw-date">
            {formatDate(ticket.draw?.drawDate)}
          </div>
        </div>

        {/* Bet Information */}
        <div className="bet-info">
          {bets.map((bet, index) => {
            const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
            const sequence = String.fromCharCode(65 + index); // A, B, C, etc.
            
            return (
              <div key={index} className="bet-item">
                <div className="bet-type">{betType}</div>
                <div className="bet-combination">
                  {bet.betCombination.split('').join('   ')}
                </div>
                <div className="bet-sequence">
                  {sequence} - {formatCurrency(bet.betAmount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Amount */}
        <div className="total-section">
          <div className="total-label">TOTAL AMOUNT</div>
          <div className="total-amount">{formatCurrency(ticket.totalAmount)}</div>
        </div>

        {/* Agent Information */}
        <div className="agent-info">
          <div className="agent-label">AGENT</div>
          <div className="agent-name">{user.fullName || user.username}</div>
        </div>

        {/* QR Code */}
        <div className="qr-section">
          <QRCode 
            value={ticket.qrCode || ticket.ticketNumber}
            size={80}
            level="M"
            renderAs="svg"
          />
        </div>

        {/* Footer */}
        <div className="ticket-footer">
          <div className="timestamp">
            {new Date(ticket.createdAt).toLocaleString()}
          </div>
          <div className="good-luck">GOOD LUCK! 🍀</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="ticket-actions">
        <button 
          onClick={handleShareClick}
          className="action-btn share-btn"
        >
          📱 Share Ticket
        </button>
        <button 
          onClick={onPrint}
          className="action-btn print-btn"
        >
          🖨️ Print Ticket
        </button>
        <button 
          onClick={handleDebugShare}
          className="action-btn debug-btn"
        >
          🔧 Debug Share
        </button>
      </div>

      {/* CSS Styles for Mobile Ticket */}
      <style jsx>{`
        .mobile-ticket-container {
          max-width: 100%;
          margin: 0 auto;
          padding: 10px;
          background: #f8f9fa;
        }

        .mobile-ticket {
          width: 100%;
          max-width: 58mm; /* 58mm thermal printer width */
          min-width: 200px;
          background: white;
          border: 2px solid #000;
          padding: 8px;
          font-family: 'Courier New', monospace;
          font-size: 10px;
          line-height: 1.2;
          margin: 0 auto;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .ticket-header {
          text-align: center;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
          margin-bottom: 4px;
        }

        .logo {
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 2px;
        }

        .ticket-title {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 2px;
        }

        .ticket-number {
          font-size: 9px;
          font-weight: bold;
        }

        .draw-info {
          text-align: center;
          margin: 4px 0;
          padding: 2px 0;
          border-bottom: 1px dashed #666;
        }

        .draw-time {
          font-weight: bold;
          font-size: 11px;
        }

        .draw-date {
          font-size: 9px;
          color: #666;
        }

        .bet-info {
          margin: 4px 0;
        }

        .bet-item {
          margin: 3px 0;
          padding: 2px 0;
          border-bottom: 1px dotted #ccc;
        }

        .bet-type {
          font-weight: bold;
          font-size: 10px;
        }

        .bet-combination {
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 2px;
          text-align: center;
          margin: 2px 0;
        }

        .bet-sequence {
          font-size: 9px;
          text-align: right;
        }

        .total-section {
          text-align: center;
          margin: 6px 0;
          padding: 4px 0;
          border-top: 2px solid #000;
          border-bottom: 2px solid #000;
        }

        .total-label {
          font-size: 9px;
          font-weight: bold;
        }

        .total-amount {
          font-size: 14px;
          font-weight: bold;
        }

        .agent-info {
          text-align: center;
          margin: 4px 0;
          padding: 2px 0;
        }

        .agent-label {
          font-size: 8px;
          color: #666;
        }

        .agent-name {
          font-size: 10px;
          font-weight: bold;
        }

        .qr-section {
          text-align: center;
          margin: 6px 0;
          padding: 4px 0;
        }

        .ticket-footer {
          text-align: center;
          border-top: 1px solid #000;
          padding-top: 4px;
          margin-top: 4px;
        }

        .timestamp {
          font-size: 8px;
          color: #666;
          margin-bottom: 2px;
        }

        .good-luck {
          font-size: 10px;
          font-weight: bold;
        }

        .ticket-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
          justify-content: center;
        }

        .action-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .share-btn {
          background: #3b82f6;
          color: white;
        }

        .share-btn:hover {
          background: #2563eb;
          transform: translateY(-2px);
        }

        .print-btn {
          background: #10b981;
          color: white;
        }

        .print-btn:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .debug-btn {
          background: #f59e0b;
          color: white;
        }

        .debug-btn:hover {
          background: #d97706;
          transform: translateY(-2px);
        }

        /* Print Styles */
        @media print {
          .ticket-actions {
            display: none;
          }
          
          .mobile-ticket-container {
            background: white;
            padding: 0;
          }
          
          .mobile-ticket {
            box-shadow: none;
            border: 1px solid #000;
          }
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .mobile-ticket {
            max-width: 100%;
            min-width: 180px;
          }
          
          .ticket-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .action-btn {
            width: 100%;
            max-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileTicketTemplate;
