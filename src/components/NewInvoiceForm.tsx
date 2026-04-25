"use client";

import React, { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Plus, Trash2, Save, Loader2,
  AlertCircle, CheckCircle2, Building2, FileText,
  Package, Sparkles, ArrowRight, X,
} from "lucide-react";
import { INDIAN_STATES } from "@/types";
import { getCurrentFinancialYear } from "@/lib/docNumber";
import type { CalcResponse } from "@/app/api/invoices/calculate/route";

export async function calculateInvoice(payload: {
  partyStateCode: string;
  items: { productId: number; qty: number; unitPrice: number; discountPct: number }[];
}): Promise<CalcResponse | null> {
  try {
    const res = await fetch("/api/invoices/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface LineItem {
  _key: string;
  productId: string;
  productName: string;
  hsnCode: string;
  qty: string;
  unitPrice: string;
  discountPct: string;
  gstRateLabel: string;
}

type DocType = "INVOICE" | "ESTIMATE" | "PURCHASE";

interface ProductModel {
  id: number;
  name: string;
  sku: string;
  hsnCode: string;
  basePrice: number;
  gstConfig: { name: string; };
}

interface PartyModel {
  id: number;
  name: string;
  gstin: string | null;
  stateCode: string;
}

const fmtINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

const newLine = (): LineItem => ({
  _key: crypto.randomUUID(),
  productId: "", productName: "", hsnCode: "",
  qty: "1", unitPrice: "", discountPct: "0", gstRateLabel: "",
});

function Skeleton({ w = "w-full", h = "h-4" }: { w?: string; h?: string }) {
  return (
    <div className={`${w} ${h} rounded bg-slate-800 relative overflow-hidden`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-slate-700/40 to-transparent" />
    </div>
  );
}

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className={`block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 ${mono ? "font-mono" : ""}`}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-700/70 bg-[#0c0e14] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-700 focus:border-indigo-500/60 focus:bg-[#0e1018] focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all duration-150";

const monoInputCls = inputCls + " font-mono";

import GSTEditWarningModal from "./GSTEditWarningModal";

export default function NewInvoiceForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dbProducts, setDbProducts] = useState<ProductModel[]>([]);
  const [dbParties, setDbParties] = useState<PartyModel[]>([]);

  useEffect(() => {
    fetch("/api/products").then(r => { if (r.ok) r.json().then(setDbProducts); });
    fetch("/api/parties").then(r => { if (r.ok) r.json().then(setDbParties); });
  }, []);

  const [docType, setDocType] = useState<DocType>(initialData?.docType || "INVOICE");
  const [affectStock, setAffectStock] = useState(initialData?.affectStock ?? true);
  const [date, setDate] = useState(initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 10) : "");
  
  const [partyId, setPartyId] = useState<number | null>(initialData?.partyId || null);
  const [partyName, setPartyName] = useState(initialData?.party?.name || "");
  const [partyGstin, setPartyGstin] = useState(initialData?.party?.gstin || "");
  const [partyStateCode, setPartyStateCode] = useState(initialData?.party?.stateCode || "07");
  const [showPartySearch, setShowPartySearch] = useState(false);
  
  const [notes, setNotes] = useState(initialData?.notes || "");

  const [items, setItems] = useState<LineItem[]>(initialData?.items ? initialData.items.map((i: any) => ({
    _key: crypto.randomUUID(),
    productId: String(i.productId),
    productName: i.product?.name || "Unknown",
    hsnCode: i.product?.hsnCode || "",
    qty: String(i.qty),
    unitPrice: String(i.unitPrice),
    discountPct: String(i.discountPct),
    gstRateLabel: i.cgstPct ? `${Number(i.cgstPct) + Number(i.sgstPct) + Number(i.igstPct)}% (Historic)` : "Unknown",
  })) : [newLine()]);

  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [productQuery, setProductQuery] = useState("");

  const [calc, setCalc] = useState<CalcResponse | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
   const [isDirty, setIsDirty] = useState(false);
   const [fy, setFy] = useState("2024-25");
   const [docNumberMode, setDocNumberMode] = useState<'auto' | 'manual'>('auto');
   const [manualDocNumber, setManualDocNumber] = useState('');
   const [docNumberError, setDocNumberError] = useState<string | null>(null);
   const [docNumberValidating, setDocNumberValidating] = useState(false);

  // Warning Modal State
  const [showWarningModal, setShowWarningModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("financial-year");
    if (saved) setFy(saved);
  }, []);

   useEffect(() => { setIsDirty(true); }, [docType, date, dueDate, partyName, partyGstin, partyStateCode, notes, items]);

   // Validate manual document number in real-time
   useEffect(() => {
     if (docNumberMode === 'manual' && manualDocNumber.trim() !== '') {
       setDocNumberValidating(true);
       setDocNumberError(null);
       
       // Import the validation function dynamically to avoid circular dependencies
       import('@/lib/docNumber').then(({ isManualDocNumberAvailable }) => {
         const fy = localStorage.getItem('financial-year') || getCurrentFinancialYear();
         isManualDocNumberAvailable(manualDocNumber, fy).then((isAvailable) => {
           setDocNumberValidating(false);
           if (!isAvailable) {
             setDocNumberError('Document number already exists or invalid format');
           }
         }).catch(() => {
           setDocNumberValidating(false);
           setDocNumberError('Validation failed');
         });
       }).catch(() => {
         setDocNumberValidating(false);
         setDocNumberError('Failed to load validation');
       });
     } else {
       setDocNumberError(null);
       setDocNumberValidating(false);
     }
   }, [docNumberMode, manualDocNumber]);

  useEffect(() => {
    const readyItems = items.filter(
      (i) => i.productId && parseFloat(i.qty) > 0 && parseFloat(i.unitPrice) > 0
    );
    if (readyItems.length === 0) { setCalc(null); return; }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setCalculating(true);
      setCalcError(false);
      const result = await calculateInvoice({
        partyStateCode,
        items: readyItems.map((i) => ({
          productId: parseInt(i.productId, 10),
          qty: parseFloat(i.qty),
          unitPrice: parseFloat(i.unitPrice),
          discountPct: parseFloat(i.discountPct) || 0,
        })),
      });
      if (result) setCalc(result);
      else setCalcError(true);
      setCalculating(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [items, partyStateCode]);

  const updateItem = useCallback((key: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }, []);

  const handleSaveCheck = async () => {
    if (!partyName.trim()) { setSaveError("Customer name is required"); return; }
    if (date && fy) {
      const [startYearStr] = fy.split("-");
      const startYear = parseInt(startYearStr, 10);
      const fyStart = new Date(`${startYear}-04-01`);
      const fyEnd = new Date(`${startYear + 1}-03-31`);
      const invoiceDate = new Date(date);
      if (invoiceDate < fyStart || invoiceDate > fyEnd) {
        setSaveError(`Invoice date is outside selected Financial Year ${fy}.`);
        return;
      }
    }
    const readyItems = items.filter(i => i.productId && parseFloat(i.qty) > 0 && parseFloat(i.unitPrice) > 0);
    if (readyItems.length === 0) { setSaveError("Add at least one line item"); return; }

    if (initialData) {
      // It's an edit! Trigger GST warning
      setShowWarningModal(true);
    } else {
      executeSave(false);
    }
  };

     const executeSave = async (retainHistoric: boolean) => {
     setShowWarningModal(false);
     
     // Validate document number if in manual mode
     let docNumberToUse: string | null = null;
     if (docNumberMode === 'manual') {
       if (!manualDocNumber.trim()) {
         setSaveError("Please enter a document number");
         return;
       }
       
       // Final validation
       const fy = localStorage.getItem('financial-year') || getCurrentFinancialYear();
       const isAvailable = await isManualDocNumberAvailable(manualDocNumber, fy);
       if (!isAvailable) {
         setSaveError('Document number already exists or invalid format');
         return;
       }
       
       docNumberToUse = manualDocNumber.trim().toUpperCase();
     }
     
     setSaving(true);
     setSaveError(null);

     let finalPartyId = partyId;
     if (!finalPartyId) {
       const stateObj = INDIAN_STATES.find(s => s.code === partyStateCode);
       const stateName = stateObj ? stateObj.name : "Delhi";
       const pRes = await fetch("/api/parties", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ type: docType === "PURCHASE" ? "SUPPLIER" : "CUSTOMER", name: partyName, gstin: partyGstin || null, stateCode: partyStateCode, stateName })
       });
       if (pRes.ok) {
         const newParty = await pRes.json();
         finalPartyId = newParty.id;
       } else {
         setSaveError("Failed to create party.");
         setSaving(false);
         return;
       }
     }

     const readyItems = items.filter(i => i.productId && parseFloat(i.qty) > 0 && parseFloat(i.unitPrice) > 0);
     const bodyPayload = {
       docType, date, dueDate: dueDate || null, partyId: finalPartyId, notes, affectStock,
       retainHistoric,
       financialYear: typeof window !== "undefined" ? localStorage.getItem("financial-year") || undefined : undefined,
       ...(docNumberToUse !== null ? { docNumber: docNumberToUse } : {}),
       items: readyItems.map(i => ({
         productId: parseInt(i.productId, 10), qty: parseFloat(i.qty), unitPrice: parseFloat(i.unitPrice), discountPct: parseFloat(i.discountPct) || 0
       })),
     };

     const res = await fetch(initialData ? `/api/invoices/${initialData.id}` : "/api/invoices", {
       method: initialData ? "PUT" : "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(bodyPayload),
     });

     if (res.ok) {
       setIsDirty(false);
       startTransition(() => router.push(initialData ? `/invoices/${initialData.id}/print` : "/invoices"));
     } else {
       try {
         const data = await res.json();
         setSaveError(data.error?.slice(0, 100) || "Validation failed");
       } catch (e) {
         setSaveError("Failed to save invoice");
       }
     }
     setSaving(false);
   };

  const DOC_LABEL: Record<DocType, string> = {
    INVOICE: "Tax Invoice", ESTIMATE: "Estimate", PURCHASE: "Purchase Bill",
  };

  const filteredProducts = dbProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productQuery.toLowerCase()) ||
      p.hsnCode.toLowerCase().includes(productQuery.toLowerCase())
  );

  const filteredParties = dbParties.filter(
    (p) =>
      p.name.toLowerCase().includes(partyName.toLowerCase()) ||
      (p.gstin || "").toLowerCase().includes(partyName.toLowerCase())
  );

  return (
    <>
      <style>{`
        @keyframes shimmer { to { transform: translateX(200%); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.25s ease-out both; }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.10s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.20s; }
      `}</style>

      {isDirty && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full border border-amber-500/30 bg-[#0e0f14]/90 px-4 py-2 shadow-2xl backdrop-blur-md transition-all">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          <span className="text-xs font-semibold text-amber-300">Unsaved changes</span>
        </div>
      )}

      <div className="flex flex-col h-full">
        <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl">
          <div className="flex items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-800 hover:text-slate-200 transition-all"
              >
                <ChevronLeft size={14} />
                Back
              </button>
              <div className="h-4 w-px bg-slate-800" />
              <FileText size={14} className="text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">{initialData ? "Edit Document" : `New ${DOC_LABEL[docType]}`}</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-800 overflow-hidden bg-[#0c0e14]">
                {(["INVOICE", "ESTIMATE", "PURCHASE"] as DocType[]).map((dt) => (
                  <button
                    key={dt}
                    onClick={() => setDocType(dt)}
                    className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                      docType === dt
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:text-slate-300"
                    }`}
                  >
                    {dt === "INVOICE" ? "Invoice" : dt === "ESTIMATE" ? "Quote" : "Purchase"}
                  </button>
                ))}
              </div>

              {saveError && (
                <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
                  <AlertCircle size={12} /> {saveError}
                </span>
              )}

              <button
                onClick={handleSaveCheck}
                disabled={saving || isPending}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
              >
                {saving || isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Save size={13} />
                )}
                {initialData ? "Update & Save" : `Save ${DOC_LABEL[docType]}`}
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-[#0a0c12] p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                  <Building2 size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {docType === "PURCHASE" ? "Supplier" : "Customer"}
                  </span>
                </div>
                <div className="relative">
                  <Field label="Name *">
                    <input
                      value={partyName}
                      onChange={(e) => {
                        setPartyName(e.target.value);
                        setPartyId(null);
                        setShowPartySearch(true);
                      }}
                      onFocus={() => setShowPartySearch(true)}
                      onBlur={() => setTimeout(() => setShowPartySearch(false), 200)}
                      className={inputCls}
                      placeholder="Business name"
                      autoComplete="off"
                    />
                  </Field>
                  {showPartySearch && partyName && filteredParties.length > 0 && (
                    <div className="absolute left-0 top-full mt-1 w-full z-50 rounded-xl border border-slate-700 bg-[#0e1018] shadow-2xl overflow-hidden max-h-48 overflow-y-auto">
                      {filteredParties.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={() => {
                            setPartyName(p.name);
                            setPartyId(p.id);
                            setPartyGstin(p.gstin || "");
                            setPartyStateCode(p.stateCode);
                            setShowPartySearch(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-indigo-600/10 border-b border-slate-800/40 last:border-0"
                        >
                          <p className="text-sm text-slate-200">{p.name}</p>
                          {p.gstin && <p className="text-xs text-slate-500 font-mono">{p.gstin}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="GSTIN" mono>
                    <input
                      value={partyGstin}
                      onChange={(e) => { setPartyGstin(e.target.value.toUpperCase()); setPartyId(null); }}
                      maxLength={15}
                      className={monoInputCls}
                      placeholder="07AABCS1429B1ZB"
                    />
                  </Field>
                  <Field label="State">
                    <select
                      value={partyStateCode}
                      onChange={(e) => { setPartyStateCode(e.target.value); setPartyId(null); }}
                      className={inputCls}
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.code} – {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                    partyStateCode === "07"
                      ? "bg-emerald-500/8 border border-emerald-500/20 text-emerald-400"
                      : "bg-blue-500/8 border border-blue-500/20 text-blue-400"
                  }`}
                >
                  <Sparkles size={11} />
                  {partyStateCode === "07"
                    ? "Intra-state — CGST + SGST applies"
                    : "Inter-state — IGST applies"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0a0c12] p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
                  <FileText size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Document Details
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date *">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Due Date">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
                 <Field label="Document Number">
                   <div className="flex items-center gap-3">
                     <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                       <input
                         type="radio"
                         checked={docNumberMode === 'auto'}
                         onChange={() => {
                           setDocNumberMode('auto');
                           setManualDocNumber('');
                           setDocNumberError(null);
                         }}
                         className="h-4 w-4 text-indigo-600"
                       />
                       Auto
                     </label>
                     <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                       <input
                         type="radio"
                         checked={docNumberMode === 'manual'}
                         onChange={() => setDocNumberMode('manual')}
                         className="h-4 w-4 text-indigo-600"
                       />
                       Manual
                     </label>
                   </div>
                   {docNumberMode === 'auto' ? (
                     <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 mt-2">
                       <span className="text-xs font-mono text-slate-600">
                         {docType === "INVOICE" ? "INV" : docType === "ESTIMATE" ? "EST" : "PUR"}
                         /{fy}/
                       </span>
                       <span className="text-xs font-mono text-indigo-500 animate-pulse">AUTO</span>
                     </div>
                   ) : (
                     <>
                       <div className="relative mt-2">
                         <input
                           type="text"
                           value={manualDocNumber}
                           onChange={(e) => setManualDocNumber(e.target.value.trim().toUpperCase())}
                           className={inputCls + " font-mono w-full"}
                           placeholder="e.g., INV/2024-25/0001"
                         />
                         {docNumberValidating && (
                           <div className="absolute left-0 top-full mt-1 w-full">
                             <Loader2 size={11} className="text-indigo-500 animate-spin" />
                           </div>
                         )}
                       </div>
                       {docNumberError && (
                         <p className="mt-1 text-xs text-red-400">{docNumberError}</p>
                       )}
                     </>
                   )}
                 </Field>
                <Field label="Notes">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className={inputCls + " resize-none"}
                    placeholder="Terms, delivery notes…"
                  />
                </Field>
                {docType === "PURCHASE" && (
                  <div className="flex items-center justify-between mt-2 p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[11px] font-bold text-slate-200 block uppercase tracking-wider">Affect Stock</span>
                      <span className="text-[10px] text-slate-500 font-medium">Adds items to inventory</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={affectStock} 
                        onChange={(e) => setAffectStock(e.target.checked)} 
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0a0c12] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#0c0e14]">
                <div className="flex items-center gap-2">
                  <Package size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    Line Items
                  </span>
                  <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                    {items.length}
                  </span>
                </div>
                <button
                  onClick={() => setItems((p) => [...p, newLine()])}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-all"
                >
                  <Plus size={11} />
                  Add Row
                </button>
              </div>

              <div
                className="grid text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 border-b border-slate-800/60 bg-slate-900/20"
                style={{ gridTemplateColumns: "1fr 72px 110px 68px 110px 28px" }}
              >
                {["Product", "Qty", "Unit Price ₹", "Disc %", "GST Rate", ""].map((h) => (
                  <div key={h} className="px-3 py-2">
                    {h}
                  </div>
                ))}
              </div>

              <div className="divide-y divide-slate-800/40">
                {items.map((item, idx) => (
                  <div
                    key={item._key}
                    className="group grid items-center hover:bg-slate-800/10 transition-colors relative"
                    style={{ gridTemplateColumns: "1fr 72px 110px 68px 110px 28px" }}
                  >
                    <div className="px-3 py-2 relative">
                      <input
                        value={item.productName}
                        onChange={(e) => {
                          setProductQuery(e.target.value);
                          updateItem(item._key, { productName: e.target.value, productId: "", hsnCode: "" });
                          setActiveRow(item._key);
                        }}
                        onFocus={() => { setActiveRow(item._key); setProductQuery(item.productName); }}
                        onBlur={() => setTimeout(() => setActiveRow(null), 160)}
                        placeholder={`Item ${idx + 1}…`}
                        className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-700 outline-none"
                      />
                      {item.hsnCode && (
                        <p className="text-[10px] font-mono text-slate-700 mt-0.5">
                          HSN {item.hsnCode} · {item.gstRateLabel}
                        </p>
                      )}
                      {activeRow === item._key && productQuery && filteredProducts.length > 0 && (
                        <div className="absolute left-0 top-full mt-0.5 w-80 z-50 rounded-xl border border-slate-700 bg-[#0e1018] shadow-2xl overflow-hidden max-h-64 overflow-y-auto shrink-0">
                          {filteredProducts.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => {
                                updateItem(item._key, {
                                  productId: String(p.id),
                                  productName: p.name,
                                  hsnCode: p.hsnCode,
                                  unitPrice: String(p.basePrice),
                                  gstRateLabel: p.gstConfig?.name || "N/A",
                                });
                                setProductQuery("");
                                setActiveRow(null);
                              }}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-indigo-600/10 text-left transition-colors border-b border-slate-800/40 last:border-0"
                            >
                              <div>
                                <p className="text-sm font-medium text-slate-200">{p.name}</p>
                                <p className="text-[10px] font-mono text-slate-600 mt-0.5">
                                  {p.sku} · HSN {p.hsnCode} · {p.gstConfig?.name || "N/A"}
                                </p>
                              </div>
                              <div className="text-right ml-3 shrink-0">
                                <p className="text-sm font-mono font-bold text-indigo-300">₹{p.basePrice}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="px-3 py-2 border-l border-slate-800/40">
                      <input
                        type="number"
                        value={item.qty}
                        min={0.001}
                        step={0.001}
                        onChange={(e) => updateItem(item._key, { qty: e.target.value })}
                        className="w-full bg-transparent text-sm font-mono text-slate-300 text-right outline-none"
                      />
                    </div>

                    <div className="px-3 py-2 border-l border-slate-800/40 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-700 pointer-events-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={item.unitPrice}
                        min={0}
                        step={0.01}
                        onChange={(e) => updateItem(item._key, { unitPrice: e.target.value })}
                        className="w-full bg-transparent text-sm font-mono text-slate-300 text-right outline-none pl-4"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="px-3 py-2 border-l border-slate-800/40">
                      <input
                        type="number"
                        value={item.discountPct}
                        min={0}
                        max={100}
                        step={0.5}
                        onChange={(e) => updateItem(item._key, { discountPct: e.target.value })}
                        className="w-full bg-transparent text-sm font-mono text-slate-300 text-right outline-none"
                      />
                    </div>

                    <div className="px-3 py-2 border-l border-slate-800/40">
                      <span className={`text-xs font-mono ${item.gstRateLabel ? "text-slate-400" : "text-slate-700"}`}>
                        {item.gstRateLabel || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-center border-l border-slate-800/40">
                      <button
                        onClick={() => setItems((p) => p.filter((i) => i._key !== item._key))}
                        disabled={items.length === 1}
                        className="p-1 rounded text-slate-800 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:pointer-events-none"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setItems((p) => [...p, newLine()])}
                className="w-full flex items-center justify-center gap-2 border-t border-slate-800/60 py-2.5 text-xs font-semibold text-slate-700 hover:text-slate-400 hover:bg-slate-800/20 transition-all"
              >
                <Plus size={11} />
                Add another line
              </button>
            </div>
          </div>

          <aside className="w-72 shrink-0 border-l border-slate-800/60 flex flex-col bg-[#08090d]">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800/60">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
                GST Preview
              </span>
              {calculating && (
                <Loader2 size={11} className="ml-auto text-indigo-500 animate-spin" />
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              <div
                className={`rounded-lg border px-3 py-2 text-[11px] font-bold flex items-center gap-2 ${
                  partyStateCode === "07"
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                    : "border-blue-500/20 bg-blue-500/5 text-blue-400"
                }`}
              >
                <CheckCircle2 size={11} />
                {partyStateCode === "07" ? "CGST + SGST" : "IGST"}
              </div>

              {calculating && !calc && (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center gap-3">
                      <Skeleton w="w-24" h="h-3" />
                      <Skeleton w="w-16" h="h-3" />
                    </div>
                  ))}
                </div>
              )}

              {calcError && !calculating && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-400">
                  <AlertCircle size={12} />
                  Calculation failed
                </div>
              )}

              {calc && !calculating && (
                <div className="space-y-1 fade-up">
                  {calc.lines.map((line, i) => (
                    <div key={i} className={`rounded-lg border border-slate-800/50 bg-[#0c0e14] p-3 space-y-1.5 fade-up stagger-${Math.min(i + 1, 4)}`}>
                      <p className="text-[11px] font-semibold text-slate-400 truncate">{line.productName}</p>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                          <span>Taxable</span>
                          <span>₹{fmtINR(line.taxableValue)}</span>
                        </div>
                        {calc.isIntraState ? (
                          <>
                            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                              <span>CGST {line.cgstRate}%</span>
                              <span>₹{fmtINR(line.cgstAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                              <span>SGST {line.sgstRate}%</span>
                              <span>₹{fmtINR(line.sgstAmount)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                            <span>IGST {line.igstRate}%</span>
                            <span>₹{fmtINR(line.igstAmount)}</span>
                          </div>
                        )}
                        {line.cessAmount > 0 && (
                          <div className="flex justify-between text-[10px] text-amber-600 font-mono">
                            <span>Cess</span>
                            <span>₹{fmtINR(line.cessAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-[11px] font-semibold font-mono text-slate-300 border-t border-slate-800 pt-1 mt-1">
                          <span>Line Total</span>
                          <span>₹{fmtINR(line.lineTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!calc && !calculating && !calcError && (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-700">
                  <div className="h-10 w-10 rounded-xl border border-slate-800 flex items-center justify-center">
                    <ArrowRight size={16} className="text-slate-800" />
                  </div>
                  <p className="text-xs text-center leading-relaxed">
                    Add a product with qty &amp; price to see GST breakdown
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800/60 px-5 py-4 space-y-2 bg-[#08090d]">
              {calculating ? (
                <div className="space-y-2">
                  <Skeleton h="h-3" />
                  <Skeleton h="h-3" w="w-3/4" />
                  <Skeleton h="h-5" />
                </div>
              ) : calc ? (
                <>
                  <div className="flex justify-between text-xs text-slate-500 font-mono">
                    <span>Subtotal</span>
                    <span>₹{fmtINR(calc.subtotal)}</span>
                  </div>
                  {calc.isIntraState ? (
                    <>
                      <div className="flex justify-between text-xs text-slate-500 font-mono">
                        <span>CGST</span>
                        <span>₹{fmtINR(calc.cgstTotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500 font-mono">
                        <span>SGST</span>
                        <span>₹{fmtINR(calc.sgstTotal)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-xs text-slate-500 font-mono">
                      <span>IGST</span>
                      <span>₹{fmtINR(calc.igstTotal)}</span>
                    </div>
                  )}
                  {calc.cessTotal > 0 && (
                    <div className="flex justify-between text-xs text-amber-600 font-mono">
                      <span>Cess</span>
                      <span>₹{fmtINR(calc.cessTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700/60 pt-2.5 mt-2.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-slate-400">Grand Total</span>
                      <span className="text-xl font-black font-mono text-white fade-up">
                        ₹{fmtINR(calc.grandTotal)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-700 mt-1 font-mono">
                      {calc.isIntraState ? "CGST + SGST" : "IGST"} inclusive
                    </p>
                  </div>

                  <button
                    onClick={handleSaveCheck}
                    disabled={saving || isPending}
                    className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/15"
                  >
                    {saving || isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    {initialData ? "Update & Save" : `Save ${DOC_LABEL[docType]}`}
                  </button>
                </>
              ) : (
                <p className="text-xs text-slate-700 text-center py-2">
                  Totals appear here
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>
      <GSTEditWarningModal
        show={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onChoice={(choice) => executeSave(choice === "RETAIN_HISTORIC")}
      />
    </>
  );
}
