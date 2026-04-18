const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fixing ledger_accounts duplicates...");
  const accounts = await prisma.ledgerAccount.findMany({ orderBy: { id: 'asc' } });
  const accMap = new Map();
  for (const acc of accounts) {
    const key = acc.name.toLowerCase().trim();
    if (accMap.has(key)) {
      console.log(`Merging duplicate LedgerAccount: ${acc.name} (ID: ${acc.id}) into ${accMap.get(key)}`);
      const orig = accMap.get(key);
      await prisma.journalEntry.updateMany({
        where: { accountId: acc.id },
        data: { accountId: orig }
      });
      await prisma.invoice.updateMany({
        where: { ledgerAccountId: acc.id },
        data: { ledgerAccountId: orig }
      });
      await prisma.payment.updateMany({
        where: { ledgerAccountId: acc.id },
        data: { ledgerAccountId: orig }
      });
      await prisma.ledgerAccount.delete({ where: { id: acc.id } });
    } else {
      accMap.set(key, acc.id);
    }
  }

  console.log("Fixing parties duplicates...");
  const parties = await prisma.party.findMany({ orderBy: { id: 'asc' } });
  const partyMap = new Map();
  for (const party of parties) {
    const key = `${party.name.toLowerCase().trim()}_${party.phone || ''}`;
    if (partyMap.has(key)) {
      console.log(`Merging duplicate Party: ${party.name} (ID: ${party.id}) into ${partyMap.get(key)}`);
      const orig = partyMap.get(key);
      await prisma.invoice.updateMany({
         where: { partyId: party.id },
         data: { partyId: orig }
      });
      await prisma.party.delete({ where: { id: party.id } });
    } else {
      partyMap.set(key, party.id);
    }
  }
  
  console.log("Duplicate cleanup complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
