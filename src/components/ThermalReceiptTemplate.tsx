import React from "react";

function fmt(n: number | null | undefined): string {
  if (n == null) return "0.00";
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function ThermalReceiptTemplate({ invoice, profile }: { invoice: any; profile: any }) {
  const businessName = profile?.name || "FAIRDEALS BILLING";
  const businessAddress = profile?.address || "New Delhi, 110001";
  const businessGstin = profile?.gstin || "N/A";

  return (
    <>
      <style>{`
        @page { size: 80mm auto; margin: 0; }
        .thermal-body { 
          font-family: 'Consolas', 'Courier New', monospace; 
          font-size: 11px; 
          color: #000; 
          background: #fff;
          width: 80mm;
          margin: auto;
          line-height: 1.2;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        @media print {
          body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #fff; }
          .thermal-body { width: 100%; box-shadow: none; padding: 2mm; overflow: hidden; }
          .no-print { display: none !important; }
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .border-dashed { border-bottom: 1px dashed #000; margin: 5px 0; }
        .border-top-dashed { border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
        .flex-between { display: flex; justify-content: space-between; }
        .mb-2 { margin-bottom: 8px; }
        .mt-2 { margin-top: 8px; }
        .break-words { word-break: break-all; }
      `}</style>

      <div className="thermal-body bg-white py-4 px-2 shadow-lg border border-slate-300 mx-auto min-h-[100px]">
        {/* HEADER */}
        <div className="text-center mb-2">
          <h1 className="font-bold text-[14px]">{businessName}</h1>
          <p className="text-[10px] break-words">{businessAddress}</p>
          <p className="text-[10px]">GSTIN: {businessGstin}</p>
        </div>

        <div className="text-center font-bold text-[12px] mb-2">
          {invoice.docType === "INVOICE" ? "TAX INVOICE" : invoice.docType}
          <div id="copy-type-label" className="text-[9px] font-normal">ORIGINAL FOR RECIPIENT</div>
        </div>

        <div className="border-dashed"></div>

        {/* DETAILS */}
        <div className="text-[10px] mb-2">
          <div className="flex-between">
            <span>Bill No:</span>
            <span className="font-bold">{invoice.docNumber}</span>
          </div>
          <div className="flex-between">
            <span>Date:</span>
            <span>{invoice.date.toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="flex-between">
            <span>Customer:</span>
            <span className="font-bold text-right" style={{maxWidth: '120px'}}>{invoice.party.name}</span>
          </div>
        </div>

        <div className="border-dashed"></div>

        {/* ITEMS */}
        <table style={{ width: "100%", fontSize: "10px", marginTop: "5px" }}>
          <thead>
            <tr style={{ borderBottom: "1px dashed #000" }}>
              <th style={{ textAlign: "left", paddingBottom: "2px", width: "40%" }}>Item</th>
              <th style={{ textAlign: "right", paddingBottom: "2px" }}>Qty</th>
              <th style={{ textAlign: "right", paddingBottom: "2px" }}>Rate</th>
              <th style={{ textAlign: "right", paddingBottom: "2px" }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item: any) => (
              <tr key={item.id}>
                <td style={{ padding: "4px 0", maxWidth: '100px', wordWrap: 'break-word' }}>{item.product?.name}</td>
                <td style={{ textAlign: "right" }}>{Number(item.qty)}</td>
                <td style={{ textAlign: "right" }}>{fmt(Number(item.unitPrice))}</td>
                <td style={{ textAlign: "right" }}>{fmt(Number(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-top-dashed border-dashed"></div>

        {/* TOTALS */}
        <div className="text-[10px] space-y-1">
          <div className="flex-between">
            <span>Subtotal:</span>
            <span>{fmt(Number(invoice.subtotal))}</span>
          </div>
          {Number(invoice.cgstTotal) > 0 && (
            <div className="flex-between">
              <span>CGST:</span>
              <span>{fmt(Number(invoice.cgstTotal))}</span>
            </div>
          )}
          {Number(invoice.sgstTotal) > 0 && (
            <div className="flex-between">
              <span>SGST:</span>
              <span>{fmt(Number(invoice.sgstTotal))}</span>
            </div>
          )}
          <div className="border-top-dashed flex-between font-bold text-[12px] mt-1">
            <span>Total:</span>
            <span>₹{fmt(Number(invoice.totalAmount))}</span>
          </div>
          <div className="flex-between mt-1 pt-1 border-t border-dotted border-gray-400">
            <span>Paid:</span>
            <span>₹{fmt(Number(invoice.totalAmount) - Number(invoice.balanceDue))}</span>
          </div>
          <div className="flex-between font-bold text-[11px] mt-0.5">
            <span>Balance:</span>
            <span>₹{fmt(Number(invoice.balanceDue))}</span>
          </div>
        </div>

        <div className="border-dashed"></div>

        {/* FOOTER */}
        <div className="text-center text-[9px] mt-4 mb-2 opacity-80">
          <p>Thank you for your business!</p>
          <p>Goods once sold are not returnable.</p>
        </div>
      </div>
    </>
  );
}
