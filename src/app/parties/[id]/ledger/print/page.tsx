import React from "react";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PrintButton from "@/components/PrintButton";

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function PartyLedgerPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partyId = parseInt(id, 10);
  if (isNaN(partyId)) return notFound();

  const party = await prisma.party.findUnique({ where: { id: partyId } });
  if (!party) return notFound();

  const invoices = await prisma.invoice.findMany({
    where: { partyId, status: { not: "CANCELLED" } },
    include: { payments: { orderBy: { paymentDate: "asc" } } },
    orderBy: { date: "asc" },
  });

  type Entry = {
    date: string;
    particulars: string;
    docType: string;
    debit: number;
    credit: number;
    balance: number;
  };

  const entries: Entry[] = [];
  let runningBalance = 0;
  let totalBilled = 0;
  let totalPaid = 0;

  for (const inv of invoices) {
    const amount = Number(inv.totalAmount);
    const isDebit = inv.docType === "INVOICE" || inv.docType === "DEBIT_NOTE";

    if (isDebit) {
      runningBalance += amount;
      totalBilled += amount;
    } else {
      runningBalance -= amount;
    }

    entries.push({
      date: inv.date.toISOString().slice(0, 10),
      particulars: inv.docNumber,
      docType: inv.docType.replace("_", " "),
      debit: isDebit ? amount : 0,
      credit: isDebit ? 0 : amount,
      balance: runningBalance,
    });

    for (const pmt of inv.payments) {
      const pmtAmt = Number(pmt.amountPaid);
      if (isDebit) {
        runningBalance -= pmtAmt;
        totalPaid += pmtAmt;
      } else {
        runningBalance += pmtAmt;
        totalPaid += pmtAmt;
      }
      entries.push({
        date: pmt.paymentDate.toISOString().slice(0, 10),
        particulars: `Payment — ${inv.docNumber}`,
        docType: pmt.paymentMethod,
        debit: isDebit ? 0 : pmtAmt,
        credit: isDebit ? pmtAmt : 0,
        balance: runningBalance,
      });
    }
  }

  const closingBalance = Number(party.currentBalance);
  const businessName = process.env.BUSINESS_NAME || "FAIRDEALS BILLING";
  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ background: "#fff", color: "#000", padding: "20mm", minHeight: "100vh", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: "11px" }}>
      <style>{`
        @page { size: A4; margin: 10mm; }
        @media print { .no-print { display: none !important; } body { margin: 0; padding: 0; } }
        * { box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; }
        th, td { border: 1px solid #ccc; padding: 5px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: bold; text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        td.num { text-align: right; font-variant-numeric: tabular-nums; }
        td.center { text-align: center; }
        .header { border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; }
        .business-name { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
        .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; margin: 0 0 4px; }
        .party-block { border: 1px solid #ccc; padding: 10px 12px; border-radius: 4px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.08em; color: #555; }
        .value { font-size: 12px; font-weight: bold; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .summary-box { border: 1px solid #ccc; padding: 10px 12px; border-radius: 4px; text-align: center; }
        .summary-amount { font-size: 16px; font-weight: bold; font-variant-numeric: tabular-nums; }
        .debit { color: #c0392b; }
        .credit { color: #27ae60; }
        .balance-pos { color: #2c3e50; }
        .balance-neg { color: #c0392b; }
        .footer { margin-top: 20px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 9px; color: #555; display: flex; justify-content: space-between; }
        .print-btn { position: fixed; bottom: 24px; right: 24px; padding: 10px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(79,70,229,0.4); }
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <div className="business-name">{businessName}</div>
          <div style={{ fontSize: "11px", color: "#555", marginTop: "4px" }}>Account Statement / Party Ledger</div>
        </div>
        <div style={{ textAlign: "right", fontSize: "11px", color: "#555" }}>
          <div>Printed: {printDate}</div>
        </div>
      </div>

      {/* Party Info */}
      <div className="party-block">
        <div>
          <div className="label">Party Name</div>
          <div className="value">{party.name}</div>
        </div>
        {party.gstin && (
          <div>
            <div className="label">GSTIN</div>
            <div className="value" style={{ fontFamily: "monospace" }}>{party.gstin}</div>
          </div>
        )}
        <div>
          <div className="label">State</div>
          <div className="value">{party.stateName} ({party.stateCode})</div>
        </div>
        {party.phone && (
          <div>
            <div className="label">Phone</div>
            <div className="value">{party.phone}</div>
          </div>
        )}
        <div>
          <div className="label">Type</div>
          <div className="value">{party.type}</div>
        </div>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="summary-box">
          <div className="label" style={{ marginBottom: "6px" }}>Total Billed</div>
          <div className="summary-amount">₹{fmtCurrency(totalBilled)}</div>
        </div>
        <div className="summary-box">
          <div className="label" style={{ marginBottom: "6px" }}>Total Paid</div>
          <div className="summary-amount credit">₹{fmtCurrency(totalPaid)}</div>
        </div>
        <div className="summary-box" style={{ border: closingBalance > 0 ? "2px solid #c0392b" : closingBalance < 0 ? "2px solid #e67e22" : "1px solid #ccc" }}>
          <div className="label" style={{ marginBottom: "6px" }}>
            Closing Balance — {closingBalance >= 0 ? "Receivable" : "Payable"}
          </div>
          <div className={`summary-amount ${closingBalance >= 0 ? "debit" : "balance-neg"}`}>
            ₹{fmtCurrency(Math.abs(closingBalance))}
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="section-title" style={{ marginBottom: "8px" }}>Transaction History</div>
      <table>
        <thead>
          <tr>
            <th style={{ width: "90px" }}>Date</th>
            <th>Particulars</th>
            <th style={{ width: "80px" }}>Type</th>
            <th style={{ width: "100px" }}>Debit (Dr)</th>
            <th style={{ width: "100px" }}>Credit (Cr)</th>
            <th style={{ width: "110px" }}>Balance</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", color: "#888", padding: "20px" }}>No transactions found</td>
            </tr>
          ) : (
            entries.map((e, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td className="center" style={{ fontFamily: "monospace", fontSize: "10px" }}>{e.date}</td>
                <td style={{ fontFamily: "monospace", fontSize: "10px" }}>{e.particulars}</td>
                <td className="center" style={{ fontSize: "9px", textTransform: "uppercase" }}>{e.docType}</td>
                <td className="num" style={{ color: e.debit > 0 ? "#c0392b" : "#999" }}>
                  {e.debit > 0 ? `₹${fmtCurrency(e.debit)}` : "—"}
                </td>
                <td className="num" style={{ color: e.credit > 0 ? "#27ae60" : "#999" }}>
                  {e.credit > 0 ? `₹${fmtCurrency(e.credit)}` : "—"}
                </td>
                <td className="num" style={{ fontWeight: "bold", color: e.balance < 0 ? "#c0392b" : "#2c3e50" }}>
                  {e.balance < 0 ? "−" : ""}₹{fmtCurrency(Math.abs(e.balance))}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f0f0f0", fontWeight: "bold" }}>
            <td colSpan={3} style={{ textAlign: "right" }}>Closing Balance</td>
            <td className="num" style={{ color: "#c0392b" }}>₹{fmtCurrency(totalBilled)}</td>
            <td className="num" style={{ color: "#27ae60" }}>₹{fmtCurrency(totalPaid)}</td>
            <td className="num" style={{ color: closingBalance < 0 ? "#c0392b" : "#2c3e50" }}>
              {closingBalance < 0 ? "−" : ""}₹{fmtCurrency(Math.abs(closingBalance))}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      <div style={{ fontSize: "9px", color: "#777", marginTop: "8px" }}>
        <strong>Note:</strong> Dr (Debit) = Amount billed / owed to us. Cr (Credit) = Payment received / credit issued.
        {closingBalance > 0
          ? ` Closing balance of ₹${fmtCurrency(closingBalance)} is receivable from ${party.name}.`
          : closingBalance < 0
          ? ` Closing balance of ₹${fmtCurrency(Math.abs(closingBalance))} is payable to ${party.name}.`
          : " Account is fully settled."}
      </div>

      {/* Footer */}
      <div className="footer">
        <span>Generated by {businessName} • FairDeals Billing</span>
        <span>This is a computer-generated statement and does not require a signature.</span>
      </div>

      {/* Print button */}
      <div className="no-print">
        <PrintButton />
      </div>
    </div>
  );
}
