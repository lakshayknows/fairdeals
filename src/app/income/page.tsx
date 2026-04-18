"use client";

import { useEffect, useState } from "react";
import { FileText, Save, ArrowRight, Loader2 } from "lucide-react";
import AppNav from "@/components/AppNav";
import { useRouter } from "next/navigation";

interface LedgerAccount {
  id: number;
  name: string;
  type: string;
  isBank: boolean;
}

export default function IncomePage() {
  const router = useRouter();
  const [bankAccounts, setBankAccounts] = useState<LedgerAccount[]>([]);
  const [incomeAccounts, setIncomeAccounts] = useState<LedgerAccount[]>([]);
  
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bankAccountId, setBankAccountId] = useState("");
  const [incomeAccountId, setIncomeAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const res = await fetch("/api/ledger");
    if (res.ok) {
      const data: LedgerAccount[] = await res.json();
      setBankAccounts(data.filter(a => a.isBank));
      setIncomeAccounts(data.filter(a => a.type === "INCOME"));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankAccountId || !incomeAccountId || !amount) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const fy = localStorage.getItem("financial-year") || "2024-25";

    // Double Entry:
    // Debit: Bank/Cash Account (Increases Asset)
    // Credit: Income Account (Increases Income)
    const payload = {
      date,
      description,
      financialYear: fy,
      entries: [
        { accountId: parseInt(bankAccountId), amount: parseFloat(amount), type: "DEBIT" },
        { accountId: parseInt(incomeAccountId), amount: parseFloat(amount), type: "CREDIT" },
      ]
    };

    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Income recorded successfully!" });
      setAmount("");
      setDescription("");
      setTimeout(() => setMessage(null), 3000);
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to record income" });
    }
    setSaving(false);
  };

  return (
    <div className="flex h-screen bg-[#070910] text-slate-200 font-sans">
      <AppNav />
      <main className="flex-1 ml-56 flex flex-col h-full overflow-y-auto">
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/80 backdrop-blur-md px-8 py-4">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText size={16} className="text-teal-500" />
            Record Quick Income
          </h1>
        </header>

        <div className="p-8 max-w-3xl">
          <form onSubmit={handleSave} className="bg-[#0c0e14] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
            
            {message && (
              <div className={`p-4 rounded-lg text-sm font-semibold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Date</label>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#070910] border border-slate-700/70 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Amount (₹)</label>
                <input required type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="w-full bg-[#070910] border border-slate-700/70 rounded-lg px-4 py-2.5 text-sm font-mono outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 relative pr-6 border-r border-slate-800">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between">
                  <span>Income Category *</span>
                </label>
                <select required value={incomeAccountId} onChange={e => setIncomeAccountId(e.target.value)} className="w-full bg-[#070910] border border-slate-700/70 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20">
                  <option value="" disabled>Select Income Account</option>
                  {incomeAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <div className="absolute right-[-12px] top-9 bg-slate-800 rounded-full p-1 border border-slate-700">
                  <ArrowRight size={14} className="text-slate-400" />
                </div>
              </div>

              <div className="space-y-2 pl-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between">
                  <span>Received Into (Bank/Cash) *</span>
                </label>
                <select required value={bankAccountId} onChange={e => setBankAccountId(e.target.value)} className="w-full bg-[#070910] border border-slate-700/70 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20">
                  <option value="" disabled>Select Receive Account</option>
                  {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {bankAccounts.length === 0 && <p className="text-xs text-amber-500">No bank accounts found. Create one in Accounts &rarr; New Account.</p>}
              </div>

            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description / Narration</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Interest received, scrap sale..." className="w-full bg-[#070910] border border-slate-700/70 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 resize-none" />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button disabled={saving} type="submit" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Record Income
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
