"use client";

import { useState, useEffect } from "react";
import {
  Users, Plus, Search, Building2,
  Phone, Mail, MapPin, IndianRupee,
  ArrowUpRight, ArrowDownRight,
  X, Loader2, CheckCircle2, Pencil,
  BookOpen, Printer, ChevronDown, ChevronUp, Trash2, Mic,
} from "lucide-react";
import { INDIAN_STATES } from "@/types";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

interface Party {
  id: number;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
  name: string;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  stateCode: string;
  stateName: string;
  currentBalance: number;
}

interface LedgerEntry {
  date: string;
  type: "invoice" | "payment";
  docNumber: string;
  docType: string;
  debit: number;
  credit: number;
  balance: number;
  note: string | null;
}

interface LedgerData {
  party: Party & { currentBalance: number };
  summary: { totalBilled: number; totalPaid: number; closingBalance: number };
  entries: LedgerEntry[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Math.abs(n));

const TYPE_STYLE = {
  CUSTOMER: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SUPPLIER: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  BOTH: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

export default function PartiesView() {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CUSTOMER" | "SUPPLIER">("ALL");
  const { listening, supported: voiceSupported, error: voiceError, startListening, stopListening } = useVoiceSearch(setSearch);

  // Add modal
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({
    type: "CUSTOMER", name: "", gstin: "", phone: "", email: "", address: "", stateCode: "07",
  });

  // Edit modal
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [editForm, setEditForm] = useState({
    type: "CUSTOMER", name: "", gstin: "", phone: "", email: "", address: "", stateCode: "07",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Ledger modal
  const [ledgerParty, setLedgerParty] = useState<Party | null>(null);
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [showAllEntries, setShowAllEntries] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [toastError, setToastError] = useState<string | null>(null);

  useEffect(() => { fetchParties(); }, []);

  const fetchParties = async () => {
    try {
      const res = await fetch("/api/parties");
      if (res.ok) setParties(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setToastError(msg);
      setTimeout(() => setToastError(null), 4000);
    } else {
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleAddSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const stateObj = INDIAN_STATES.find(s => s.code === addForm.stateCode);
      const stateName = stateObj?.name ?? "Delhi";
      const res = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          gstin: addForm.gstin || null,
          phone: addForm.phone || null,
          email: addForm.email || null,
          address: addForm.address || null,
          stateName,
        }),
      });
      if (res.ok) {
        showToast("Party added successfully");
        setShowAdd(false);
        setAddForm({ type: "CUSTOMER", name: "", gstin: "", phone: "", email: "", address: "", stateCode: "07" });
        fetchParties();
      } else {
        const err = await res.json();
        if (err.error?.fieldErrors) {
          alert("Validation Error:\n" + Object.entries(err.error.fieldErrors).map(([f, e]) => `${f}: ${(e as string[]).join(", ")}`).join("\n"));
        } else {
          alert(err.error || "Failed to add party");
        }
      }
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (party: Party) => {
    setEditForm({
      type: party.type,
      name: party.name,
      gstin: party.gstin ?? "",
      phone: party.phone ?? "",
      email: party.email ?? "",
      address: "",
      stateCode: party.stateCode,
    });
    setEditParty(party);
  };

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editParty) return;
    setSaving(true);
    try {
      const stateObj = INDIAN_STATES.find(s => s.code === editForm.stateCode);
      const stateName = stateObj?.name ?? editParty.stateName;
      const res = await fetch(`/api/parties/${editParty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editForm.type,
          name: editForm.name,
          gstin: editForm.gstin || null,
          phone: editForm.phone || null,
          email: editForm.email || null,
          stateCode: editForm.stateCode,
          stateName,
        }),
      });
      if (res.ok) {
        showToast(`"${editForm.name}" updated`);
        setEditParty(null);
        fetchParties();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update party");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (party: Party) => {
    if (!confirm(`Delete "${party.name}"? This cannot be undone.`)) return;
    setDeleting(party.id);
    try {
      const res = await fetch(`/api/parties/${party.id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`"${party.name}" deleted`);
        setParties(prev => prev.filter(p => p.id !== party.id));
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete party", true);
      }
    } finally {
      setDeleting(null);
    }
  };

  const openLedger = async (party: Party) => {
    setLedgerParty(party);
    setLedgerLoading(true);
    setLedgerData(null);
    setShowAllEntries(false);
    try {
      const res = await fetch(`/api/parties/${party.id}/ledger`);
      if (res.ok) setLedgerData(await res.json());
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleShare = () => {
    if (!ledgerParty) return;
    window.open(`/parties/${ledgerParty.id}/ledger/print`, "_blank");
  };

  const filtered = parties.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.gstin ?? "").toLowerCase().includes(q);
    const matchType = typeFilter === "ALL" || p.type === typeFilter || p.type === "BOTH";
    return matchSearch && matchType;
  });

