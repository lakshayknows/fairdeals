"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText } from "lucide-react";
import AppNav from "@/components/AppNav";

interface JournalEntry {
  id: number;
  date: string;
  amount: number;
  type: "DEBIT" | "CREDIT";
  description: string;
  referenceType: string;
  account: {
    name: string;
    type: string;
  };
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    const res = await fetch("/api/journal");
    if (res.ok) {
      setEntries(await res.json());
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex h-screen bg-[#070910] text-slate-200 font-sans">
      <AppNav />
      <main className="flex-1 ml-56 flex flex-col h-full overflow-hidden relative">
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/80 backdrop-blur-md px-8 py-4 flex items-center justify-between">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-400" />
            Journal Entries
          </h1>
          <a href="/journal/new" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-bold text-white shadow-lg transition-colors">
            + New Entry
          </a>
        </header>

        <div className="p-8 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 text-indigo-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
              <FileText size={32} className="text-slate-700 mb-3" />
              <p className="text-sm font-medium text-slate-400">No journal entries found</p>
            </div>
          ) : (
            <div className="bg-[#0c0e14] border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID / Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Account</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Details</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right text-indigo-400/80">Debit (Dr)</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right text-emerald-400/80">Credit (Cr)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {entries.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-800/20 transition-colors group">
                      <td className="px-6 py-4 align-top w-32">
                        <div className="font-semibold text-sm text-slate-200">#J{String(entry.id).padStart(4, '0')}</div>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono uppercase">{formatDate(entry.date)}</div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="font-semibold text-sm text-slate-200">
                          {entry.account?.name || "Unknown Account"}
                        </div>
                        <div className="text-[10px] font-medium text-slate-500 mt-1">
                          {entry.account?.type}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top w-1/3">
                        {entry.description && (
                          <p className="text-xs text-slate-400 leading-snug">{entry.description}</p>
                        )}
                        {entry.referenceType && (
                          <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-800 text-[9px] uppercase tracking-wider font-bold text-slate-400 rounded">
                            {entry.referenceType}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 align-top text-right text-sm font-mono text-indigo-300 font-medium">
                        {entry.type === "DEBIT" ? `₹${Number(entry.amount).toFixed(2)}` : ""}
                      </td>
                      <td className="px-6 py-4 align-top text-right text-sm font-mono text-emerald-300 font-medium">
                        {entry.type === "CREDIT" ? `₹${Number(entry.amount).toFixed(2)}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
