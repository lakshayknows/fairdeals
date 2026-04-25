# Graph Report - .  (2026-04-24)

## Corpus Check
- Corpus is ~37,168 words - fits in a single context window. You may not need a graph.

## Summary
- 154 nodes · 189 edges · 37 communities detected
- Extraction: 83% EXTRACTED · 17% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Business Profile|Business Profile]]
- [[_COMMUNITY_Data Fetching|Data Fetching]]
- [[_COMMUNITY_Invoice Template|Invoice Template]]
- [[_COMMUNITY_GST Calculation|GST Calculation]]
- [[_COMMUNITY_Parties Management|Parties Management]]
- [[_COMMUNITY_Invoice Creation|Invoice Creation]]
- [[_COMMUNITY_Payments Dashboard|Payments Dashboard]]
- [[_COMMUNITY_Logging System|Logging System]]
- [[_COMMUNITY_Journal Entries|Journal Entries]]
- [[_COMMUNITY_Settings & Backup|Settings & Backup]]
- [[_COMMUNITY_Thermal Receipt|Thermal Receipt]]
- [[_COMMUNITY_Document Numbering|Document Numbering]]
- [[_COMMUNITY_Layout Components|Layout Components]]
- [[_COMMUNITY_Home Page|Home Page]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Invoices Page|Invoices Page]]
- [[_COMMUNITY_New Invoice Page|New Invoice Page]]
- [[_COMMUNITY_Edit Invoice Page|Edit Invoice Page]]
- [[_COMMUNITY_Print Layout|Print Layout]]
- [[_COMMUNITY_Login Page|Login Page]]
- [[_COMMUNITY_Parties Page|Parties Page]]
- [[_COMMUNITY_Ledger Print Layout|Ledger Print Layout]]
- [[_COMMUNITY_Currency Formatting|Currency Formatting]]
- [[_COMMUNITY_Products Page|Products Page]]
- [[_COMMUNITY_Print Client Button|Print Client Button]]
- [[_COMMUNITY_Financial Year Handler|Financial Year Handler]]
- [[_COMMUNITY_Print Button|Print Button]]
- [[_COMMUNITY_Voice Search Hook|Voice Search Hook]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Env|Next.js Env]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Page Component|Page Component]]
- [[_COMMUNITY_GST Warning Modal|GST Warning Modal]]
- [[_COMMUNITY_Database Functions|Database Functions]]
- [[_COMMUNITY_Validation Functions|Validation Functions]]
- [[_COMMUNITY_Types Index|Types Index]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 27 edges
2. `POST()` - 23 edges
3. `DELETE()` - 10 edges
4. `PUT()` - 10 edges
5. `Number()` - 8 edges
6. `fetchAccounts()` - 7 edges
7. `handleDelete()` - 6 edges
8. `handleAdd()` - 5 edges
9. `logError()` - 5 edges
10. `checkRateLimit()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `proxy()` --calls--> `GET()`  [INFERRED]
  src\proxy.ts → src\app\api\reports\route.ts
- `POST()` --calls--> `isIntraState()`  [INFERRED]
  src\app\api\profile\route.ts → src\lib\gst.ts
- `POST()` --calls--> `Number()`  [INFERRED]
  src\app\api\profile\route.ts → src\components\A4InvoiceTemplate.tsx
- `POST()` --calls--> `calcInvoiceTotals()`  [INFERRED]
  src\app\api\profile\route.ts → src\lib\gst.ts
- `POST()` --calls--> `getNextDocNumber()`  [INFERRED]
  src\app\api\profile\route.ts → src\lib\docNumber.ts

## Communities

### Community 0 - "Business Profile"
Cohesion: 0.11
Nodes (12): getBusinessProfile(), setBusinessProfile(), proxy(), checkRateLimit(), rateLimitKey(), DELETE(), ensureBackupDir(), GET() (+4 more)

### Community 1 - "Data Fetching"
Cohesion: 0.17
Nodes (8): fetchAccounts(), fetchData(), fmt(), handleAdd(), handleDelete(), handleDepreciate(), handleSave(), showToast()

### Community 2 - "Invoice Template"
Cohesion: 0.27
Nodes (7): Number(), fetchProducts(), handleAddSubmit(), handleAdjust(), handleEditSubmit(), openEdit(), showToast()

### Community 3 - "GST Calculation"
Cohesion: 0.24
Nodes (6): calcInvoiceTotals(), calcLineItem(), isIntraState(), round2(), PATCH(), PUT()

### Community 4 - "Parties Management"
Cohesion: 0.31
Nodes (5): fetchParties(), handleAddSubmit(), handleDelete(), handleEditSubmit(), showToast()

### Community 5 - "Invoice Creation"
Cohesion: 0.4
Nodes (2): executeSave(), handleSaveCheck()

### Community 6 - "Payments Dashboard"
Cohesion: 0.4
Nodes (0): 

### Community 7 - "Logging System"
Cohesion: 0.83
Nodes (3): ensureLogDir(), logError(), logInfo()

### Community 8 - "Journal Entries"
Cohesion: 0.67
Nodes (0): 

### Community 9 - "Settings & Backup"
Cohesion: 0.67
Nodes (0): 

### Community 10 - "Thermal Receipt"
Cohesion: 0.67
Nodes (0): 

### Community 11 - "Document Numbering"
Cohesion: 1.0
Nodes (2): getCurrentFinancialYear(), getNextDocNumber()

### Community 12 - "Layout Components"
Cohesion: 1.0
Nodes (0): 

### Community 13 - "Home Page"
Cohesion: 1.0
Nodes (0): 

### Community 14 - "Dashboard Page"
Cohesion: 1.0
Nodes (0): 

### Community 15 - "Invoices Page"
Cohesion: 1.0
Nodes (0): 

### Community 16 - "New Invoice Page"
Cohesion: 1.0
Nodes (0): 

### Community 17 - "Edit Invoice Page"
Cohesion: 1.0
Nodes (0): 

### Community 18 - "Print Layout"
Cohesion: 1.0
Nodes (0): 

### Community 19 - "Login Page"
Cohesion: 1.0
Nodes (0): 

### Community 20 - "Parties Page"
Cohesion: 1.0
Nodes (0): 

### Community 21 - "Ledger Print Layout"
Cohesion: 1.0
Nodes (0): 

### Community 22 - "Currency Formatting"
Cohesion: 1.0
Nodes (0): 

### Community 23 - "Products Page"
Cohesion: 1.0
Nodes (0): 

### Community 24 - "Print Client Button"
Cohesion: 1.0
Nodes (0): 

### Community 25 - "Financial Year Handler"
Cohesion: 1.0
Nodes (0): 

### Community 26 - "Print Button"
Cohesion: 1.0
Nodes (0): 

### Community 27 - "Voice Search Hook"
Cohesion: 1.0
Nodes (0): 

### Community 28 - "ESLint Config"
Cohesion: 1.0
Nodes (0): 

### Community 29 - "Next.js Env"
Cohesion: 1.0
Nodes (0): 

### Community 30 - "Next.js Config"
Cohesion: 1.0
Nodes (0): 

### Community 31 - "PostCSS Config"
Cohesion: 1.0
Nodes (0): 

### Community 32 - "Page Component"
Cohesion: 1.0
Nodes (0): 

### Community 33 - "GST Warning Modal"
Cohesion: 1.0
Nodes (0): 

### Community 34 - "Database Functions"
Cohesion: 1.0
Nodes (0): 

### Community 35 - "Validation Functions"
Cohesion: 1.0
Nodes (0): 

### Community 36 - "Types Index"
Cohesion: 1.0
Nodes (0): 

## Knowledge Gaps
- **Thin community `Layout Components`** (2 nodes): `RootLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Home Page`** (2 nodes): `Home()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Page`** (2 nodes): `DashboardPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Invoices Page`** (2 nodes): `InvoicesPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `New Invoice Page`** (2 nodes): `NewInvoicePage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Edit Invoice Page`** (2 nodes): `EditInvoicePage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Print Layout`** (2 nodes): `PrintLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Login Page`** (2 nodes): `LoginPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Parties Page`** (2 nodes): `PartiesPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Ledger Print Layout`** (2 nodes): `LedgerPrintLayout()`, `layout.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Currency Formatting`** (2 nodes): `fmtCurrency()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Products Page`** (2 nodes): `ProductsPage()`, `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Print Client Button`** (2 nodes): `PrintClientButton()`, `PrintClientButton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Financial Year Handler`** (2 nodes): `handleFyChange()`, `AppNav.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Print Button`** (2 nodes): `PrintButton()`, `PrintButton.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Voice Search Hook`** (2 nodes): `useVoiceSearch.ts`, `useVoiceSearch()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ESLint Config`** (1 nodes): `eslint.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Env`** (1 nodes): `next-env.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Next.js Config`** (1 nodes): `next.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `PostCSS Config`** (1 nodes): `postcss.config.mjs`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Page Component`** (1 nodes): `page.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `GST Warning Modal`** (1 nodes): `GSTEditWarningModal.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Database Functions`** (1 nodes): `db.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Validation Functions`** (1 nodes): `validators.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Types Index`** (1 nodes): `index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `GET()` connect `Business Profile` to `Invoice Template`, `Logging System`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `POST()` connect `Business Profile` to `Document Numbering`, `Invoice Template`, `GST Calculation`, `Logging System`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `Number()` connect `Invoice Template` to `Business Profile`, `GST Calculation`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `GET()` (e.g. with `main()` and `proxy()`) actually correct?**
  _`GET()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 9 inferred relationships involving `POST()` (e.g. with `DELETE()` and `checkRateLimit()`) actually correct?**
  _`POST()` has 9 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `DELETE()` (e.g. with `main()` and `POST()`) actually correct?**
  _`DELETE()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `PUT()` (e.g. with `isIntraState()` and `calcInvoiceTotals()`) actually correct?**
  _`PUT()` has 6 INFERRED edges - model-reasoned connections that need verification._