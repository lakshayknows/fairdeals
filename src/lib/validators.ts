import { z } from "zod";

// ─── GSTIN ───────────────────────────────────────────────────────────────────

export const gstinSchema = z
  .string()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    "Invalid GSTIN format. Expected: 07AABCS1429B1ZB"
  )
  .optional()
  .nullable();

// ─── HSN Code ────────────────────────────────────────────────────────────────

export const hsnCodeSchema = z
  .string()
  .regex(/^[0-9]{4,8}$/, "HSN code must be 4–8 digits");

// ─── Party ───────────────────────────────────────────────────────────────────

export const createPartySchema = z.object({
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"]).default("CUSTOMER"),
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  gstin: gstinSchema,
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()
    .nullable(),
  email: z.string().email("Invalid email").optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  stateCode: z
    .string()
    .regex(/^[0-9]{2}$/, "State code must be 2 digits (e.g. 07 for Delhi)"),
  stateName: z.string().min(2).max(50),
});

// ─── Product ─────────────────────────────────────────────────────────────────

export const createProductSchema = z.object({
  sku: z.string().max(50).transform(v => v.trim() === "" ? undefined : v).optional(),
  name: z.string().min(1).max(255),
  hsnCode: hsnCodeSchema,
  basePrice: z.number().positive("Base price must be positive"),
  taxInclusive: z.boolean().default(false),
  gstRate: z.number().min(0).max(100).default(18),
  cessRate: z.number().min(0).max(100).default(0),
  stockQty: z.number().min(0).default(0),
  lowStockAlert: z.number().min(0).default(10),
  allowNegativeStock: z.boolean().default(false),
  unit: z.string().max(20).default("PCS"),
});

// ─── Invoice ─────────────────────────────────────────────────────────────────

export const invoiceItemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  discountPct: z.number().min(0).max(100).default(0),
});

export const createInvoiceSchema = z.object({
  docType: z
    .enum(["INVOICE", "ESTIMATE", "PURCHASE", "CREDIT_NOTE", "DEBIT_NOTE"])
    .default("INVOICE"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  partyId: z.number().int().positive(),
  notes: z.string().max(2000).optional().nullable(),
  affectStock: z.boolean().default(true).optional(),
  financialYear: z.string().max(10).optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

// ─── Payment ─────────────────────────────────────────────────────────────────

export const recordPaymentSchema = z.object({
  invoiceId: z.number().int().positive(),
  amount: z
    .number()
    .positive("Payment amount must be positive")
    .multipleOf(0.01),
  method: z.enum(["UPI", "CASH", "BANK", "CHEQUE", "OTHER"]),
  referenceId: z.string().max(100).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
  paymentDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  bankAccountId: z.number().int().positive().optional().nullable(),
});

// ─── Update schemas (for PUT endpoints) ──────────────────────────────────────

export const updateProductSchema = createProductSchema.partial();

export const updatePartySchema = createPartySchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  "At least one field must be provided"
);

// ─── Bank Account ─────────────────────────────────────────────────────────────

export const createBankAccountSchema = z.object({
  accountName: z.string().min(2).max(100),
  bankName: z.string().min(2).max(100),
  accountNumber: z.string().min(5).max(20),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code (e.g. SBIN0001234)"),
});

// ─── Query params ─────────────────────────────────────────────────────────────

export const invoiceListQuerySchema = z.object({
  status: z.enum(["DRAFT", "UNPAID", "PARTIAL", "PAID", "CANCELLED"]).optional(),
  docType: z.enum(["INVOICE", "ESTIMATE", "PURCHASE", "CREDIT_NOTE", "DEBIT_NOTE"]).optional(),
  financialYear: z.string().optional(),
  partyId: z.coerce.number().int().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
