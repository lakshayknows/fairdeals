import React from "react";

export default function LedgerPrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-shell">
      <style>{`
        body { background: white !important; color: black !important; margin: 0 !important; padding: 0 !important; }
        .ml-56 { margin-left: 0 !important; }
        nav { display: none !important; }
      `}</style>
      {children}
    </div>
  );
}
