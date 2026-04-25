"use client";

import { useState, useEffect } from "react";
import {
  Package, Plus, Search, AlertTriangle,
  TrendingDown, TrendingUp,
  X, Loader2, CheckCircle2, Pencil, Mic
} from "lucide-react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";

interface Product {
  id: number;
  sku: string;
  name: string;
  hsnCode: string;
  basePrice: number | string;
  unit: string;
  stockQty: number | string;
  lowStockAlert: number | string;
  taxInclusive: boolean;
  allowNegativeStock: boolean;
  gstConfig: { name: string; cgstRate: number | string };
  gstConfigId?: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28, 40];
const CESS_RATES = [0, 1, 3, 12, 15, 17, 21, 22, 36, 60, 160, 204, 290];

const emptyForm = {
  name: "", sku: "", hsnCode: "", basePrice: "", unit: "PCS",
  stockQty: "0", lowStockAlert: "10", gstRate: "18", cessRate: "0",
  usageType: "INVENTORY",
};

interface ProductFormData {
  name: string; sku: string; hsnCode: string; basePrice: string;
  unit: string; stockQty: string; lowStockAlert: string;
  gstRate: string; cessRate: string;
  usageType: string;
}

function ProductFormFields({
  form,
  onChange,
  isEdit,
}: {
  form: ProductFormData;
  onChange: (f: ProductFormData) => void;
  isEdit?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2 space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">Product Name *</label>
        <input required value={form.name} onChange={e => onChange({ ...form, name: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
          placeholder="e.g. Cotton Fabric" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">Usage Type *</label>
        <select required value={form.usageType} onChange={e => onChange({ ...form, usageType: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500">
          <option value="INVENTORY">Inventory for Sale</option>
          <option value="ASSET">Business Asset</option>
          <option value="EXPENSE">Expense</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">SKU <span className="normal-case text-slate-600 font-normal">(optional)</span></label>
        <input value={form.sku} onChange={e => onChange({ ...form, sku: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
          placeholder="Auto-generated if blank" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">HSN Code *</label>
        <input required value={form.hsnCode} onChange={e => onChange({ ...form, hsnCode: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
          placeholder="4-8 digits" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">Base Price (₹) *</label>
        <input required type="number" step="0.01" value={form.basePrice}
          onChange={e => onChange({ ...form, basePrice: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
          placeholder="0.00" />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">GST Rate (%) *</label>
        <select required value={form.gstRate} onChange={e => onChange({ ...form, gstRate: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500">
          {GST_RATES.map(rate => <option key={rate} value={rate}>{rate}%</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">Cess Rate (%) (Optional)</label>
        <select value={form.cessRate} onChange={e => onChange({ ...form, cessRate: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500">
          {CESS_RATES.map(rate => <option key={rate} value={rate}>{rate === 0 ? "None (0%)" : `${rate}%`}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">Unit</label>
        <input value={form.unit} onChange={e => onChange({ ...form, unit: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
          placeholder="PCS, KGS, MTR" />
      </div>
      {!isEdit && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase">Initial Stock</label>
          <input type="number" value={form.stockQty} onChange={e => onChange({ ...form, stockQty: e.target.value })}
            className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500" />
        </div>
      )}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase">Low Stock Alert</label>
        <input type="number" value={form.lowStockAlert} onChange={e => onChange({ ...form, lowStockAlert: e.target.value })}
          className="w-full bg-[#0f1117] border border-slate-700/60 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500" />
      </div>
    </div>
  );
}

export default function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const { listening, supported: voiceSupported, error: voiceError, startListening, stopListening } = useVoiceSearch(setSearch);

  // Adjust stock state
  const [adjustId, setAdjustId] = useState<number | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  // Add modal state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ProductFormData>(emptyForm);
  const [adding, setAdding] = useState(false);

  // Edit modal state
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { fetchProducts(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) setProducts(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.hsnCode.includes(q);
    const matchLow = !showLowOnly || Number(p.stockQty) <= Number(p.lowStockAlert);
    return matchSearch && matchLow;
  });

  const lowCount = products.filter(p => Number(p.stockQty) <= Number(p.lowStockAlert)).length;

  const handleAdjust = async (product: Product) => {
    const adj = parseFloat(adjustQty);
    if (isNaN(adj) || adj === 0) return;
    setAdjusting(true);
    try {
      const res = await fetch(`/api/products/${product.id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustment: adj }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(p =>
          p.id === product.id ? { ...p, stockQty: Math.max(0, Number(p.stockQty) + adj) } : p
        ));
        showToast(`Stock updated for "${product.name}"`);
      }
    } finally {
      setAdjusting(false);
      setAdjustId(null);
      setAdjustQty("");
    }
  };

  const handleAddSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          ...(addForm.sku.trim() && { sku: addForm.sku.trim() }),
          hsnCode: addForm.hsnCode,
          basePrice: Number(addForm.basePrice),
          unit: addForm.unit,
          stockQty: Number(addForm.stockQty),
          lowStockAlert: Number(addForm.lowStockAlert),
          gstRate: Number(addForm.gstRate),
          cessRate: Number(addForm.cessRate),
          usageType: addForm.usageType,
        }),
      });

      if (res.ok) {
        showToast("Product added successfully");
        setShowAdd(false);
        setAddForm(emptyForm);
        fetchProducts();
      } else {
        const errorData = await res.json();
        if (errorData.error?.fieldErrors) {
          const msg = Object.entries(errorData.error.fieldErrors)
            .map(([f, errs]) => `${f}: ${(errs as string[]).join(", ")}`)
            .join("\n");
          alert(`Validation Error:\n${msg}`);
        } else {
          alert(errorData.error || "Failed to add product");
        }
      }
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (product: Product) => {
    const gstRate = Number(product.gstConfig.cgstRate) * 2;
    setEditForm({
      name: product.name,
      sku: product.sku,
      hsnCode: product.hsnCode,
      basePrice: String(product.basePrice),
      unit: product.unit,
      stockQty: String(product.stockQty),
      lowStockAlert: String(product.lowStockAlert),
      gstRate: String(gstRate),
      cessRate: "0",
      usageType: "INVENTORY", // Assuming we didn't add it to product type yet, this is safe fallback
    });
    setEditProduct(product);
  };

  const handleEditSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          sku: editForm.sku,
          hsnCode: editForm.hsnCode,
          basePrice: Number(editForm.basePrice),
          unit: editForm.unit,
          lowStockAlert: Number(editForm.lowStockAlert),
          gstRate: Number(editForm.gstRate),
          cessRate: Number(editForm.cessRate),
          usageType: editForm.usageType,
        }),
      });

      if (res.ok) {
        showToast(`"${editForm.name}" updated`);
        setEditProduct(null);
        fetchProducts();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to update product");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-2xl bg-emerald-950 border border-emerald-800 px-5 py-3.5 shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">{toast}</span>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0a0c10] border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Add New Product</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <ProductFormFields form={addForm} onChange={setAddForm} />
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={adding} className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2">
                  {adding && <Loader2 size={14} className="animate-spin" />}
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0a0c10] border border-slate-800 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Edit Product</h2>
              <button onClick={() => setEditProduct(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <ProductFormFields form={editForm} onChange={setEditForm} isEdit />
              <p className="text-xs text-slate-600">Use "Adjust Stock" in the table to change stock quantity.</p>
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button type="button" onClick={() => setEditProduct(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-sm font-bold text-white flex items-center gap-2">
            <Package size={16} className="text-sky-400" />
            Products & Inventory
          </h1>
          {!loading && lowCount > 0 && (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-400">
              <AlertTriangle size={11} />
              {lowCount} low stock
            </span>
          )}
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
          <Plus size={15} />
          Add Product
        </button>
      </header>

      <div className="flex-1 px-8 py-8 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, SKU, HSN..."
              className="w-full rounded-xl bg-[#0f1117] border border-slate-700/60 pl-9 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 outline-none transition-all" />
            {voiceSupported && (
              <button type="button" onClick={listening ? stopListening : startListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${voiceError ? "text-amber-400" : listening ? "text-red-400 animate-pulse" : "text-slate-500 hover:text-indigo-400"}`}
                title={voiceError === "not-allowed" ? "Microphone permission denied" : voiceError === "no-speech" ? "No speech detected" : voiceError === "brave-blocked" ? "Blocked by Brave — enable in Shields settings or use Chrome" : listening ? "Click to stop" : "Voice search"}>
                <Mic size={14} />
              </button>
            )}
          </div>
          <button onClick={() => setShowLowOnly(p => !p)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all ${showLowOnly ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}>
            <AlertTriangle size={13} />
            Low Stock Only
          </button>
          {!loading && <span className="text-xs text-slate-700 font-mono ml-auto">{filtered.length} products</span>}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800/60 bg-slate-900/20">
                {["SKU", "Product Name", "HSN Code", "Base Price", "GST", "Unit", "Stock", "Alert", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <Loader2 size={24} className="animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <TrendingDown size={24} />
                      <p className="text-sm">No products found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(p => {
                  const isLow = Number(p.stockQty) <= Number(p.lowStockAlert);
                  const isAdjusting = adjustId === p.id;
                  return (
                    <tr key={p.id} className="group hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-semibold text-indigo-400">{p.sku}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{p.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{p.hsnCode}</td>
                      <td className="px-5 py-3.5 font-mono text-sm text-slate-300">{fmt(Number(p.basePrice))}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400">{p.gstConfig?.name}</td>
                      <td className="px-5 py-3.5 text-xs font-bold text-slate-500">{p.unit}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-mono text-sm font-bold ${isLow ? "text-amber-400" : "text-emerald-400"}`}>
                          {p.stockQty}
                          {isLow && <AlertTriangle size={11} className="inline ml-1.5 mb-0.5" />}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{p.lowStockAlert}</td>
                      <td className="px-5 py-3.5">
                        {isAdjusting ? (
                          <div className="flex items-center gap-2">
                            <input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                              placeholder="±qty"
                              className="w-20 rounded-lg bg-[#0f1117] border border-slate-700 px-2 py-1.5 text-xs text-white font-mono focus:border-indigo-500 outline-none"
                              autoFocus
                              onKeyDown={e => e.key === "Enter" && handleAdjust(p)}
                            />
                            <button onClick={() => handleAdjust(p)} disabled={adjusting}
                              className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition-all">
                              {adjusting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                            </button>
                            <button onClick={() => { setAdjustId(null); setAdjustQty(""); }}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-slate-800 transition-all">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEdit(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                              <Pencil size={11} />
                              Edit
                            </button>
                            <button onClick={() => setAdjustId(p.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white hover:border-slate-500 transition-all">
                              <TrendingUp size={11} />
                              Adjust
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
