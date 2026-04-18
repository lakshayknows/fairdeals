"use client";

import { useEffect, useState } from "react";
import { Package, Plus, Loader2, Save } from "lucide-react";
import AppNav from "@/components/AppNav";
import { useRouter } from "next/navigation";

interface LedgerAccount {
  id: number;
  name: string;
  type: string;
  currentBalance: string | number;
  isBank: boolean;
}

export default function FixedAssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<LedgerAccount[]>([]);
  const [expenseAccounts, setExpenseAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Depreciation Modal
  const [showModal, setShowModal] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [expenseId, setExpenseId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [depreciationDate, setDepreciationDate] = useState(new Date().toISOString().slice(0, 10));
  
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch("/api/ledger");
    if (res.ok) {
      const data: LedgerAccount[] = await res.json();
      // Only non-bank ASSET accounts roughly act as physical/fixed/current assets
      setAssets(data.filter(a => a.type === "ASSET" && !a.isBank));
      setExpenseAccounts(data.filter(a => a.type === "EXPENSE"));
    }
    setLoading(false);
  };

  const handleDepreciate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetId || !expenseId || !amount) {
      setMessage({ type: "error", text: "Please fill all required fields" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const fy = localStorage.getItem("financial-year") || "2024-25";

    // Double Entry for Depreciation:
    // Debit: Depreciation Expense Account (Increases Expense)
    // Credit: Fixed Asset Account (Decreases Asset Value)
    const payload = {
      date: depreciationDate,
      description: description || "Asset Depreciation",
      referenceType: "DEPRECIATION",
      financialYear: fy,
      entries: [
        { accountId: parseInt(expenseId), amount: parseFloat(amount), type: "DEBIT" },
        { accountId: parseInt(assetId), amount: parseFloat(amount), type: "CREDIT" },
      ]
    };

    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage({ type: "success", text: "Depreciation recorded successfully!" });
      setShowModal(false);
      setAmount("");
      setDescription("");
      fetchData(); // Refresh balances
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to record depreciation" });
    }
    setSaving(false);
  };

  return (
    <div className="flex h-screen bg-[#070910] text-slate-200 font-sans">
      <AppNav />
      <main className="flex-1 ml-56 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Package size={16} className="text-cyan-400" />
            Fixed Assets &amp; Depreciation
          </h1>
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
          >
            <Plus size={16} />
            Record Depreciation
          </button>
        </header>

        <div className="p-8 overflow-y-auto flex-1">
          {message && message.type === 'success' && (
             <div className="mb-4 p-4 rounded-lg text-sm font-semibold flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
               {message.text}
             </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 text-indigo-500"></div>
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <p className="text-sm font-medium text-slate-400">No fixed assets found</p>
              <button onClick={() => router.push("/accounts")} className="text-indigo-400 font-bold mt-2 hover:underline text-sm">Create Asset Account in Ledger</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {assets.map(asset => (
                <div key={asset.id} className="bg-[#0c0e14] border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="font-bold text-slate-200 text-lg">{asset.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Ledger ID: {asset.id}</p>
                    </div>
                    <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                      <Package size={20} className="text-cyan-400" />
                    </div>
                  </div>
                  
                  <div className="mt-8 relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Current Book Value</p>
                    <p className="text-3xl font-black font-mono text-white">₹{Number(asset.currentBalance).toFixed(2)}</p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setAssetId(String(asset.id));
                      setShowModal(true);
                    }}
                    className="mt-6 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                  >
                    Depreciate Asset
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#0c0e14] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl fade-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Package size={16} className="text-cyan-400" />
                Record Depreciation
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleDepreciate} className="p-6 space-y-5">
              {message && message.type === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold text-red-500">
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 focus-within:text-cyan-400 text-slate-500 transition-colors">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Date</label>
                  <input required type="date" value={depreciationDate} onChange={e => setDepreciationDate(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" />
                </div>
                <div className="space-y-1.5 focus-within:text-cyan-400 text-slate-500 transition-colors">
                  <label className="text-[10px] font-bold uppercase tracking-widest">Amount (₹)</label>
                  <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 font-mono" placeholder="0.00" />
                </div>
              </div>

              <div className="space-y-1.5 focus-within:text-cyan-400 text-slate-500 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-widest">Target Asset Account (Cr)</label>
                <select required value={assetId} onChange={e => setAssetId(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 appearance-none">
                  <option value="" disabled>Select Asset</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 focus-within:text-cyan-400 text-slate-500 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-widest">Depreciation Expense Account (Dr)</label>
                <select required value={expenseId} onChange={e => setExpenseId(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 appearance-none">
                  <option value="" disabled>Select Expense Account</option>
                  {expenseAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5 focus-within:text-cyan-400 text-slate-500 transition-colors">
                <label className="text-[10px] font-bold uppercase tracking-widest">Notes / Narration</label>
                <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20" placeholder="e.g. 10% annual depreciation" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-slate-800/60">
                <button type="button" disabled={saving} onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50">
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Post Depreciation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
