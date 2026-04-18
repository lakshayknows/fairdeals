# FairDeals Billing Agent Guide

## Setup Commands (run in order)
1. `npm install`
2. `npx prisma generate`
3. `npx prisma db push`
4. `npm run dev`

## Critical Notes
- **Environment Variables**: Must set `DATABASE_URL`, `BUSINESS_STATE_CODE` (2-digit), `BUSINESS_GSTIN` in `.env`
- **Next.js Version**: Uses Next.js 16.2.2 (App Router) - check `node_modules/next/dist/docs/` for breaking changes
- **Database**: Prisma ORM with MariaDB/MySQL. Schema in `prisma/schema.prisma`
- **GST Calculation**: 
  - Same state (party_state_code == business_state_code): CGST + SGST
  - Different state: IGST
  - See README for exact formulas
- **Document Numbering**: Format `{PREFIX}/{FY}/{SEQUENCE}` (e.g., `INV/2024-25/0001`). Financial year resets April 1.
- **API Structure**:
  - `/api/invoices` - Invoice CRUD
  - `/api/payments` - Record payments  
  - `/api/parties` - Customers/suppliers
  - `/api/products` - Products & stock
- **Code Organization**:
  - Frontend: `src/app/` (App Router)
  - Backend: `src/app/api/`
  - Shared: `src/lib/` (db, GST, docNumber, validators)
- **Linting**: Run `npm run lint` (uses ESLint)