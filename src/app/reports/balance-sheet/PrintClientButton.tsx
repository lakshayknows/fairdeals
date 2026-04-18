"use client";

import { Printer } from "lucide-react";

export default function PrintClientButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl shadow-slate-900/20 transition-all active:scale-95"
    >
      <Printer size={16} />
      Print Document
    </button>
  );
}
