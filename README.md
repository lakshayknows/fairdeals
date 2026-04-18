# FairDeals Billing

A production-grade GST billing and inventory management system for Indian businesses, built with Next.js, Prisma, and MariaDB.

## Features

- **GST Engine** — Automatic CGST/SGST (intra-state) vs IGST (inter-state) calculation with optional Compensation Cess
- **Invoice Management** — Auto-numbered documents (INV, EST, PUR) with Financial Year resets
- **Payment Tracking** — Partial payment support with real-time balance updates
- **Inventory Control** — Stock deduction on invoicing with negative-stock prevention
- **Pending Payments Dashboard** — Visual overview of all outstanding receivables with quick Record Payment action
- **GSTIN Validation** — Strict format validation for all party identifiers

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 15 (App Router), TypeScript |
| Styling     | Tailwind CSS                        |
| ORM         | Prisma                              |
| Database    | MariaDB 10.x / MySQL 8.0+           |
| Validation  | Zod                                 |
| Icons       | Lucide React                        |

## Project Structure

```
fairdeals-billing/
├── prisma/
│   └── schema.prisma          # Database schema (ORM layer)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── invoices/      # Invoice CRUD + create
│   │   │   ├── payments/      # Record payment endpoint
│   │   │   ├── products/      # Product & stock management
│   │   │   └── parties/       # Customer/supplier endpoints
│   │   ├── dashboard/         # Pending payments dashboard
│   │   └── layout.tsx
│   ├── components/
│   │   └── PendingPaymentsDashboard.tsx
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── gst.ts             # GST calculation engine
│   │   ├── docNumber.ts       # Auto-numbering logic
│   │   └── validators.ts      # Zod schemas
│   └── types/
│       └── index.ts           # Shared TypeScript types
├── SCHEMA.md                  # Full SQL schema reference
└── README.md
```

## Setup

### 1. Database

```bash
# Start MariaDB and create the database
mysql -u root -p -e "CREATE DATABASE fairdeals CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 2. Environment Variables

```bash
cp .env.example .env
```

```env
DATABASE_URL="mysql://root:password@localhost:3306/fairdeals"
BUSINESS_STATE_CODE="07"
BUSINESS_GSTIN="07XXXXX..."
```

### 3. Install & Run

```bash
npm install
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) for the Pending Payments Dashboard.

## GST Calculation Logic

```
Same State (party_state_code == business_state_code):
  CGST = taxable_value × (gst_rate / 2)
  SGST = taxable_value × (gst_rate / 2)
  IGST = 0

Different State:
  IGST = taxable_value × gst_rate

Cess (if enabled):
  Cess = taxable_value × cess_rate

Total = subtotal + CGST + SGST + IGST + Cess
```

## Document Numbering

Format: `{PREFIX}/{FY}/{SEQUENCE}`

- `INV/2024-25/0001` — First invoice of FY 2024-25
- `EST/2024-25/0042` — 42nd estimate
- Financial year resets automatically on April 1st

## API Endpoints

| Method | Endpoint                    | Description                     |
|--------|-----------------------------|---------------------------------|
| GET    | `/api/invoices`             | List invoices (filter by status) |
| POST   | `/api/invoices`             | Create new invoice              |
| GET    | `/api/invoices/[id]`        | Get invoice detail              |
| POST   | `/api/payments`             | Record payment for invoice      |
| GET    | `/api/parties`              | List customers/suppliers        |
| POST   | `/api/parties`              | Create party                    |
| GET    | `/api/products`             | List products with stock        |
| POST   | `/api/products`             | Create product                  |
| PATCH  | `/api/products/[id]/stock`  | Adjust stock manually           |

## GSTIN Format

```
Format: 2-digit state code + 10-char PAN + 1 entity + Z + 1 checksum
Example: 07AABCS1429B1ZB
Regex:   /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
```
