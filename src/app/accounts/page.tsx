"use client";

import { useEffect, useState } from "react";
import { Plus, Landmark, Building2, Wallet, Briefcase, FileText, ArrowRight, Trash2, Pencil, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

interface LedgerAccount {
  id: number;
  name: string;
  type: string;
  group?: string;
  openingBalance: string | number;
  currentBalance: string | number;
  isBank: boolean;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // New Account Modal State
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("ASSET");
  const [newOpeningBalance, setNewOpeningBalance] = useState("0");
  const [newIsBank, setNewIsBank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{type: "error" | "success", text: string} | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await fetch("/api/ledger");
    if (res.ok) {
      setAccounts(await res.json());
    }
    setLoading(false);
  };

  const openModal = (acc?: LedgerAccount) => {
    if (acc) {
      setEditingId(acc.id);
      setNewName(acc.name);
      setNewType(acc.type);
      setNewOpeningBalance(String(acc.openingBalance));
      setNewIsBank(acc.isBank);
    } else {
      setEditingId(null);
      setNewName("");
      setNewType("ASSET");
      setNewOpeningBalance("0");
      setNewIsBank(false);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    const res = await fetch(`/api/ledger?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setMessage({ type: "success", text: "Account deleted successfully." });
      fetchAccounts();
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to delete account" });
    }
    setTimeout(() => setMessage(null), 3500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const method = editingId ? "PUT" : "POST";
    const res = await fetch("/api/ledger", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: newName,
        type: newType,
        openingBalance: parseFloat(newOpeningBalance) || 0,
        isBank: newIsBank,
      }),
    });
    if (res.ok) {
      setShowModal(false);
      fetchAccounts();
      setMessage({ type: "success", text: `Account ${editingId ? "updated" : "created"} successfully.` });
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error || "Failed to save account" });
    }
    setTimeout(() => setMessage(null), 3500);
    setSaving(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ASSET": return <Building2 size={16} className="text-emerald-400" />;
      case "LIABILITY": return <Wallet size={16} className="text-rose-400" />;
      case "EQUITY": return <Briefcase size={16} className="text-amber-400" />;
      case "INCOME": return <ArrowRight size={16} className="text-indigo-400" />;
      case "EXPENSE": return <FileText size={16} className="text-orange-400" />;
      default: return <Landmark size={16} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex h-screen bg-[#070910] text-slate-200 font-sans">
      <AppNav />
      
      <main className="flex-1 ml-56 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Landmark size={16} className="text-indigo-500" />
            Chart of Accounts
          </h1>
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Plus size={16} />
            New Account
          </button>
        </header>

        {message && (
          <div className={`absolute top-24 right-8 z-[100] flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl animate-in slide-in-from-top-2 ${
            message.type === 'success' ? "bg-emerald-950 border-emerald-800 text-emerald-300" : "bg-red-950 border-red-800 text-red-300"
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="p-8 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 text-indigo-500"></div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <p className="text-sm font-medium text-slate-400">No accounts found</p>
              <button onClick={() => openModal()} className="text-indigo-400 font-bold mt-2 hover:underline text-sm">Create one</button>
            </div>
          ) : (
            <div className="bg-[#0c0e14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Account Name</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Type</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Opening Bal.</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Current Bal.</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {accounts.map(acc => (
                    <tr key={acc.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-sm text-slate-200 flex items-center gap-2">
                          {getTypeIcon(acc.type)}
                          {acc.name}
                          {acc.isBank && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 ml-2">BANK/CASH</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded">
                          {acc.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-mono text-slate-500">
                        ₹{Number(acc.openingBalance).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-mono font-bold text-slate-300">
                        ₹{Number(acc.currentBalance).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openModal(acc)} className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[#0c0e14] border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl fade-up">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-bold text-slate-200">{editingId ? "Edit" : "Create"} Ledger Account</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Account Name</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. HDFC Bank, Rent, Machinery" className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Account Type</label>
                  <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20">
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                    <option value="INCOME">Income</option>
                    <option value="EXPENSE">Expense</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Opening Balance</label>
                  <input type="number" step="0.01" value={newOpeningBalance} onChange={e => setNewOpeningBalance(e.target.value)} className="w-full bg-[#070910] border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 font-mono" />
                </div>
              </div>
              {newType === "ASSET" && (
                <div className="flex items-center gap-3 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg mt-2">
                  <input type="checkbox" id="isBank" checked={newIsBank} onChange={e => setNewIsBank(e.target.checked)} className="rounded border-slate-700 bg-[#070910] text-indigo-500 focus:ring-indigo-500/30" />
                  <label htmlFor="isBank" className="text-xs font-semibold text-indigo-400 cursor-pointer">This is a Cash/Bank Account</label>
                </div>
              )}
              
              <div className="flex items-center justify-end gap-3 pt-6 mt-2 border-t border-slate-800/60">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                  {saving ? "Saving..." : editingId ? "Update Account" : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
