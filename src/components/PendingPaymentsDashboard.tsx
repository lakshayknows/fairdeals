"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  IndianRupee,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronDown,
  Building2,
  Calendar,
  Hash,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Printer,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";

type InvoiceStatus = "UNPAID" | "PARTIAL" | "PAID";
type PaymentMethod = "UPI" | "CASH" | "BANK";

interface Invoice {
  id: string;
  docNumber: string;
  customer: string;
  gstin: string;
  date: string;
  dueDate: string;
  amount: number;
  balanceDue: number;
  status: InvoiceStatus;
  state: string;
  docType: string;
  totalGst: number;
}

interface BankAccount {
  id: number;
  accountName: string;
  bankName: string;
  balance: number | string;
}

interface PaymentForm {
  amount: string;
  method: PaymentMethod;
  referenceId: string;
  note: string;
  bankAccountId: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const daysDiff = (dateStr: string) => {
  if (!dateStr) return "";
  const diff = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff < 0) return `Due in ${Math.abs(diff)}d`;
  return `${diff}d overdue`;
};

const isOverdue = (dateStr: string) => dateStr ? new Date(dateStr) < new Date() : false;

function StatCard({ label, value, sub, accent, icon: Icon }: {
  label: string; value: string; sub?: string; accent: string; icon: React.ElementType;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-[#0f1117] p-5 ${accent}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
          <p className="text-2xl font-black text-white leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-400 pt-1">{sub}</p>}
        </div>
        <div className={`rounded-xl p-2.5 ${accent.includes("red") ? "bg-red-500/10 text-red-400" : accent.includes("amber") ? "bg-amber-500/10 text-amber-400" : accent.includes("blue") ? "bg-blue-500/10 text-blue-400" : "bg-emerald-500/10 text-emerald-400"}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.includes("red") ? "bg-gradient-to-r from-red-500/80 to-transparent" : accent.includes("amber") ? "bg-gradient-to-r from-amber-500/80 to-transparent" : accent.includes("blue") ? "bg-gradient-to-r from-blue-500/80 to-transparent" : "bg-gradient-to-r from-emerald-500/80 to-transparent"}`} />
    </div>
  );
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "PAID") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 px-2.5 py-1 text-xs font-bold tracking-wide text-emerald-400">
        <CheckCircle2 size={10} />
        PAID
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ${status === "UNPAID" ? "bg-red-500/15 text-red-400 ring-1 ring-red-500/30" : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === "UNPAID" ? "bg-red-400" : "bg-amber-400"} animate-pulse`} />
      {status}
    </span>
  );
}

function PaymentModal({ invoice, onClose, onSubmit }: {
  invoice: Invoice; onClose: () => void; onSubmit: (form: PaymentForm) => void;
}) {
  const [form, setForm] = useState<PaymentForm>({ amount: String(invoice.balanceDue), method: "UPI", referenceId: "", note: "", bankAccountId: "" });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  useEffect(() => {
    fetch("/api/bank-accounts").then(r => r.ok ? r.json() : []).then(setBankAccounts).catch(() => {});
  }, []);

  const needsBankAccount = form.method === "UPI" || form.method === "BANK";
  const [loading, setLoading] = useState(false);
  const paid = invoice.amount - invoice.balanceDue;
  const paidPct = Math.round((paid / invoice.amount) * 100);
  const enteredAmt = parseFloat(form.amount) || 0;
  const afterPayment = invoice.balanceDue - enteredAmt;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(form);
    setLoading(false);
  };

  const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = { UPI: Smartphone, CASH: Banknote, BANK: Building2 };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative h-full w-full max-w-md overflow-y-auto bg-[#0a0c10] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0a0c10]/95 backdrop-blur-sm px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Record Payment</p>
            <p className="text-lg font-black text-white mt-0.5">{invoice.docNumber}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-800 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          <div className="rounded-2xl bg-[#0f1117] border border-slate-800 p-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Building2 size={16} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{invoice.customer}</p>
                <p className="text-xs text-slate-500 font-mono">{invoice.gstin}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-800 border-t border-slate-800 pt-3 mt-3">
              <div className="pr-3">
                <p className="text-xs text-slate-500">Invoice Total</p>
                <p className="text-sm font-bold text-white">{fmt(invoice.amount)}</p>
              </div>
              <div className="px-3">
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-sm font-bold text-emerald-400">{fmt(paid)}</p>
              </div>
              <div className="pl-3">
                <p className="text-xs text-slate-500">Balance Due</p>
                <p className="text-sm font-bold text-red-400">{fmt(invoice.balanceDue)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Payment progress</span>
                <span className="font-mono text-slate-400">{paidPct}% paid</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Payment Amount</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  max={invoice.balanceDue}
                  min={1}
                  step={0.01}
                  required
                  className="w-full rounded-xl bg-[#0f1117] border border-slate-700 pl-8 pr-4 py-3 text-white text-lg font-bold placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none transition-all"
                  placeholder="0"
                />
                <button type="button" onClick={() => setForm(f => ({ ...f, amount: String(invoice.balanceDue) }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                  FULL
                </button>
              </div>
              {enteredAmt > 0 && enteredAmt < invoice.balanceDue && (
                <p className="text-xs text-amber-400 mt-1.5 flex items-center gap-1">
                  <Clock size={11} /> Partial payment — {fmt(afterPayment)} will remain due
                </p>
              )}
              {enteredAmt >= invoice.balanceDue && enteredAmt > 0 && (
                <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Invoice will be marked PAID
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {(["UPI", "CASH", "BANK"] as PaymentMethod[]).map(m => {
                  const Icon = METHOD_ICONS[m];
                  const active = form.method === m;
                  return (
                    <button key={m} type="button" onClick={() => setForm(f => ({ ...f, method: m }))}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border py-3 px-2 text-xs font-bold transition-all ${active ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-slate-700 bg-[#0f1117] text-slate-500 hover:border-slate-600 hover:text-slate-300"}`}>
                      <Icon size={16} />
                      {m === "BANK" ? "Bank Transfer" : m}
                    </button>
                  );
                })}
              </div>
            </div>

            {needsBankAccount && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Bank Account <span className="text-slate-600 normal-case">(optional)</span>
                </label>
                {bankAccounts.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">
                    No bank accounts configured.{" "}
                    <a href="/bank-accounts" target="_blank" className="text-indigo-400 hover:underline">Add one →</a>
                  </p>
                ) : (
                  <select
                    value={form.bankAccountId}
                    onChange={e => setForm(f => ({ ...f, bankAccountId: e.target.value }))}
                    className="w-full rounded-xl bg-[#0f1117] border border-slate-700 px-4 py-3 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none transition-all"
                  >
                    <option value="">— No specific account —</option>
                    {bankAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} ({a.bankName})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                {form.method === "UPI" ? "UPI Transaction ID" : form.method === "BANK" ? "UTR / Reference Number" : "Receipt Number"}
                <span className="ml-1 text-slate-600 normal-case">(optional)</span>
              </label>
              <div className="relative">
                <Hash size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" value={form.referenceId} onChange={e => setForm(f => ({ ...f, referenceId: e.target.value }))}
                  className="w-full rounded-xl bg-[#0f1117] border border-slate-700 pl-9 pr-4 py-3 text-white font-mono text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none transition-all"
                  placeholder={form.method === "UPI" ? "e.g. 4128XXXX..." : "Reference ID"} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Note <span className="text-slate-600 normal-case">(optional)</span>
              </label>
              <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2}
                className="w-full rounded-xl bg-[#0f1117] border border-slate-700 px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 outline-none transition-all resize-none"
                placeholder="Add a note..." />
            </div>

            <button type="submit" disabled={loading || !form.amount || parseFloat(form.amount) <= 0}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><CheckCircle2 size={16} /> Confirm Payment of {form.amount ? fmt(parseFloat(form.amount)) : "₹0"}</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function PendingPaymentsDashboard({ variant = "dashboard" }: { variant?: "dashboard" | "invoices" }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | InvoiceStatus>("ALL");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const fy = localStorage.getItem("financial-year") || "2024-25";
      const res = await fetch(`/api/invoices?limit=100&financialYear=${fy}`);
      if (res.ok) {
        const body = await res.json();
        const mapped = body.data.map((inv: any) => ({
          id: inv.id.toString(),
          docNumber: inv.docNumber,
          customer: inv.party.name,
          gstin: inv.party.gstin || "N/A",
          date: inv.date.split("T")[0],
          dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
          amount: Number(inv.totalAmount),
          balanceDue: Number(inv.balanceDue),
          status: inv.status as InvoiceStatus,
          state: inv.party.stateCode,
          docType: inv.docType,
          totalGst: Number(inv.cgstTotal || 0) + Number(inv.sgstTotal || 0) + Number(inv.igstTotal || 0) + Number(inv.cessTotal || 0),
        }));
        setInvoices(mapped);
      }
    } finally {
      setInitialLoad(false);
    }
  };

  const handlePrint = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    window.open(`/invoices/${id}/print`, "_blank");
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    window.location.href = `/invoices/${id}/edit`;
  };

  const handleDelete = async (e: React.MouseEvent, id: string, docNumber: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to completely delete ${docNumber}? This will reverse recorded inventory reductions and party balances. This cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setToast(`Invoice ${docNumber} comprehensively deleted.`);
        setTimeout(() => setToast(null), 4000);
        fetchInvoices();
      } else {
        alert("Failed to delete invoice");
      }
    } catch {
      alert("Error reaching server");
    }
  };

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonth = todayStr.slice(0, 7); // e.g. "2024-05"

    const totalItc = invoices.filter(i => i.docType === "PURCHASE").reduce((s, i) => s + i.totalGst, 0);
    const outputGstThisMonth = invoices.filter(i => i.docType === "INVOICE" && i.date.startsWith(thisMonth)).reduce((s, i) => s + i.totalGst, 0);

    return {
      outstanding: invoices.reduce((s, i) => s + i.balanceDue, 0),
      partial: invoices.filter(i => i.status === "PARTIAL").length,
      dueToday: invoices.filter(i => i.dueDate === todayStr).length,
      paidThisMonth: invoices.filter(i => i.status === "PAID").reduce((s, i) => s + i.amount, 0),
      totalItc,
      outputGstThisMonth,
    };
  }, [invoices]);

  const filtered = useMemo(() => invoices.filter(inv => {
    const matchSearch = inv.customer.toLowerCase().includes(search.toLowerCase()) || inv.docNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  }), [invoices, search, statusFilter]);

  const handlePayment = async (invoice: Invoice, form: PaymentForm) => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: parseInt(invoice.id, 10),
          amount: parseFloat(form.amount),
          method: form.method,
          referenceId: form.referenceId || null,
          note: form.note || null,
          bankAccountId: form.bankAccountId ? parseInt(form.bankAccountId, 10) : null,
        })
      });
      if (res.ok) {
        await fetchInvoices(); // refresh from backend
        setSelectedInvoice(null);
        setToast(`Payment recorded for ${invoice.docNumber}`);
        setTimeout(() => setToast(null), 4000);
      } else {
        alert("Failed to record payment.");
      }
    } catch {
      alert("Error reaching server");
    }
  };

  return (
    <div className="min-h-screen bg-[#070910] text-white" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-emerald-950 border border-emerald-800 px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span className="text-sm font-medium text-emerald-300">{toast}</span>
        </div>
      )}

      <div>
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <IndianRupee size={16} className="text-slate-400" />
              {variant === "dashboard" ? "Billing Overview" : "Invoices Manager"}
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={13} />
                <span>{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
              <Link
                href="/invoices/new"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                <Plus size={14} />
                New Invoice
              </Link>
            </div>
          </div>
        </header>

        <main className="px-8 py-8 space-y-8">
          {variant === "dashboard" && (
            <div className="grid grid-cols-3 gap-4 animate-in">
              <StatCard label="Total Outstanding" value={fmt(stats.outstanding)} sub={`${invoices.filter(x=>x.balanceDue>0).length} pending`} accent="border-red-500/20" icon={AlertCircle} />
              <StatCard label="Total ITC Available" value={fmt(stats.totalItc)} sub="From Purchase Invoices" accent="border-cyan-500/20" icon={Building2} />
              <StatCard label="GST Payable This Month" value={fmt(stats.outputGstThisMonth)} sub="Sales Output GST" accent="border-amber-500/20" icon={TrendingUp} />
            </div>
          )}

          <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-800">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice or customer..."
                  className="w-full rounded-xl bg-[#0f1117] border border-slate-700/60 pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none transition-all" />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={13} className="text-slate-600" />
                {(["ALL", "UNPAID", "PARTIAL", "PAID"] as const).map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${statusFilter === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                {filtered.length} of {invoices.length} records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    {["Invoice #", "Customer", "Date", "Due Date", "Amount", "Balance Due", "Status", "Action"].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {initialLoad ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto" />
                      </td>
                    </tr>
                  ) : filtered.slice(0, variant === "dashboard" ? 10 : filtered.length).map(inv => (
                    <tr key={inv.id} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-sm font-bold text-indigo-400">{inv.docNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-white">{inv.customer}</p>
                          <p className="text-xs text-slate-600 font-mono">{inv.gstin}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-400">
                        {inv.date ? new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" }) : ""}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-semibold ${isOverdue(inv.dueDate) && inv.balanceDue > 0 ? "text-red-400" : "text-slate-400"}`}>
                          {daysDiff(inv.dueDate)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-slate-300 font-mono">{fmt(inv.amount)}</td>
                      <td className="px-5 py-4 text-sm font-bold text-red-400 font-mono">{fmt(inv.balanceDue)}</td>
                      <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {inv.status !== "PAID" && (
                            <button onClick={() => setSelectedInvoice(inv)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600 hover:border-indigo-500 px-3.5 py-2 text-xs font-bold text-indigo-400 hover:text-white transition-all active:scale-95 cursor-pointer">
                              <IndianRupee size={11} />
                              Pay
                            </button>
                          )}
                          <button onClick={(e) => handlePrint(e, inv.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 hover:text-white px-3 py-2 text-xs font-bold text-slate-400 transition-all active:scale-95 cursor-pointer">
                            <Printer size={13} />
                            Print
                          </button>
                          <button onClick={(e) => handleEdit(e, inv.id)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/50 p-2 text-slate-400 transition-all active:scale-95 cursor-pointer">
                            <Edit size={13} />
                          </button>
                          <button onClick={(e) => handleDelete(e, inv.id, inv.docNumber)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-700 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/50 p-2 text-slate-400 transition-all active:scale-95 cursor-pointer">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!initialLoad && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-600">
                          <CheckCircle2 size={28} className="text-emerald-700" />
                          <p className="text-sm font-medium">No invoices match</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/60 px-6 py-3">
              <div className="flex items-center gap-6 text-xs text-slate-600">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> PAID = Cleared</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> UNPAID = Full balance pending</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> PARTIAL = Part-paid, balance due</span>
              </div>
              <span className="text-xs text-slate-700 font-mono">FairDeals Billing v1.0</span>
            </div>
          </div>
        </main>
      </div>

      {selectedInvoice && (
        <PaymentModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)}
          onSubmit={(form) => handlePayment(selectedInvoice, form)} />
      )}
    </div>
  );
}
