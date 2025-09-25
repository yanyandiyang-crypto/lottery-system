let io;

const initSocket = (socketInstance) => {
  io = socketInstance;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

const emitBalanceUpdate = (userId, balanceData) => {
  if (io) {
    // Emit to specific user
    io.to(`user-${userId}`).emit('balance-updated', {
      userId,
      currentBalance: balanceData.currentBalance,
      totalLoaded: balanceData.totalLoaded,
      updatedAt: new Date()
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitBalanceUpdate
};
