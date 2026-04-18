// Re-export Prisma-generated enums for use across the app
export type { InvoiceStatus, DocType, PaymentMethod, PartyType } from "@prisma/client";

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiError {
  error: string | Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface PendingInvoiceSummary {
  id: number;
  docNumber: string;
  customer: string;
  gstin: string | null;
  date: string;
  dueDate: string | null;
  amount: number;
  balanceDue: number;
  status: "UNPAID" | "PARTIAL";
  state: string;
}

export interface DashboardStats {
  totalOutstanding: number;
  partialCount: number;
  dueTodayCount: number;
  paidThisMonth: number;
}

// ─── GST Types ───────────────────────────────────────────────────────────────

export interface GstBreakdown {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
  isIntraState: boolean;
}

// ─── Indian State Codes ───────────────────────────────────────────────────────

export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
];