  const totalReceivable = parties.filter(p => p.currentBalance > 0).reduce((s, p) => s + Number(p.currentBalance), 0);
  const totalPayable = parties.filter(p => p.currentBalance < 0).reduce((s, p) => s + Math.abs(Number(p.currentBalance)), 0);

  const VISIBLE_ENTRIES = 10;

  return (
    <div className="flex flex-col h-full relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-emerald-950 border border-emerald-800 px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">{toast}</span>
        </div>
      )}
      {toastError && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-red-950 border border-red-800 px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2 max-w-sm">
          <X size={16} className="text-red-400 shrink-0" />
          <span className="text-sm font-medium text-red-300">{toastError}</span>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <PartyFormModal
          title="Add New Party"
          form={addForm}
          onChange={setAddForm}
          onClose={() => setShowAdd(false)}
          onSubmit={handleAddSubmit}
          submitting={adding}
          submitLabel="Save Party"
        />
      )}

      {/* Edit Modal */}
      {editParty && (
        <PartyFormModal
          title={`Edit — ${editParty.name}`}
          form={editForm}
          onChange={setEditForm}
          onClose={() => setEditParty(null)}
          onSubmit={handleEditSubmit}
          submitting={saving}
          submitLabel="Save Changes"
        />
      )}

      {/* Ledger Modal */}
      {ledgerParty && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="relative h-full w-full max-w-2xl overflow-y-auto bg-[#0a0c10] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-[#0a0c10]/95 backdrop-blur-sm px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Party Ledger</p>
                <p className="text-lg font-black text-white mt-0.5">{ledgerParty.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                  <Printer size={13} />
                  PDF / Print
                </button>
                <button onClick={() => setLedgerParty(null)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-800 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5">
              {ledgerLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={32} className="animate-spin text-indigo-500" />
                </div>
              ) : ledgerData ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Total Billed", value: ledgerData.summary.totalBilled, color: "text-white" },
                      { label: "Total Paid", value: ledgerData.summary.totalPaid, color: "text-emerald-400" },
                      { label: "Closing Balance", value: ledgerData.summary.closingBalance, color: ledgerData.summary.closingBalance >= 0 ? "text-emerald-400" : "text-red-400" },
                    ].map(card => (
                      <div key={card.label} className="rounded-xl border border-slate-800 bg-[#0f1117] p-4">
                        <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                        <p className={`text-base font-black font-mono ${card.color}`}>
                          {card.label === "Closing Balance" && card.value < 0 ? "−" : ""}
                          {fmt(card.value)}
                        </p>
                        {card.label === "Closing Balance" && (
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {ledgerData.summary.closingBalance >= 0 ? "Receivable" : "Payable"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Transaction table */}
                  <div className="rounded-xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/30">
                          {["Date", "Document", "Type", "Debit", "Credit", "Balance"].map(h => (
                            <th key={h} className="px-4 py-2.5 text-left font-semibold uppercase tracking-wider text-slate-600">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {(showAllEntries ? ledgerData.entries : ledgerData.entries.slice(-VISIBLE_ENTRIES)).map((entry, i) => (
                          <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-slate-400">{entry.date}</td>
                            <td className="px-4 py-2.5 font-mono font-bold text-indigo-400">{entry.docNumber}</td>
                            <td className="px-4 py-2.5 text-slate-500">{entry.docType}</td>
                            <td className="px-4 py-2.5 font-mono text-red-400">
                              {entry.debit > 0 ? fmt(entry.debit) : "—"}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-emerald-400">
                              {entry.credit > 0 ? fmt(entry.credit) : "—"}
                            </td>
                            <td className={`px-4 py-2.5 font-mono font-bold ${entry.balance >= 0 ? "text-slate-300" : "text-red-400"}`}>
                              {entry.balance < 0 ? "−" : ""}{fmt(entry.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {ledgerData.entries.length > VISIBLE_ENTRIES && (
                      <button onClick={() => setShowAllEntries(s => !s)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-300 border-t border-slate-800 hover:bg-slate-800/30 transition-all">
                        {showAllEntries ? <><ChevronUp size={13} /> Show Less</> : <><ChevronDown size={13} /> Show All {ledgerData.entries.length} Entries</>}
                      </button>
                    )}
                    {ledgerData.entries.length === 0 && (
                      <p className="text-center text-slate-600 py-8 text-sm">No transactions found</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-600 py-8">Failed to load ledger</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <h1 className="text-sm font-bold text-white flex items-center gap-2">
          <Users size={16} className="text-indigo-400" />
          Parties
        </h1>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
          <Plus size={15} />
          Add Party
        </button>
      </header>

      <div className="flex-1 px-8 py-8 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-500/20 bg-[#0a0c10] p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ArrowDownRight size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Receivable</p>
              <p className="text-xl font-black font-mono text-emerald-400">{fmt(totalReceivable)}</p>
              <p className="text-xs text-slate-600 mt-0.5">From customers</p>
            </div>
          </div>
          <div className="rounded-2xl border border-red-500/20 bg-[#0a0c10] p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <ArrowUpRight size={18} className="text-red-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Payable</p>
              <p className="text-xl font-black font-mono text-red-400">{fmt(totalPayable)}</p>
              <p className="text-xs text-slate-600 mt-0.5">To suppliers</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search party or GSTIN..."
              className="w-full rounded-xl bg-[#0f1117] border border-slate-700/60 pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all" />
            {voiceSupported && (
              <button type="button" onClick={listening ? stopListening : startListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${voiceError ? "text-amber-400" : listening ? "text-red-400 animate-pulse" : "text-slate-500 hover:text-indigo-400"}`}
                title={voiceError === "not-allowed" ? "Microphone permission denied" : voiceError === "no-speech" ? "No speech detected" : voiceError === "brave-blocked" ? "Blocked by Brave — enable in Shields settings or use Chrome" : listening ? "Click to stop" : "Voice search"}>
                <Mic size={14} />
              </button>
            )}
          </div>
          {(["ALL", "CUSTOMER", "SUPPLIER"] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${typeFilter === t ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <div className="col-span-2 py-16 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-indigo-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-slate-500">No parties found.</div>
          ) : (
            filtered.map(party => (
              <div key={party.id} className="group rounded-2xl border border-slate-800 bg-[#0a0c10] hover:border-slate-700 p-5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <Building2 size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-tight">{party.name}</p>
                      {party.gstin && (
                        <p className="text-xs font-mono text-slate-600 mt-0.5">{party.gstin}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_STYLE[party.type]}`}>
                      {party.type}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-600">
                  {party.phone && (
                    <div className="flex items-center gap-1.5 col-span-1">
                      <Phone size={11} className="text-slate-700 shrink-0" />
                      <span className="truncate">{party.phone}</span>
                    </div>
                  )}
                  {party.email && (
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Mail size={11} className="text-slate-700 shrink-0" />
                      <span className="truncate">{party.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} className="text-slate-700 shrink-0" />
                    <span>{party.stateName}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <IndianRupee size={12} className={party.currentBalance >= 0 ? "text-emerald-500" : "text-red-500"} />
                    <span className={`text-sm font-bold font-mono ${party.currentBalance >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmt(Number(party.currentBalance))}
                    </span>
                    <span className="text-xs text-slate-600 ml-1">
                      {party.currentBalance >= 0 ? "receivable" : "payable"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openLedger(party)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                      <BookOpen size={11} />
                      Ledger
                    </button>
                    <button onClick={() => openEdit(party)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                      <Pencil size={11} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(party)}
                      disabled={deleting === party.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition-all">
                      {deleting === party.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Shared party form modal ──────────────────────────────────────────────────

function PartyFormModal({
  title, form, onChange, onClose, onSubmit, submitting, submitLabel,
}: {
  title: string;
  form: { type: string; name: string; gstin: string; phone: string; email: string; address: string; stateCode: string };
  onChange: (f: any) => void;
  onClose: () => void;
  onSubmit: (e: React.SyntheticEvent) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#0a0c10] border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Party Type *</label>
              <select required value={form.type} onChange={e => onChange({ ...form, type: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500">
                <option value="CUSTOMER">Customer</option>
                <option value="SUPPLIER">Supplier</option>
                <option value="BOTH">Both</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Business Name *</label>
              <input required value={form.name} onChange={e => onChange({ ...form, name: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                placeholder="e.g. Sharma Traders" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">GSTIN</label>
              <input value={form.gstin} onChange={e => onChange({ ...form, gstin: e.target.value.toUpperCase() })}
                className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                placeholder="07AABCS..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">State *</label>
              <select required value={form.stateCode} onChange={e => onChange({ ...form, stateCode: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500">
                {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Phone</label>
              <input type="tel" value={form.phone} onChange={e => onChange({ ...form, phone: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                placeholder="98XXXXXXXX" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
              <input type="email" value={form.email} onChange={e => onChange({ ...form, email: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                placeholder="contact@..." />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2">
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
