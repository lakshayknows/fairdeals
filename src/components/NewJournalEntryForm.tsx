"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ChevronLeft, Plus, Trash2, Loader2, RefreshCcw } from "lucide-react";

interface LedgerAccount {
  id: number;
  name: string;
  type: string;
}

interface JVRow {
  _key: string;
  accountId: number;
  type: "DEBIT" | "CREDIT";
  amount: string;
  narration: string;
}

const emptyRow = (): JVRow => ({
  _key: crypto.randomUUID(),
  accountId: 0,
  type: "DEBIT",
  amount: "",
  narration: "",
});

export default function NewJournalEntryForm() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [reverseItc, setReverseItc] = useState(false);
  
  const [rows, setRows] = useState<JVRow[]>([
    { ...emptyRow(), type: "DEBIT" },
    { ...emptyRow(), type: "CREDIT" }
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ledger")
      .then(r => r.json())
      .then(setAccounts)
      .catch(e => console.error("Failed to load accounts", e));
  }, []);

  const totalDebit = rows.filter(r => r.type === "DEBIT").reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const totalCredit = rows.filter(r => r.type === "CREDIT").reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const updateRow = (key: string, patch: Partial<JVRow>) => {
    setRows(prev => prev.map(r => r._key === key ? { ...r, ...patch } : r));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) { setError("Journal Entry description is required"); return; }
    if (!isBalanced) { setError("Debits must equal Credits"); return; }
    if (totalDebit === 0) { setError("Amounts must be greater than zero"); return; }
    
    // Validate rows
    for (const r of rows) {
      if (!r.accountId) { setError("Please select an account for all rows"); return; }
      if ((parseFloat(r.amount) || 0) <= 0) { setError("Amount must be greater than zero for all rows"); return; }
    }

    setSaving(true);
    setError(null);

    const financialYear = typeof window !== "undefined" ? localStorage.getItem("financial-year") || "2024-25" : "2024-25";

    // Auto-inject ITC Reversal logically if checked
    const entriesToSave = rows.map(r => ({
      accountId: r.accountId,
      amount: parseFloat(r.amount),
      type: r.type,
      narration: r.narration
    }));

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          description,
          financialYear,
          entries: entriesToSave,
          referenceType: "MANUAL_JV",
          reverseItc
        }),
      });

      if (res.ok) {
        router.push("/journal");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save journal entry");
      }
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#070910] text-slate-200">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="rounded-lg px-2 py-1 flex items-center gap-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <ChevronLeft size={16} /> Back
          </button>
          <h1 className="text-sm font-bold text-white">New Journal Entry</h1>
        </div>
        <div className="flex items-center gap-3">
          {error && <span className="text-xs text-red-400 max-w-sm truncate">{error}</span>}
          <button onClick={handleSave} disabled={saving || !isBalanced || totalDebit === 0} className="px-4 py-2 rounded-lg bg-indigo-600 font-bold text-xs hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-lg flex items-center gap-2">
            {saving && <Loader2 size={12} className="animate-spin" />}
            <Save size={14} /> Save Entry
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <form className="max-w-4xl w-full space-y-6">
          <div className="bg-[#0b0e14] border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider">General Details (JV Header)</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-[#11141d] border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
              </div>
              <div className="space-y-1.5 flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-300 font-medium cursor-pointer p-2 border border-slate-800/60 rounded-lg bg-[#11141d] w-full">
                  <input type="checkbox" checked={reverseItc} onChange={e => setReverseItc(e.target.checked)} className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-indigo-500" />
                  <RefreshCcw size={14} className="text-amber-500" />
                  Flag for ITC Reversal (Section 17)(5)
                </label>
              </div>
              <div className="col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description (Main Narration) *</label>
                <input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Owner Drawings for personal use" required className="w-full bg-[#11141d] border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-[#0b0e14] border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Line Entries</h2>
              <div className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${isBalanced ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                Diff: ₹{(Math.abs(totalDebit - totalCredit)).toFixed(2)}
              </div>
            </div>

            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-900/30 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 w-[15%]">Dr / Cr</th>
                  <th className="px-4 py-3 w-[30%]">Ledger Account</th>
                  <th className="px-4 py-3 w-[25%]">Line Narration</th>
                  <th className="px-4 py-3 w-[20%] text-right">Amount (₹)</th>
                  <th className="px-4 py-3 w-[10%]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {rows.map((row, idx) => (
                  <tr key={row._key} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <select value={row.type} onChange={e => updateRow(row._key, { type: e.target.value as "DEBIT" | "CREDIT" })} className="w-full bg-[#11141d] border border-slate-700 rounded p-1.5 text-xs text-white outline-none">
                        <option value="DEBIT">Dr (Debit)</option>
                        <option value="CREDIT">Cr (Credit)</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select value={row.accountId} onChange={e => updateRow(row._key, { accountId: Number(e.target.value) })} className="w-full bg-[#11141d] border border-slate-700 rounded p-1.5 text-xs text-white outline-none">
                        <option value={0} disabled>Select Account...</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.type})</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input value={row.narration} onChange={e => updateRow(row._key, { narration: e.target.value })} placeholder="Line details..." className="w-full bg-transparent border-b border-slate-700/50 focus:border-indigo-500 px-1 py-1 text-xs text-white outline-none placeholder:text-slate-600" />
                    </td>
                    <td className="px-4 py-3 flex items-center">
                      <input type="number" step="0.01" min="0" value={row.amount} onChange={e => updateRow(row._key, { amount: e.target.value })} placeholder="0.00" className={`w-full bg-[#11141d] border border-slate-700 rounded p-1.5 text-xs font-mono text-right outline-none focus:border-indigo-500 ${row.type === 'DEBIT' ? 'text-indigo-300' : 'text-emerald-300'}`} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button type="button" onClick={() => setRows(prev => prev.filter(r => r._key !== row._key))} disabled={rows.length <= 2} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded disabled:opacity-50">
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t border-slate-800 flex items-center gap-3">
              <button type="button" onClick={() => setRows(p => [...p, emptyRow()])} className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-500 transition-all">
                <Plus size={12} /> Add Row
              </button>
              
              <div className="ml-auto flex items-center gap-8 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Total Debit:</span>
                  <span className="font-bold text-indigo-400">₹{totalDebit.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Total Credit:</span>
                  <span className="font-bold text-emerald-400">₹{totalCredit.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
