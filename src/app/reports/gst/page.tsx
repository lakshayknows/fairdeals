"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Receipt,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  FileText,
  ShoppingCart,
} from "lucide-react";

interface GstSummary {
  totalOutputGst: number;
  totalInputGst: number;
  netGstPayable: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  purchaseInputGst: number;
  inputAdjustments: number;
  outputAdjustments: number;
}

interface GstAdjustment {
  id: number;
  date: string;
  amount: number | string;
  type: "INPUT" | "OUTPUT";
  description: string;
  financialYear: string;
  createdAt: string;
}

const fmt = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

const inputCls =
  "w-full rounded-lg border border-slate-700/70 bg-[#0c0e14] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:border-indigo-500/60 focus:bg-[#0e1018] focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all";

export default function GstPage() {
  const [fy, setFy] = useState("2024-25");
  const [summary, setSummary] = useState<GstSummary | null>(null);
  const [adjustments, setAdjustments] = useState<GstAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    type: "INPUT" as "INPUT" | "OUTPUT",
    description: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("financial-year");
    if (saved) setFy(saved);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [reportRes, adjRes] = await Promise.all([
        fetch(`/api/reports?financialYear=${fy}`),
        fetch(`/api/gst-adjustments?financialYear=${fy}`),
      ]);
      if (reportRes.ok) setSummary(await reportRes.json());
      if (adjRes.ok) setAdjustments(await adjRes.json());
    } finally {
      setLoading(false);
    }
  }, [fy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    try {
      const res = await fetch("/api/gst-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          amount: parseFloat(form.amount),
          type: form.type,
          description: form.description,
          financialYear: fy,
        }),
      });
      if (res.ok) {
        setForm({ date: new Date().toISOString().slice(0, 10), amount: "", type: "INPUT", description: "" });
        showToast("Adjustment added successfully");
        await fetchData();
      } else {
        showToast("Failed to add adjustment", false);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`/api/gst-adjustments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Adjustment deleted");
      await fetchData();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070910]">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin" size={28} />
          <p className="text-sm font-medium">Loading GST data...</p>
        </div>
      </div>
    );
  }

  const netPositive = (summary?.netGstPayable ?? 0) >= 0;

  return (
    <div className="flex flex-col h-full bg-[#070910] text-slate-300">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl border px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2 ${
            toast.ok
              ? "bg-emerald-950 border-emerald-800 text-emerald-300"
              : "bg-red-950 border-red-800 text-red-300"
          }`}
        >
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt size={16} className="text-amber-500" />
            GST Management
          </h1>
          <div className="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 font-bold">
            <CalendarDays size={12} />
            FY {fy}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0f1117] p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <TrendingDown size={12} className="text-emerald-400" /> Total Input GST
                </p>
                <p className="text-3xl font-black text-white mt-2">{fmt(summary?.totalInputGst)}</p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-slate-600">Purchases: {fmt(summary?.purchaseInputGst)}</p>
                  <p className="text-xs text-slate-600">Adjustments: {fmt(summary?.inputAdjustments)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <ShoppingCart size={18} />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-emerald-500/80 to-transparent" />
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-[#0f1117] p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-amber-400" /> Total Output GST
                </p>
                <p className="text-3xl font-black text-white mt-2">{fmt(summary?.totalOutputGst)}</p>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-slate-600">Sales: {fmt(summary?.totalOutputGst != null && summary?.outputAdjustments != null ? summary.totalOutputGst - summary.outputAdjustments : 0)}</p>
                  <p className="text-xs text-slate-600">Adjustments: {fmt(summary?.outputAdjustments)}</p>
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-400">
                <FileText size={18} />
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-amber-500/80 to-transparent" />
          </div>

          <div className={`rounded-2xl border ${netPositive ? "border-red-500/20" : "border-emerald-500/20"} bg-[#0f1117] p-5 relative overflow-hidden`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                  <ArrowRightLeft size={12} className={netPositive ? "text-red-400" : "text-emerald-400"} />
                  Net GST {netPositive ? "Payable" : "Credit"}
                </p>
                <p className={`text-3xl font-black mt-2 ${netPositive ? "text-red-400" : "text-emerald-400"}`}>
                  {fmt(Math.abs(summary?.netGstPayable ?? 0))}
                </p>
                <p className="text-xs text-slate-600 mt-2">Output − Input</p>
              </div>
              <div className={`rounded-xl p-2.5 ${netPositive ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                <ArrowRightLeft size={18} />
              </div>
            </div>
            <div className={`absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r ${netPositive ? "from-red-500/80" : "from-emerald-500/80"} to-transparent`} />
          </div>
        </div>

        {/* GST Breakdown */}
        <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt size={14} className="text-amber-400" />
            Output GST Breakdown (from Sales)
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "CGST", value: summary?.cgst, color: "text-indigo-400" },
              { label: "SGST", value: summary?.sgst, color: "text-violet-400" },
              { label: "IGST", value: summary?.igst, color: "text-blue-400" },
              { label: "Cess", value: summary?.cess, color: "text-orange-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-slate-800 bg-[#0f1117] p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">{label}</p>
                <p className={`text-xl font-black ${color} mt-1`}>{fmt(value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Add Adjustment Form */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus size={14} className="text-indigo-400" />
              Add GST Adjustment
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use this to record opening balances, ITC carried forward, or manual reconciliation entries.
            </p>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "INPUT" | "OUTPUT" }))}
                    className={inputCls}
                  >
                    <option value="INPUT">Input (ITC / Credit)</option>
                    <option value="OUTPUT">Output (Liability)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className={inputCls}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. 15000"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. ITC carried forward from FY 2023-24"
                  required
                  maxLength={255}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition-all"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Add Adjustment
              </button>
            </form>
          </div>

          {/* Adjustments Ledger */}
          <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={14} className="text-slate-400" />
              Manual Adjustments Ledger
              <span className="ml-auto text-xs font-normal text-slate-600">{adjustments.length} entries</span>
            </h2>
            {adjustments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-700">
                <Receipt size={28} />
                <p className="text-sm mt-2">No adjustments for FY {fy}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#0f1117] px-4 py-3"
                  >
                    <div
                      className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        adj.type === "INPUT"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      {adj.type}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-300 truncate">{adj.description}</p>
                      <p className="text-[10px] text-slate-600">
                        {new Date(adj.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                      </p>
                    </div>
                    <span
                      className={`font-mono text-sm font-bold shrink-0 ${
                        adj.type === "INPUT" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {fmt(Number(adj.amount))}
                    </span>
                    <button
                      onClick={() => handleDelete(adj.id)}
                      className="text-slate-700 hover:text-red-400 transition-colors shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
