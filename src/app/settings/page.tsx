"use client";

import React, { useState, useEffect } from "react";
import {
  DownloadCloud,
  Building2,
  Database,
  ShieldCheck,
  Loader2,
  RotateCcw,
  Terminal,
  FileJson,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

type BackupType = "json" | "sql";

export default function SettingsPage() {
  const [downloading, setDownloading] = useState<BackupType | null>(null);
  const [saveToDisk] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  // Business Profile
  const [profile, setProfile] = useState({ name: "", gstin: "", address: "", stateCode: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(res => res.json()).then(data => setProfile(data));
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (res.ok) {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    }
    setSavingProfile(false);
  };

  const handleBackup = async (type: BackupType) => {
    setDownloading(type);
    try {
      const params = new URLSearchParams({ type, save: saveToDisk ? "true" : "false" });
      const res = await fetch(`/api/backup?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.details ?? err.error ?? "Backup failed");
      }
      const blob = await res.blob();
      const ext = type === "sql" ? "sql" : "json";
      const fileName = `fairdeals_backup_${new Date().toISOString().split("T")[0]}.${ext}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setLastBackup(new Date().toLocaleString("en-IN"));
    } catch (e: unknown) {
      alert(`Backup failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#070910] text-slate-300">
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-[#070910]/95 backdrop-blur-xl px-8 py-4">
        <h1 className="text-lg font-bold text-white">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl space-y-8">

          {/* Business Profile */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Business Profile</h2>
            <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <Building2 size={24} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">FairDeals Billing System</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Configure your official business information that appears on invoices and reports.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full rounded-xl bg-[#0f1117] border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">GSTIN</label>
                  <input
                    type="text"
                    value={profile.gstin}
                    onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                    className="w-full rounded-xl bg-[#0f1117] border border-slate-700 px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Registered Address</label>
                  <textarea
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl bg-[#0f1117] border border-slate-700 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">State Code</label>
                  <input
                    type="text"
                    value={profile.stateCode}
                    onChange={(e) => setProfile({ ...profile, stateCode: e.target.value })}
                    placeholder="e.g. 07"
                    className="w-full rounded-xl bg-[#0f1117] border border-slate-700 px-4 py-2.5 text-sm font-mono text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={saveProfile}
                  disabled={savingProfile}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Profile Updates"}
                </button>
                {profileSaved && (
                  <span className="flex items-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in">
                    <CheckCircle2 size={16} /> Saved! Updates will appear on new prints.
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Backup & Restore */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Backup & Restore</h2>

            {/* Backup Card */}
            <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] overflow-hidden">
              <div className="p-6 border-b border-slate-800/50 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Database size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Database Backup</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm">
                      Download a full snapshot of your database. JSON includes all records; SQL allows full restore via terminal.
                    </p>
                  </div>
                </div>

                {/* Options */}
                <label className="flex items-center gap-3 cursor-pointer opacity-40 pointer-events-none" title="Not available on Vercel serverless">
                  <div className="relative w-10 h-5 rounded-full transition-colors bg-slate-700">
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow translate-x-0.5" />
                  </div>
                  <span className="text-sm text-slate-400">
                    Save to server disk <span className="text-xs text-slate-600">(unavailable on Vercel)</span>
                  </span>
                </label>

                {lastBackup && (
                  <p className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 size={13} /> Last backup: {lastBackup}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleBackup("json")}
                    disabled={downloading !== null}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg active:scale-95"
                  >
                    {downloading === "json" ? <Loader2 size={15} className="animate-spin" /> : <FileJson size={15} />}
                    {downloading === "json" ? "Exporting..." : "Export JSON"}
                  </button>

                  <button
                    onClick={() => handleBackup("sql")}
                    disabled={downloading !== null}
                    className="flex items-center gap-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 px-4 py-2.5 text-sm font-bold text-white transition-all shadow-lg active:scale-95"
                  >
                    {downloading === "sql" ? <Loader2 size={15} className="animate-spin" /> : <DownloadCloud size={15} />}
                    {downloading === "sql" ? "Dumping..." : "Export SQL Dump"}
                  </button>
                </div>
              </div>

              <div className="bg-[#0f1117] px-6 py-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Recommended: run a backup weekly. Keep backups in a separate location (USB drive or cloud). The JSON contains personally identifiable information — store it securely.
                </p>
              </div>
            </div>

            {/* Restore Instructions */}
            <div className="rounded-2xl border border-amber-900/40 bg-amber-950/10 overflow-hidden">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <RotateCcw size={18} className="text-amber-400 shrink-0" />
                  <h3 className="text-base font-bold text-white">How to Restore After a Crash</h3>
                </div>

                <div className="space-y-3 text-sm text-slate-400">
                  <div className="space-y-1">
                    <p className="text-amber-400 font-semibold text-xs uppercase tracking-wide">Option A — Restore from JSON backup</p>
                    <div className="rounded-xl bg-[#0a0c10] border border-slate-800 p-3 font-mono text-xs text-emerald-300 space-y-1">
                      <p># Import JSON backup via the restore endpoint</p>
                      <p>curl -X POST https://billing.fairdeals365.com/api/backup \</p>
                      <p>{"  "}-H "Content-Type: application/json" \</p>
                      <p>{"  "}--data @fairdeals_backup_YYYY-MM-DD.json</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-amber-400 font-semibold text-xs uppercase tracking-wide">Option B — Re-sync schema to Azure SQL</p>
                    <div className="rounded-xl bg-[#0a0c10] border border-slate-800 p-3 font-mono text-xs text-emerald-300 space-y-1">
                      <p># Run locally with Azure DATABASE_URL in .env</p>
                      <p>npx prisma db push</p>
                      <p className="mt-1"># Then redeploy on Vercel</p>
                      <p>git push origin master</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-amber-400 font-semibold text-xs uppercase tracking-wide">Option C — Revert broken code</p>
                    <div className="rounded-xl bg-[#0a0c10] border border-slate-800 p-3 font-mono text-xs text-emerald-300 space-y-1">
                      <p>git log --oneline          # find a good commit</p>
                      <p>git reset --hard {"<"}commit{">"} # revert to it</p>
                      <p>git push --force origin master # redeploy on Vercel</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Security */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Security</h2>
            <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-indigo-400 shrink-0" />
                <h3 className="text-base font-bold text-white">Security Checklist</h3>
              </div>

              <ul className="space-y-3 text-sm">
                {[
                  {
                    ok: true,
                    label: "Credentials in .env",
                    detail: "DATABASE_URL and secrets are kept in .env — not hardcoded in source.",
                  },
                  {
                    ok: true,
                    label: ".env excluded from Git",
                    detail: ".gitignore blocks .env from being committed to version control.",
                  },
                  {
                    ok: true,
                    label: "Input validation with Zod",
                    detail: "All API inputs are validated — negative prices, invalid GSTINs, and malformed dates are rejected.",
                  },
                  {
                    ok: true,
                    label: "SQL injection via Prisma ORM",
                    detail: "All DB queries use parameterised statements. Raw SQL is not used.",
                  },
                  {
                    ok: true,
                    label: "API rate limiting",
                    detail: "Write endpoints capped at 30 req/min; read endpoints at 120 req/min.",
                  },
                  {
                    ok: true,
                    label: "Error logging",
                    detail: "Server errors are logged to logs/error.log for post-crash diagnosis.",
                  },
                  {
                    ok: true,
                    label: "Azure SQL Database secured",
                    detail: "Database hosted on Azure with firewall rules. SQL auth credentials stored in Vercel environment variables.",
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3">
                    {item.ok ? (
                      <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className={`font-semibold ${item.ok ? "text-slate-300" : "text-amber-300"}`}>{item.label}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Deployment */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Deployment</h2>
            <div className="rounded-2xl border border-slate-800 bg-[#0a0c10] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Terminal size={18} className="text-slate-400 shrink-0" />
                <h3 className="text-base font-bold text-white">Vercel + Azure SQL</h3>
              </div>
              <p className="text-sm text-slate-400">
                This app is deployed on Vercel (frontend + API) with Azure SQL Database (free tier, 32 GB). Every push to <code className="font-mono text-xs bg-slate-800 px-1 rounded">master</code> triggers an automatic redeploy.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Deploy a new version</p>
                <div className="rounded-xl bg-[#0f1117] border border-slate-800 p-3 font-mono text-xs text-emerald-300 space-y-1">
                  <p>git add -A</p>
                  <p>git commit -m "your change"</p>
                  <p>git push origin master   # Vercel auto-deploys</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-slate-500">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>View live logs at <code className="font-mono bg-slate-800 px-1 rounded">vercel.com → fairdeals → Deployments</code></span>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
