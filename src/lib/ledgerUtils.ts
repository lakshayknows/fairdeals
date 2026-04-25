import { PrismaClient } from "@prisma/client";

export async function getStandardAccount(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  name: string,
  type: string,
  group: string
) {
  let acc = await tx.ledgerAccount.findUnique({ where: { name } });
  if (!acc) {
    acc = await tx.ledgerAccount.create({
      data: { name, type, group, currentBalance: 0 }
    });
  }
  return acc;
}

export async function postJournalEntry(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: {
    date: Date;
    accountId: number;
    amount: number;
    type: "DEBIT" | "CREDIT";
    referenceType?: string;
    referenceId?: number;
    description?: string;
    financialYear: string;
  }
) {
  // Create Journal Entry
  await tx.journalEntry.create({
    data: {
      date: params.date,
      accountId: params.accountId,
      amount: params.amount,
      type: params.type,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      description: params.description,
      financialYear: params.financialYear,
    }
  });

  // Update Ledger Account Balance
  const account = await tx.ledgerAccount.findUnique({ where: { id: params.accountId } });
  if (account) {
    let incrementAmount = 0;
    if (["ASSET", "EXPENSE"].includes(account.type)) {
      incrementAmount = params.type === "DEBIT" ? params.amount : -params.amount;
    } else {
      incrementAmount = params.type === "CREDIT" ? params.amount : -params.amount;
    }

    if (incrementAmount !== 0) {
      await tx.ledgerAccount.update({
        where: { id: params.accountId },
        data: { currentBalance: { increment: incrementAmount } }
      });
    }
  }
}
