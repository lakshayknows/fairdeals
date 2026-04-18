"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Receipt,
  PiggyBank,
  Briefcase,
  PieChart,
  BarChart4,
  Loader2,
  Banknote,
  Landmark,
  ShoppingCart,
} from "lucide-react";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (n: number | null | undefined) =>
    new Intl.NumberFormat("en-IN", { 
      style: "currency", 
      currency: "INR", 
      maximumFractionDigits: 0 
    }).format(n || 0);

  useEffect(() => {
    async function fetchReports() {
      try {
        const fy = localStorage.getItem("financial-year") || "2024-25";
        const res = await fetch(`/api/reports?financialYear=${fy}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070910]">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="animate-spin" size={30} />
          <p className="text-sm font-medium">Crunching financial data...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex flex-col h-full bg-[#070910] text-slate-300">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4">
        <h1 className="text-sm font-bold text-white flex items-center gap-2">
          <PieChart size={16} className="text-indigo-500" />
          Financial Reports
        </h1>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8 animate-in">
        <div className="max-w-5xl space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-indigo-500/20 bg-[#0f1117] p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <TrendingUp size={14} className="text-indigo-400" /> Total Sales (Taxable)
                </p>
                <p className="text-3xl font-black text-white">{fmt(data.totalSales)}</p>
                <p className="text-xs text-slate-600">{data.invoiceCount} invoices</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-400" />
            </div>

            <div className="rounded-2xl border border-amber-500/20 bg-[#0f1117] p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Receipt size={14} className="text-amber-400" /> GST Output Collected
                </p>
                <p className="text-3xl font-black text-white">{fmt(data.totalTax)}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
            </div>

            <div className="rounded-2xl border border-emerald-500/20 bg-[#0f1117] p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <PiggyBank size={14} className="text-emerald-400" /> Payments Received
                </p>
                <p className="text-3xl font-black text-white">{fmt(data.totalCollections)}</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-400" />
            </div>

            <div className="rounded-2xl border border-violet-500/20 bg-[#0f1117] p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <ShoppingCart size={14} className="text-violet-400" /> Total Purchases
                </p>
                <p className="text-3xl font-black text-white">{fmt(data.totalPurchases)}</p>
                <p className="text-xs text-slate-600">{data.purchaseCount} purchase orders</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-violet-500 to-violet-400" />
            </div>

            <div className="rounded-2xl border border-green-500/20 bg-[#0f1117] p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Banknote size={14} className="text-green-400" /> Cash in Hand
                </p>
                <p className={`text-3xl font-black ${data.cashInHand >= 0 ? "text-white" : "text-red-400"}`}>{fmt(data.cashInHand)}</p>
                <p className="text-xs text-slate-600">Net CASH payments</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-500 to-green-400" />
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-[#0f1117] p-6 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <Landmark size={14} className="text-blue-400" /> Cash in Bank
                </p>
                <p className={`text-3xl font-black ${data.cashInBank >= 0 ? "text-white" : "text-red-400"}`}>{fmt(data.cashInBank)}</p>
                <p className="text-xs text-slate-600">Net BANK / UPI / CHEQUE</p>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-6">
              <div className="flex items-center gap-3">
                <BarChart4 size={20} className="text-indigo-400" />
                <h2 className="text-base font-bold text-white">GST Breakdown</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-sm font-semibold text-slate-400">CGST (Intra-state)</span>
                  <span className="font-mono text-sm font-bold text-white">{fmt(data.cgst)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-sm font-semibold text-slate-400">SGST (Intra-state)</span>
                  <span className="font-mono text-sm font-bold text-white">{fmt(data.sgst)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <span className="text-sm font-semibold text-slate-400">IGST (Inter-state)</span>
                  <span className="font-mono text-sm font-bold text-white">{fmt(data.igst)}</span>
                </div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-sm font-semibold text-slate-400">Compensation Cess</span>
                  <span className="font-mono text-sm font-bold text-white">{fmt(data.cess)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Briefcase size={20} className="text-emerald-400" />
                <h2 className="text-base font-bold text-white">Business Summary</h2>
              </div>
              
              <div className="space-y-4 pt-2">
                {[
                  { label: "Sales Invoices", value: data.invoiceCount, color: "bg-indigo-500" },
                  { label: "Purchase Orders", value: data.purchaseCount, color: "bg-violet-500" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-400">{row.label}</span>
                    <span className="font-mono text-sm font-bold text-white">{row.value}</span>
                  </div>
                ))}
                <div className="pt-4 border-t border-slate-800/60">
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Financial data for the selected financial year. Cash in Hand and Cash in Bank reflect net payment flows (received minus paid).
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
