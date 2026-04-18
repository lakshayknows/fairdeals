import React from "react";

function fmt(n: number | null | undefined): string {
  if (n == null) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function A4InvoiceTemplate({ invoice, profile }: { invoice: any; profile: any }) {
  const businessName = profile?.name || "FAIRDEALS BILLING SOLUTIONS";
  const businessAddress = profile?.address || "123 Market Road, First Floor, Phase-2\nNew Delhi, 110001, India";
  const businessGstin = profile?.gstin || "07AAACXXXXXXXXX";
  const businessStateCode = profile?.stateCode || "07 (Delhi)";

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        .a4-body { font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: #fff; }
        .print-container { max-width: 210mm; min-height: 296mm; margin: 0 auto; background: #fff; }
        .grid-half { display: grid; grid-template-columns: 1fr 1fr; }
      `}</style>

      <div className="a4-body">
        <div className="print-container flex flex-col border border-slate-200">
          
          {/* HEADER */}
          <div className="px-10 pt-10 pb-6 border-b-[3px] border-indigo-600 flex justify-between items-start">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-3xl shrink-0">
                {businessName.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase leading-none">{businessName}</h1>
                <p className="text-[11px] text-slate-500 mt-2 font-medium leading-relaxed whitespace-pre-wrap">{businessAddress}</p>
                <div className="mt-1 flex gap-4 text-[11px] font-semibold text-slate-600">
                  <span>GSTIN: <span className="text-slate-800">{businessGstin}</span></span>
                  <span>STATE: <span className="text-slate-800">{businessStateCode}</span></span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-black text-indigo-100 tracking-widest uppercase" style={{ WebkitTextStroke: "1px #4f46e5", color: "transparent" }}>
                {invoice.docType === "INVOICE" ? "TAX INVOICE" : invoice.docType}
              </h2>
              <p id="copy-type-label" className="text-[10px] font-semibold text-slate-500 mt-2">ORIGINAL FOR RECIPIENT</p>
            </div>
          </div>

          {/* INFO SECTION */}
          <div className="grid-half divide-x divide-slate-200 border-b border-slate-200">
            <div className="p-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-3">Billed To</p>
              <h3 className="text-base font-bold text-slate-800">{invoice.party.name}</h3>
              {invoice.party.address && <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">{invoice.party.address}</p>}
              
              <div className="mt-4 space-y-1">
                {invoice.party.gstin ? (
                  <p className="text-[11px] font-semibold text-slate-600">GSTIN: <span className="font-bold text-slate-800">{invoice.party.gstin}</span></p>
                ) : (
                  <p className="text-[11px] font-bold text-slate-400">UNREGISTERED (B2C)</p>
                )}
                {invoice.party.stateCode && (
                  <p className="text-[11px] font-semibold text-slate-600">State Code: <span className="font-bold text-slate-800">{invoice.party.stateCode}</span></p>
                )}
              </div>
            </div>
            
            <div className="p-8 bg-slate-50/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-3">Document Details</p>
              <table className="w-full text-left text-[11px] border-collapse">
                <tbody>
                  <tr>
                    <td className="py-1.5 font-semibold text-slate-500">Invoice No.</td>
                    <td className="py-1.5 font-bold text-slate-800 text-right">{invoice.docNumber}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 font-semibold text-slate-500">Invoice Date</td>
                    <td className="py-1.5 font-bold text-slate-800 text-right">{invoice.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td className="py-1.5 font-semibold text-slate-500">Due Date</td>
                      <td className="py-1.5 font-bold text-slate-800 text-right">{invoice.dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-200">
                    <td className="py-2 mt-1 font-semibold text-slate-500">Document Status</td>
                    <td className="py-2 mt-1 font-black text-right uppercase tracking-wider" style={{ color: invoice.status === 'PAID' ? '#10b981' : invoice.status === 'UNPAID' ? '#ef4444' : '#f59e0b' }}>
                      {invoice.status}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ITEMS TABLE */}
          <div className="flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="py-3 px-3 pl-8 text-[10px] font-bold uppercase tracking-widest text-slate-600 w-12">#</th>
                  <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">Item Description</th>
                  <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-center w-16">HSN</th>
                  <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right w-20">Rate</th>
                  <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right w-16">Qty</th>
                  <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right w-16">Disc</th>
                  <th className="py-3 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 text-right w-24 pr-8">Taxable Val</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item: any, idx: number) => (
                  <tr key={item.id} className="text-[11px]">
                    <td className="py-3 px-3 pl-8 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{item.product?.name}</p>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500">{item.product?.hsnCode || "-"}</td>
                    <td className="py-3 px-3 text-right text-slate-700">₹{fmt(Number(item.unitPrice))}</td>
                    <td className="py-3 px-3 text-right text-slate-700 font-semibold">{Number(item.qty)} {item.product?.unit || 'PCS'}</td>
                    <td className="py-3 px-3 text-right text-slate-500">
                      {Number(item.discountPct) > 0 ? `${Number(item.discountPct)}%` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800 pr-8">₹{fmt(Number(item.taxableValue))}</td>
                  </tr>
                ))}
                {/* Fill empty space if few items */}
                {Array.from({ length: Math.max(0, 5 - invoice.items.length) }).map((_, i) => (
                  <tr key={`empty-${i}`} className="text-[11px] h-10">
                    <td colSpan={7}></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SUMMARY SECTION */}
          <div className="grid-half border-t border-slate-300">
            
            <div className="p-8 border-r border-slate-200 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Terms & Conditions</p>
                <ul className="text-[9px] text-slate-500 space-y-1 list-disc pl-4 marker:text-slate-300">
                  <li>Goods once sold will not be taken back or exchanged.</li>
                  <li>Interest @ 18% p.a. will be charged if payment is delayed beyond due date.</li>
                  <li>All disputes are subject to local jurisdiction only.</li>
                  <li>E. & O.E.</li>
                </ul>
                
                {invoice.notes && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded text-[10px] text-slate-700 whitespace-pre-wrap">
                    <span className="font-bold block mb-1">Notes:</span>
                    {invoice.notes}
                  </div>
                )}
              </div>
              
              <div className="mt-12 pt-6 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-800">For {businessName}</p>
                <div className="h-16"></div>
                <p className="text-[9px] font-semibold text-slate-500 uppercase">Authorized Signatory</p>
              </div>
            </div>
            
            <div className="p-0 bg-slate-50">
              <table className="w-full text-[11px]">
                <tbody>
                  <tr>
                    <td className="py-3 px-8 font-semibold text-slate-600">Total Taxable Value</td>
                    <td className="py-3 px-8 font-bold text-slate-800 text-right">₹{fmt(Number(invoice.subtotal))}</td>
                  </tr>
                  {Number(invoice.cgstTotal) > 0 && (
                    <tr>
                      <td className="py-2.5 px-8 font-medium text-slate-500">Add: CGST</td>
                      <td className="py-2.5 px-8 font-semibold text-slate-700 text-right">₹{fmt(Number(invoice.cgstTotal))}</td>
                    </tr>
                  )}
                  {Number(invoice.sgstTotal) > 0 && (
                    <tr>
                      <td className="py-2.5 px-8 font-medium text-slate-500">Add: SGST / UTGST</td>
                      <td className="py-2.5 px-8 font-semibold text-slate-700 text-right">₹{fmt(Number(invoice.sgstTotal))}</td>
                    </tr>
                  )}
                  {Number(invoice.igstTotal) > 0 && (
                    <tr>
                      <td className="py-2.5 px-8 font-medium text-slate-500">Add: IGST</td>
                      <td className="py-2.5 px-8 font-semibold text-slate-700 text-right">₹{fmt(Number(invoice.igstTotal))}</td>
                    </tr>
                  )}
                  {Number(invoice.cessTotal) > 0 && (
                    <tr>
                      <td className="py-2.5 px-8 font-medium text-slate-500">Add: CESS</td>
                      <td className="py-2.5 px-8 font-semibold text-slate-700 text-right">₹{fmt(Number(invoice.cessTotal))}</td>
                    </tr>
                  )}
                  <tr className="bg-indigo-600 text-white">
                    <td className="py-4 px-8 font-bold text-base uppercase tracking-wider">Grand Total</td>
                    <td className="py-4 px-8 font-black text-xl text-right">₹{fmt(Number(invoice.totalAmount))}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="px-8 py-6">
                <table className="w-full text-[11px]">
                  <tbody>
                    <tr>
                      <td className="py-1.5 font-semibold text-slate-500">Amount Paid</td>
                      <td className="py-1.5 font-bold text-emerald-600 text-right">₹{fmt(Number(invoice.totalAmount) - Number(invoice.balanceDue))}</td>
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="py-2 mt-1 font-bold text-slate-800">Balance Due</td>
                      <td className="py-2 mt-1 font-black text-rose-600 text-right text-lg">₹{fmt(Number(invoice.balanceDue))}</td>
                    </tr>
                  </tbody>
                </table>
                
                {invoice.status === 'PAID' && (
                  <div className="mt-4 p-3 border-2 border-emerald-500 rounded flex items-center justify-center">
                    <span className="text-emerald-500 font-black tracking-widest text-xl rotate-[-5deg] opacity-80 uppercase">PAID IN FULL</span>
                  </div>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
