"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  Settings,
  TrendingUp,
  ChevronRight,
  CalendarDays,
  Landmark,
  Receipt,
  Scale,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV = [
  { href: "/dashboard",      label: "Dashboard",     icon: LayoutDashboard, group: "main",  exact: false },
  { href: "/invoices",       label: "Invoices",      icon: FileText,        group: "main",  exact: false },
  { href: "/products",       label: "Products",      icon: Package,         group: "main",  exact: false },
  { href: "/parties",        label: "Parties",       icon: Users,           group: "main",  exact: false },
  { href: "/accounts",       label: "Accounts/Ledger", icon: Landmark,      group: "accounting",  exact: false },
  { href: "/expenses",       label: "Expenses",      icon: FileText,        group: "accounting",  exact: false },
  { href: "/income",         label: "Income",        icon: FileText,        group: "accounting",  exact: false },
  { href: "/fixed-assets",   label: "Fixed Assets",  icon: Package,         group: "accounting",  exact: false },
  { href: "/journal",        label: "Journal Entries", icon: FileText,      group: "accounting",  exact: false },
  { href: "/reports",        label: "Reports",       icon: TrendingUp,      group: "more",  exact: true  },
  { href: "/reports/balance-sheet", label: "Balance Sheet", icon: Scale,   group: "more",  exact: false },
  { href: "/reports/gst",    label: "GST Filing",    icon: Receipt,         group: "more",  exact: false },
  { href: "/settings",       label: "Settings",      icon: Settings,        group: "more",  exact: false },
];

export default function AppNav() {
  const pathname = usePathname();
  // Footer — FY badge
  const [fy, setFy] = useState("2024-25");
  useEffect(() => {
    const saved = localStorage.getItem("financial-year");
    if (saved) setFy(saved);
  }, []);

  const handleFyChange = (newFy: string) => {
    setFy(newFy);
    localStorage.setItem("financial-year", newFy);
    // Reload to refresh the DB sequences
    window.location.reload();
  };

  const renderNavGroup = (groupName: string, title: string) => (
    <div className={title ? "pt-4" : ""}>
      {title && (
        <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-700">
          {title}
        </p>
      )}
      {NAV.filter(n => n.group === groupName).map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : (pathname === href || pathname.startsWith(href + "/"));
        return (
          <Link key={href} href={href}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Icon size={16} className={active ? "text-indigo-400" : "text-slate-600 group-hover:text-slate-400"} />
            {label}
            {active && <ChevronRight size={12} className="ml-auto text-indigo-500" />}
          </Link>
        );
      })}
    </div>
  );

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 flex flex-col bg-[#08090d] border-r border-slate-800/60 z-30 no-print">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
        <div className="h-9 w-9 rounded-lg overflow-hidden border border-slate-800 shrink-0">
          <img src="/logo.jpg" alt="Logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-white leading-none" style={{ fontFamily: "var(--font-display)" }}>
            FairDeals
          </p>
          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
            Billing
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {renderNavGroup("main", "Menu")}
        {renderNavGroup("accounting", "Accounting")}
        {renderNavGroup("more", "More")}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800/60 bg-[#0c0e14]/50">
        <div className="flex items-center justify-between mb-1.5 ml-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Financial Year
          </label>
          <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
            {fy}
          </span>
        </div>
        <div className="relative group">
          <CalendarDays size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50 group-hover:text-amber-500 transition-colors" />
          <select 
            value={fy} 
            onChange={(e) => handleFyChange(e.target.value)}
            className="w-full bg-[#0a0c12] border border-amber-500/10 hover:border-amber-500/30 text-amber-500/90 rounded-xl px-8 py-2.5 text-xs font-bold appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all outline-none"
          >
            <option value="2023-24">2023 – 24</option>
            <option value="2024-25">2024 – 25</option>
            <option value="2025-26">2025 – 26</option>
          </select>
          <ChevronRight size={10} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-700 pointer-events-none" />
        </div>
      </div>
    </aside>
  );
}
