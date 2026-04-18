"use client";

import React from "react";
import { Printer } from "lucide-react";

export default function PrintButton({ invoiceId }: { invoiceId?: string }) {
  React.useEffect(() => {
    if (invoiceId) {
      const key = `print_count_inv_${invoiceId}`;
      const prints = parseInt(localStorage.getItem(key) || "0", 10);
      
      const labelEl = document.getElementById("copy-type-label");
      if (labelEl) {
        labelEl.innerText = prints > 0 ? "DUPLICATE COPY" : "ORIGINAL FOR RECIPIENT";
      }

      localStorage.setItem(key, (prints + 1).toString());
    }

    const timer = setTimeout(() => window.print(), 800);
    return () => clearTimeout(timer);
  }, [invoiceId]);

  return (
    <button
      onClick={() => window.print()}
      className="no-print bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2.5 text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 flex items-center gap-2"
      style={{ cursor: "pointer" }}
    >
      <Printer size={16} />
      Print Document
    </button>
  );
}
