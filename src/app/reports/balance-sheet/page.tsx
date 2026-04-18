import { prisma } from "@/lib/db";
import { Scale, TrendingDown, TrendingUp, Printer } from "lucide-react";
import PrintClientButton from "./PrintClientButton";

export default async function BalanceSheetPage() {
  const accounts = await prisma.ledgerAccount.findMany({ orderBy: { name: "asc" } });
  const parties = await prisma.party.findMany();
  const products = await prisma.product.findMany();

  // 1. Inventory Valuation (Closing Stock)
  const closingStock = products.reduce((sum, p) => sum + (Number(p.stockQty) > 0 ? Number(p.stockQty) * Number(p.basePrice) : 0), 0);

  // 2. Identify and cluster Ledger Accounts
  type GroupedAccounts = Record<string, any[]>;
  const assetGroups: GroupedAccounts = { "Current Assets": [], "Fixed Assets": [], "Other Assets": [] };
  const liabilityGroups: GroupedAccounts = { "Capital Account": [], "Current Liabilities": [], "Long Term Liabilities": [] };
  
  let incomeTotal = 0;
  let expenseTotal = 0;

  for (const acc of accounts) {
    if (acc.type === "ASSET") {
      const g = acc.group || "Current Assets";
      if (!assetGroups[g]) assetGroups[g] = [];
      assetGroups[g].push(acc);
    } else if (acc.type === "LIABILITY" || acc.type === "EQUITY") {
      const g = acc.group || (acc.type === "EQUITY" ? "Capital Account" : "Current Liabilities");
      if (!liabilityGroups[g]) liabilityGroups[g] = [];
      liabilityGroups[g].push(acc);
    } else if (acc.type === "INCOME") {
      incomeTotal += Number(acc.currentBalance);
    } else if (acc.type === "EXPENSE") {
      expenseTotal += Number(acc.currentBalance);
    }
  }

  // 3. Sundry Debtors & Creditors
  let totalDebtors = 0;
  let totalCreditors = 0;
  for (const party of parties) {
    const bal = Number(party.currentBalance);
    if (bal > 0) totalDebtors += bal;
    else if (bal < 0) totalCreditors += Math.abs(bal);
  }

  // Inject Debtors into Current Assets
  if (totalDebtors !== 0) {
    assetGroups["Current Assets"].unshift({ id: "debtors", name: "Sundry Debtors (Receivables)", currentBalance: totalDebtors, isSystem: true });
  }
  
  // Inject Closing Stock into Current Assets
  if (closingStock !== 0) {
    assetGroups["Current Assets"].unshift({ id: "stock", name: "Closing Stock (Inventory)", currentBalance: closingStock, isSystem: true });
  }

  // Inject Creditors into Current Liabilities
  if (totalCreditors !== 0) {
    if (!liabilityGroups["Current Liabilities"]) liabilityGroups["Current Liabilities"] = [];
    liabilityGroups["Current Liabilities"].unshift({ id: "creditors", name: "Sundry Creditors (Payables)", currentBalance: Math.abs(totalCreditors), isSystem: true });
  }

  // 4. Net Profit / (Loss)
  const netProfit = (incomeTotal + closingStock) - expenseTotal;

  // Insert P&L into Liabilities if Profit, Assets if Loss
  if (netProfit > 0) {
    liabilityGroups["Capital Account"].push({ id: "pnl", name: "Net Profit (Current Year)", currentBalance: netProfit, isSystem: true, highlight: true });
  } else if (netProfit < 0) {
    liabilityGroups["Capital Account"].push({ id: "pnl", name: "Net Loss (Current Year)", currentBalance: netProfit, isSystem: true, highlight: true });
  }

  // Calculate Totals
  const sumGroup = (group: any[]) => group.reduce((sum, acc) => sum + Math.abs(Number(acc.currentBalance)), 0);
  
  const totalAssets = Object.values(assetGroups).reduce((total, group) => total + sumGroup(group), 0);
  
  let totalLiabilities = 0;
  Object.values(liabilityGroups).forEach(group => {
    group.forEach(acc => {
      if (acc.name === 'Net Loss (Current Year)') {
         totalLiabilities -= Math.abs(acc.currentBalance);
      } else {
         totalLiabilities += Math.abs(Number(acc.currentBalance));
      }
    });
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(n);

  return (
    <>
      <style>{`
        @media print {
          body, html { background: #fff !important; margin:0; padding:0; width:100%; color: #000 !important; }
          .no-print { display: none !important; }
          .print-area { width: 100% !important; max-width: none !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; background: #fff !important; }
          .print-split { display: flex !important; flex-direction: row !important; }
          .print-col { width: 50% !important; border: none !important; border-top: 1px solid #ccc !important; }
          .print-header { border-bottom: 2px solid #000 !important; margin-bottom: 20px !important; }
          .print-border-right { border-right: 1px solid #ccc !important; }
          .print-text-dark { color: #000 !important; }
          .print-text-muted { color: #555 !important; }
          .print-bg-header { background: #f2f2f2 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-footer { border-top: 2px solid #000 !important; border-bottom: 4px double #000 !important; }
        }
      `}</style>
      <div className="flex h-full flex-col bg-[#070910] text-slate-200">
        <header className="no-print sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/80 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale size={16} className="text-indigo-500" />
              Balance Sheet
            </h1>
            <p className="text-xs font-medium text-slate-500">As on {new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <PrintClientButton />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 print-area">
          <div className="mx-auto max-w-6xl bg-[#0c0e14] print:bg-white rounded-3xl shadow-2xl border border-slate-800/60 print:border-0 overflow-hidden print-area pb-12">
            
            <div className="hidden print:block print-header pt-12 pb-6 px-12 text-center print-text-dark">
              <h1 className="text-3xl font-black uppercase tracking-widest">Balance Sheet</h1>
              <p className="text-sm font-medium mt-2 uppercase tracking-widest">As on {new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>

            <div className="print-split flex flex-col lg:flex-row min-h-[600px] border-b border-slate-800/60 print:border-b-0">
              
              {/* LIABILITIES (INDIAN FORMAT: LEFT T-SHAPE) */}
              <div className="print-col flex-1 border-b lg:border-b-0 lg:border-r border-slate-800/60 print-border-right">
                <div className="px-8 py-6 bg-[#0a0c12] print-bg-header print:border-b print:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg text-rose-500 print:bg-transparent print-text-dark">
                      <TrendingDown size={18} />
                    </div>
                    <h2 className="text-lg font-black text-rose-100 print-text-dark uppercase tracking-widest">Liabilities & Capital</h2>
                  </div>
                </div>

                <div className="px-8 py-6 space-y-10">
                  {Object.entries(liabilityGroups).filter(([_, items]) => items.length > 0).map(([groupName, items]) => (
                    <div key={groupName}>
                      <h3 className="text-xs font-black uppercase text-indigo-400 print-text-muted mb-3 tracking-[0.2em] border-b border-slate-800 print:border-slate-300 pb-2">
                        {groupName}
                      </h3>
                      <div className="space-y-1">
                        {items.map((acc, i) => (
                          <div key={acc.id || i} className="flex justify-between items-center py-2 group hover:bg-[#13161f] print:hover:bg-transparent px-2 -mx-2 rounded-lg transition-colors">
                            <span className={`text-sm font-semibold ${acc.highlight ? 'text-emerald-400 print-text-dark' : 'text-slate-400 print-text-dark'}`}>
                              {acc.name}
                            </span>
                            <span className={`text-sm font-mono font-bold ${acc.highlight ? 'text-emerald-400 print-text-dark' : 'text-slate-200 print-text-dark'}`}>
                              {acc.name.includes("Loss") ? `(${fmt(Math.abs(Number(acc.currentBalance)))})` : fmt(Math.abs(Number(acc.currentBalance)))}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-2 pt-2 border-t border-dashed border-slate-800 print:border-slate-300">
                        <span className="text-sm font-mono font-black text-slate-500 print-text-dark">
                           {fmt(items.reduce((sum, acc) => acc.name.includes("Loss") ? sum - Math.abs(acc.currentBalance) : sum + Math.abs(Number(acc.currentBalance)), 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ASSETS (INDIAN FORMAT: RIGHT T-SHAPE) */}
              <div className="print-col flex-1">
                <div className="px-8 py-6 bg-[#0a0c12] print-bg-header print:border-b print:border-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 print:bg-transparent print-text-dark">
                      <TrendingUp size={18} />
                    </div>
                    <h2 className="text-lg font-black text-emerald-100 print-text-dark uppercase tracking-widest">Assets</h2>
                  </div>
                </div>

                <div className="px-8 py-6 space-y-10">
                  {Object.entries(assetGroups).filter(([_, items]) => items.length > 0).map(([groupName, items]) => (
                    <div key={groupName}>
                      <h3 className="text-xs font-black uppercase text-emerald-400 print-text-muted mb-3 tracking-[0.2em] border-b border-slate-800 print:border-slate-300 pb-2">
                        {groupName}
                      </h3>
                      <div className="space-y-1">
                        {items.map((acc, i) => (
                          <div key={acc.id || i} className="flex justify-between items-center py-2 group hover:bg-[#13161f] print:hover:bg-transparent px-2 -mx-2 rounded-lg transition-colors">
                            <span className="text-sm font-semibold text-slate-400 print-text-dark">
                              {acc.name}
                            </span>
                            <span className="text-sm font-mono font-bold text-slate-200 print-text-dark">
                              {fmt(Math.abs(Number(acc.currentBalance)))}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-2 pt-2 border-t border-dashed border-slate-800 print:border-slate-300">
                        <span className="text-sm font-mono font-black text-slate-500 print-text-dark">{fmt(sumGroup(items))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* TOTALS FOOTER */}
            <div className="print-split flex flex-col lg:flex-row w-full print-footer">
              <div className="print-col flex-1 p-8 border-b lg:border-b-0 lg:border-r border-slate-800/60 print-border-right flex justify-between items-center print:border-b-0">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-rose-500 print:text-slate-600">Total Liabilities</span>
                <span className="text-2xl font-black font-mono tracking-tight text-white print-text-dark relative">
                  {fmt(totalLiabilities)}
                </span>
              </div>
              <div className="print-col flex-1 p-8 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-emerald-500 print:text-slate-600">Total Assets</span>
                <span className="text-2xl font-black font-mono tracking-tight text-white print-text-dark relative">
                  {fmt(totalAssets)}
                </span>
              </div>
            </div>

          </div>
          
          {totalAssets !== totalLiabilities && (
            <div className="no-print mx-auto max-w-6xl mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-6 py-4 rounded-xl flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center font-black">!</div>
                <div>
                  <p className="font-bold">Balance Sheet Mismatch Detected</p>
                  <p className="text-xs mt-0.5 opacity-80">Check journal entries and opening balances for any unbalanced accounting data.</p>
                </div>
              </div>
              <p className="font-mono font-black text-lg">Diff: {fmt(Math.abs(totalAssets - totalLiabilities))}</p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
