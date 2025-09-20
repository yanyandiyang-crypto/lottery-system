const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteExtraOperators() {
  try {
    console.log('Scanning for operator accounts to remove (excluding ID 1)...');
    const operators = await prisma.user.findMany({
      where: { role: 'operator', id: { not: 1 } },
      select: { id: true, username: true }
    });

    if (operators.length === 0) {
      console.log('No extra operator accounts found. Nothing to delete.');
      return;
    }

    console.log(`Found ${operators.length} operator(s) to delete.`);

    for (const op of operators) {
      console.log(`Processing operator ID ${op.id} (${op.username})...`);
      await prisma.$transaction(async (tx) => {
        const userId = op.id;

        // Remove/de-associate dependent records where safe
        await tx.notification.deleteMany({ where: { userId } });
        await tx.drawResult.deleteMany({ where: { inputById: userId } });
        await tx.balanceTransaction.deleteMany({ where: { OR: [{ userId }, { processedById: userId }] } });
        await tx.userBalance.deleteMany({ where: { userId } });
        await tx.agentTicketTemplate.deleteMany({ where: { agentId: userId } });

        // Reassign tickets referencing this user to user ID 1 (assumed system admin)
        await tx.ticket.updateMany({ where: { agentId: userId }, data: { agentId: 1 } });
        await tx.ticket.updateMany({ where: { userId }, data: { userId: 1 } });

        // Sales/commissions cannot be reassigned meaningfully; remove
        await tx.sale.deleteMany({ where: { userId } });
        await tx.commission.deleteMany({ where: { userId } });

        // Null out optional relations
        await tx.ticketTemplate.updateMany({ where: { createdById: userId }, data: { createdById: null } });
        await tx.systemSetting.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
        await tx.user.updateMany({ where: { coordinatorId: userId }, data: { coordinatorId: null } });
        await tx.region.updateMany({ where: { areaCoordinatorId: userId }, data: { areaCoordinatorId: null } });

        // Finally delete the operator
        await tx.user.delete({ where: { id: userId } });
      });
      console.log(`Deleted operator ID ${op.id}`);
    }

    console.log('Done. All extra operator accounts have been removed.');
  } catch (error) {
    console.error('Failed to delete extra operators:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  deleteExtraOperators();
}

module.exports = deleteExtraOperators;


