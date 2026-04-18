# FairDeals Billing — SQL Schema Reference (MariaDB / MySQL 8.0+)

## Entity Relationship Overview

```
Products ──────────────┐
                       ▼
GST_Config ────► Invoice_Items ◄──── Invoices ◄──── Payments
                                         │
Customers/Suppliers ◄────────────────────┘
```

---

## Table Definitions

### `products`

| Column             | Type                    | Constraints               | Notes                          |
|--------------------|-------------------------|---------------------------|--------------------------------|
| id                 | INT UNSIGNED            | PK, AUTO_INCREMENT        |                                |
| sku                | VARCHAR(50)             | UNIQUE, NOT NULL          | Unique product code            |
| name               | VARCHAR(255)            | NOT NULL                  |                                |
| hsn_code           | VARCHAR(8)              | NOT NULL                  | 4–8 digit HSN code             |
| base_price         | DECIMAL(15,2)           | NOT NULL                  | Pre-tax price                  |
| tax_inclusive      | TINYINT(1)              | DEFAULT 0                 | 1 = price includes GST         |
| gst_config_id      | INT UNSIGNED            | FK → gst_config(id)       |                                |
| stock_qty          | DECIMAL(10,3)           | DEFAULT 0                 | Supports fractional units      |
| low_stock_alert    | DECIMAL(10,3)           | DEFAULT 10                |                                |
| allow_negative_stock | TINYINT(1)            | DEFAULT 0                 | Override for stock safety      |
| unit               | VARCHAR(20)             | DEFAULT 'PCS'             | NOS, KG, LTR, MTR, etc.       |
| created_at         | DATETIME                | DEFAULT CURRENT_TIMESTAMP |                                |
| updated_at         | DATETIME                | ON UPDATE CURRENT_TIMESTAMP |                              |

