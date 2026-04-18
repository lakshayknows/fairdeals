import React from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  show: boolean;
  onClose: () => void;
  onChoice: (choice: "RETAIN_HISTORIC" | "APPLY_CURRENT") => void;
}

export default function GSTEditWarningModal({ show, onClose, onChoice }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c0e14] border border-amber-900/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl shadow-amber-900/20 fade-up">
        <div className="p-6 bg-gradient-to-r from-amber-500/10 to-transparent flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="text-amber-500 w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-100">Historical Tax Match Warning</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              The government's GST rates for some items in this invoice have changed since this bill was originally generated. Recalculating now may alter the historical balance and liability of this finalized document.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-4 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">How would you like to proceed?</h4>
          
          <button
            onClick={() => onChoice("RETAIN_HISTORIC")}
            className="w-full text-left p-4 rounded-xl border-2 border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors group flex items-start gap-4"
          >
            <div className="w-5 h-5 rounded-full border-2 border-emerald-500/50 group-hover:border-emerald-500 flex items-center justify-center mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Retain Original GST Rates</p>
              <p className="text-xs text-slate-500 mt-1">Keep the exact tax percentages (CGST/SGST) that were used when this document was first created.</p>
            </div>
          </button>

          <button
            onClick={() => onChoice("APPLY_CURRENT")}
            className="w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors group flex items-start gap-4"
          >
             <div className="w-5 h-5 rounded-full border-2 border-slate-600 group-hover:border-amber-500 flex items-center justify-center mt-0.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Apply New Current Rates</p>
              <p className="text-xs text-slate-500 mt-1">Force an update using today's configured tax margins. This will change the Grand Total and recorded liabilities.</p>
            </div>
          </button>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <button onClick={onClose} className="text-sm font-bold text-slate-400 hover:text-slate-200 px-4 py-2">
            Cancel Update
          </button>
        </div>
      </div>
    </div>
  );
}
