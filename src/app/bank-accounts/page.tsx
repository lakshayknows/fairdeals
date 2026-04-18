"use client";

import { useState, useEffect } from "react";
import {
  Landmark, Plus, X, Loader2, CheckCircle2, Trash2, IndianRupee,
} from "lucide-react";

interface BankAccount {
  id: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  balance: number | string;
  _count: { payments: number };
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  const [form, setForm] = useState({
    accountName: "", bankName: "", accountNumber: "", ifscCode: "",
  });

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setToastError(msg);
      setTimeout(() => setToastError(null), 4000);
    } else {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/bank-accounts");
      if (res.ok) setAccounts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/bank-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        showToast("Bank account added");
        setShowAdd(false);
        setForm({ accountName: "", bankName: "", accountNumber: "", ifscCode: "" });
        fetchAccounts();
      } else {
        const err = await res.json();
        if (err.error?.fieldErrors) {
          const msg = Object.entries(err.error.fieldErrors).map(([f, e]) => `${f}: ${(e as string[]).join(", ")}`).join("\n");
          showToast(`Validation Error:\n${msg}`, true);
        } else {
          showToast(err.error || "Failed to add account", true);
        }
      }
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this bank account? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Account deleted");
        setAccounts(prev => prev.filter(a => a.id !== id));
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete account", true);
      }
    } finally {
      setDeleting(null);
    }
  };

  const totalBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);

  return (
    <div className="flex flex-col h-full relative">
      {/* Toasts */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-emerald-950 border border-emerald-800 px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">{toast}</span>
        </div>
      )}
      {toastError && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-red-950 border border-red-800 px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2 max-w-sm">
          <X size={16} className="text-red-400 shrink-0" />
          <span className="text-sm font-medium text-red-300 whitespace-pre-line">{toastError}</span>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0c10] border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Add Bank Account</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {[
                { key: "accountName", label: "Account Name *", placeholder: "e.g. Operating Account", required: true },
                { key: "bankName",    label: "Bank Name *",    placeholder: "e.g. State Bank of India", required: true },
                { key: "accountNumber", label: "Account Number *", placeholder: "e.g. 00112233445566", required: true },
                { key: "ifscCode",    label: "IFSC Code *",    placeholder: "e.g. SBIN0001234", required: true },
              ].map(field => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase">{field.label}</label>
                  <input
                    required={field.required}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: field.key === "ifscCode" ? e.target.value.toUpperCase() : e.target.value }))}
                    className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                    placeholder={field.placeholder}
                  />
                </div>
              ))}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={adding} className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2">
                  {adding && <Loader2 size={14} className="animate-spin" />}
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Landmark size={16} className="text-slate-500" />
          <span className="text-sm font-semibold text-white">Bank Accounts</span>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
          <Plus size={15} />
          Add Account
        </button>
      </header>

      <div className="flex-1 px-8 py-8 space-y-6">
        {/* Total balance card */}
        <div className="rounded-2xl border border-indigo-500/20 bg-[#0a0c10] p-5 flex items-center gap-5">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Landmark size={22} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Bank Balance</p>
            <p className="text-2xl font-black font-mono text-white">{fmt(totalBalance)}</p>
            <p className="text-xs text-slate-600 mt-0.5">{accounts.length} account{accounts.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Accounts grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-indigo-500" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-16 text-slate-600">
            <Landmark size={32} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No bank accounts yet. Add your first account.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {accounts.map(acc => (
              <div key={acc.id} className="group rounded-2xl border border-slate-800 bg-[#0a0c10] hover:border-slate-700 p-5 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{acc.accountName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{acc.bankName}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(acc.id)}
                    disabled={deleting === acc.id || acc._count.payments > 0}
                    title={acc._count.payments > 0 ? `${acc._count.payments} payments linked — cannot delete` : "Delete account"}
                    className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all opacity-0 group-hover:opacity-100"
                  >
                    {deleting === acc.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>

                <div className="mt-4 space-y-1 text-xs font-mono text-slate-500">
                  <p>A/C: {acc.accountNumber}</p>
                  <p>IFSC: {acc.ifscCode}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-600">{acc._count.payments} payment{acc._count.payments !== 1 ? "s" : ""} linked</span>
                  <div className="flex items-center gap-1">
                    <IndianRupee size={13} className={Number(acc.balance) >= 0 ? "text-emerald-500" : "text-red-500"} />
                    <span className={`text-base font-black font-mono ${Number(acc.balance) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmt(Number(acc.balance))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