```sql
CREATE TABLE products (
  id                   INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  sku                  VARCHAR(50)      NOT NULL,
  name                 VARCHAR(255)     NOT NULL,
  hsn_code             VARCHAR(8)       NOT NULL,
  base_price           DECIMAL(15,2)    NOT NULL,
  tax_inclusive        TINYINT(1)       NOT NULL DEFAULT 0,
  gst_config_id        INT UNSIGNED     NOT NULL,
  stock_qty            DECIMAL(10,3)    NOT NULL DEFAULT 0.000,
  low_stock_alert      DECIMAL(10,3)    NOT NULL DEFAULT 10.000,
  allow_negative_stock TINYINT(1)       NOT NULL DEFAULT 0,
  unit                 VARCHAR(20)      NOT NULL DEFAULT 'PCS',
  created_at           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sku (sku),
  KEY idx_hsn (hsn_code),
  CONSTRAINT fk_product_gst FOREIGN KEY (gst_config_id) REFERENCES gst_config(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `gst_config`

| Column       | Type          | Constraints               | Notes                              |
|--------------|---------------|---------------------------|------------------------------------|
| id           | INT UNSIGNED  | PK, AUTO_INCREMENT        |                                    |
| name         | VARCHAR(100)  | NOT NULL                  | e.g. "GST 18%"                     |
| cgst_rate    | DECIMAL(5,2)  | NOT NULL DEFAULT 0        | Half of total for intra-state      |
| sgst_rate    | DECIMAL(5,2)  | NOT NULL DEFAULT 0        | Half of total for intra-state      |
| igst_rate    | DECIMAL(5,2)  | NOT NULL DEFAULT 0        | Full rate for inter-state          |
| cess_rate    | DECIMAL(5,2)  | NOT NULL DEFAULT 0        | Optional compensation cess %       |
| cess_enabled | TINYINT(1)    | NOT NULL DEFAULT 0        |                                    |

```sql
CREATE TABLE gst_config (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name         VARCHAR(100)  NOT NULL,
  cgst_rate    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  sgst_rate    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  igst_rate    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  cess_rate    DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  cess_enabled TINYINT(1)    NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed standard GST slabs
INSERT INTO gst_config (name, cgst_rate, sgst_rate, igst_rate) VALUES
  ('GST 0%',   0.00,  0.00,  0.00),
  ('GST 5%',   2.50,  2.50,  5.00),
  ('GST 12%',  6.00,  6.00, 12.00),
  ('GST 18%',  9.00,  9.00, 18.00),
  ('GST 28%', 14.00, 14.00, 28.00),
  ('GST 28% + Cess 12%', 14.00, 14.00, 28.00, 12.00, 1);
```

---

### `parties` (Customers & Suppliers)

| Column           | Type          | Constraints               | Notes                              |
|------------------|---------------|---------------------------|------------------------------------|
| id               | INT UNSIGNED  | PK, AUTO_INCREMENT        |                                    |
| type             | ENUM          | 'CUSTOMER','SUPPLIER','BOTH' | Party type                      |
| name             | VARCHAR(255)  | NOT NULL                  |                                    |
| gstin            | VARCHAR(15)   | NULL, UNIQUE              | Format: 15-char alphanumeric       |
| phone            | VARCHAR(15)   | NULL                      |                                    |
| email            | VARCHAR(255)  | NULL                      |                                    |
| address          | TEXT          | NULL                      |                                    |
| state_code       | CHAR(2)       | NOT NULL                  | Two-digit state code (e.g. '07')   |
| state_name       | VARCHAR(50)   | NOT NULL                  | For display                        |
| current_balance  | DECIMAL(15,2) | NOT NULL DEFAULT 0        | +ve = owes us, -ve = we owe them   |

```sql
CREATE TABLE parties (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  type            ENUM('CUSTOMER','SUPPLIER','BOTH') NOT NULL DEFAULT 'CUSTOMER',
  name            VARCHAR(255)   NOT NULL,
  gstin           VARCHAR(15)    NULL,
  phone           VARCHAR(15)    NULL,
  email           VARCHAR(255)   NULL,
  address         TEXT           NULL,
  state_code      CHAR(2)        NOT NULL,
  state_name      VARCHAR(50)    NOT NULL,
  current_balance DECIMAL(15,2)  NOT NULL DEFAULT 0.00,
  created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gstin (gstin),
  KEY idx_name (name),
  KEY idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `doc_sequences` (Auto-Numbering)

```sql
CREATE TABLE doc_sequences (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  prefix      VARCHAR(10)   NOT NULL,       -- INV, EST, PUR, CN, DN
  financial_year VARCHAR(7) NOT NULL,       -- e.g. 2024-25
  last_number INT UNSIGNED  NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_prefix_fy (prefix, financial_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `invoices`

| Column        | Type                                     | Notes                              |
|---------------|------------------------------------------|------------------------------------|
| id            | INT UNSIGNED PK                          |                                    |
| doc_number    | VARCHAR(30) UNIQUE                       | e.g. INV/2024-25/0001              |
| doc_type      | ENUM('INVOICE','ESTIMATE','PURCHASE','CREDIT_NOTE','DEBIT_NOTE') | |
| date          | DATE NOT NULL                            |                                    |
| due_date      | DATE NULL                                |                                    |
| party_id      | FK → parties(id)                         |                                    |
| party_state_code | CHAR(2)                               | Snapshot at time of invoice        |
| business_state_code | CHAR(2)                            | Your company's state               |
| subtotal      | DECIMAL(15,2)                            | Sum of taxable values              |
| cgst_total    | DECIMAL(15,2)                            |                                    |
| sgst_total    | DECIMAL(15,2)                            |                                    |
| igst_total    | DECIMAL(15,2)                            |                                    |
| cess_total    | DECIMAL(15,2)                            |                                    |
| total_amount  | DECIMAL(15,2)                            | Grand total                        |
| balance_due   | DECIMAL(15,2)                            | Remaining to be paid               |
| status        | ENUM('DRAFT','UNPAID','PARTIAL','PAID','CANCELLED') | |
| notes         | TEXT NULL                                |                                    |

```sql
CREATE TABLE invoices (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  doc_number           VARCHAR(30)  NOT NULL,
  doc_type             ENUM('INVOICE','ESTIMATE','PURCHASE','CREDIT_NOTE','DEBIT_NOTE') NOT NULL DEFAULT 'INVOICE',
  date                 DATE         NOT NULL,
  due_date             DATE         NULL,
  party_id             INT UNSIGNED NOT NULL,
  party_state_code     CHAR(2)      NOT NULL,
  business_state_code  CHAR(2)      NOT NULL DEFAULT '07',
  subtotal             DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  cgst_total           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sgst_total           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  igst_total           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  cess_total           DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  total_amount         DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  balance_due          DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  status               ENUM('DRAFT','UNPAID','PARTIAL','PAID','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  notes                TEXT         NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_doc_number (doc_number),
  KEY idx_party (party_id),
  KEY idx_status (status),
  KEY idx_date (date),
  CONSTRAINT fk_invoice_party FOREIGN KEY (party_id) REFERENCES parties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `invoice_items`

```sql
CREATE TABLE invoice_items (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  invoice_id     INT UNSIGNED  NOT NULL,
  product_id     INT UNSIGNED  NOT NULL,
  qty            DECIMAL(10,3) NOT NULL,
  unit_price     DECIMAL(15,2) NOT NULL,
  discount_pct   DECIMAL(5,2)  NOT NULL DEFAULT 0.00,
  taxable_value  DECIMAL(15,2) NOT NULL,   -- (unit_price * qty) - discount
  cgst_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  sgst_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  igst_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  cess_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  tax_total      DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  line_total     DECIMAL(15,2) NOT NULL,   -- taxable_value + tax_total
  PRIMARY KEY (id),
  KEY idx_invoice (invoice_id),
  KEY idx_product (product_id),
  CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_item_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

### `payments`

```sql
CREATE TABLE payments (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  invoice_id     INT UNSIGNED  NOT NULL,
  payment_date   DATE          NOT NULL,
  amount_paid    DECIMAL(15,2) NOT NULL,
  payment_method ENUM('UPI','CASH','BANK','CHEQUE','OTHER') NOT NULL,
  reference_id   VARCHAR(100)  NULL,        -- UTR, UPI Txn ID, Cheque No.
  note           TEXT          NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_invoice (invoice_id),
  KEY idx_date (payment_date),
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## Stored Procedures & Triggers

### Trigger: Deduct Stock on Invoice Item Insert

```sql
DELIMITER $$
CREATE TRIGGER trg_deduct_stock AFTER INSERT ON invoice_items
FOR EACH ROW
BEGIN
  DECLARE v_allow_neg TINYINT DEFAULT 0;
  DECLARE v_current_stock DECIMAL(10,3) DEFAULT 0;

  SELECT allow_negative_stock, stock_qty
    INTO v_allow_neg, v_current_stock
    FROM products WHERE id = NEW.product_id FOR UPDATE;

  IF v_allow_neg = 0 AND v_current_stock < NEW.qty THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Insufficient stock: cannot reduce below zero';
  END IF;

  UPDATE products
    SET stock_qty = stock_qty - NEW.qty
    WHERE id = NEW.product_id;
END$$
DELIMITER ;
```

### Procedure: Record Payment with Balance Update

```sql
DELIMITER $$
CREATE PROCEDURE sp_record_payment(
  IN p_invoice_id   INT UNSIGNED,
  IN p_amount       DECIMAL(15,2),
  IN p_method       VARCHAR(20),
  IN p_reference    VARCHAR(100),
  IN p_note         TEXT
)
BEGIN
  DECLARE v_balance    DECIMAL(15,2);
  DECLARE v_party_id   INT UNSIGNED;
  DECLARE new_balance  DECIMAL(15,2);
  DECLARE new_status   VARCHAR(10);

  START TRANSACTION;

  SELECT balance_due, party_id
    INTO v_balance, v_party_id
    FROM invoices WHERE id = p_invoice_id FOR UPDATE;

  IF p_amount > v_balance THEN
    ROLLBACK;
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Payment exceeds balance due';
  END IF;

  INSERT INTO payments (invoice_id, payment_date, amount_paid, payment_method, reference_id, note)
    VALUES (p_invoice_id, CURDATE(), p_amount, p_method, p_reference, p_note);

  SET new_balance = v_balance - p_amount;
  SET new_status  = IF(new_balance = 0, 'PAID', 'PARTIAL');

  UPDATE invoices
    SET balance_due = new_balance, status = new_status
    WHERE id = p_invoice_id;

  UPDATE parties
    SET current_balance = current_balance - p_amount
    WHERE id = v_party_id;

  COMMIT;
END$$
DELIMITER ;
```

### Function: Get Next Document Number

```sql
DELIMITER $$
CREATE FUNCTION fn_next_doc_number(p_prefix VARCHAR(10), p_fy VARCHAR(7))
RETURNS VARCHAR(30) DETERMINISTIC
BEGIN
  DECLARE v_next INT;

  INSERT INTO doc_sequences (prefix, financial_year, last_number)
    VALUES (p_prefix, p_fy, 1)
    ON DUPLICATE KEY UPDATE last_number = last_number + 1;

  SELECT last_number INTO v_next
    FROM doc_sequences WHERE prefix = p_prefix AND financial_year = p_fy;

  RETURN CONCAT(p_prefix, '/', p_fy, '/', LPAD(v_next, 4, '0'));
END$$
DELIMITER ;
```

---

## Indexes Summary

| Table         | Index Name        | Columns              | Type    |
|---------------|-------------------|----------------------|---------|
| products      | uq_sku            | sku                  | UNIQUE  |
| products      | idx_hsn           | hsn_code             | KEY     |
| parties       | uq_gstin          | gstin                | UNIQUE  |
| parties       | idx_name          | name                 | KEY     |
| invoices      | uq_doc_number     | doc_number           | UNIQUE  |
| invoices      | idx_status        | status               | KEY     |
| invoices      | idx_date          | date                 | KEY     |
| invoice_items | idx_invoice       | invoice_id           | KEY     |
| payments      | idx_invoice       | invoice_id           | KEY     |
| payments      | idx_date          | payment_date         | KEY     |
