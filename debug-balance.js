const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBalance() {
  try {
    // Find area coordinator
    const user = await prisma.user.findFirst({ 
      where: { role: 'area_coordinator' } 
    });
    
    if (!user) {
      console.log('No area coordinator found');
      return;
    }
    
    console.log('Area coordinator:', { id: user.id, username: user.username });
    
    // Check balance record
    const balance = await prisma.userBalance.findUnique({ 
      where: { userId: user.id } 
    });
    
    console.log('Balance record:', balance);
    
    // Check recent transactions
    const transactions = await prisma.balanceTransaction.findMany({ 
      where: { userId: user.id }, 
      orderBy: { createdAt: 'desc' }, 
      take: 5 
    });
    
    console.log('Recent transactions:');
    transactions.forEach(t => {
      console.log(`- ${t.transactionType}: ${t.amount} - ${t.description} (${t.createdAt})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBalance();
