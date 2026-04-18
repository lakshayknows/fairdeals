-- CreateTable
CREATE TABLE `gst_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `cgst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `sgst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `igst_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `cess_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `cess_enabled` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(50) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `hsn_code` VARCHAR(8) NOT NULL,
    `base_price` DECIMAL(15, 2) NOT NULL,
    `tax_inclusive` BOOLEAN NOT NULL DEFAULT false,
    `gst_config_id` INTEGER NOT NULL,
    `stock_qty` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `low_stock_alert` DECIMAL(10, 3) NOT NULL DEFAULT 10,
    `allow_negative_stock` BOOLEAN NOT NULL DEFAULT false,
    `unit` VARCHAR(20) NOT NULL DEFAULT 'PCS',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_sku_key`(`sku`),
    INDEX `products_hsn_code_idx`(`hsn_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `parties` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('CUSTOMER', 'SUPPLIER', 'BOTH') NOT NULL DEFAULT 'CUSTOMER',
    `name` VARCHAR(255) NOT NULL,
    `gstin` VARCHAR(15) NULL,
    `phone` VARCHAR(15) NULL,
    `email` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `state_code` CHAR(2) NOT NULL,
    `state_name` VARCHAR(50) NOT NULL,
    `current_balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `parties_gstin_key`(`gstin`),
    INDEX `parties_name_idx`(`name`),
    INDEX `parties_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doc_sequences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prefix` VARCHAR(10) NOT NULL,
    `financial_year` VARCHAR(7) NOT NULL,
    `last_number` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `doc_sequences_prefix_financial_year_key`(`prefix`, `financial_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `doc_number` VARCHAR(30) NOT NULL,
    `doc_type` ENUM('INVOICE', 'ESTIMATE', 'PURCHASE', 'CREDIT_NOTE', 'DEBIT_NOTE') NOT NULL DEFAULT 'INVOICE',
    `date` DATE NOT NULL,
    `due_date` DATE NULL,
    `party_id` INTEGER NOT NULL,
    `party_state_code` CHAR(2) NOT NULL,
    `business_state_code` CHAR(2) NOT NULL,
    `subtotal` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `cgst_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `sgst_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `igst_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `cess_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `total_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `balance_due` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'CANCELLED') NOT NULL DEFAULT 'DRAFT',
    `financial_year` VARCHAR(10) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invoices_doc_number_key`(`doc_number`),
    INDEX `invoices_party_id_idx`(`party_id`),
    INDEX `invoices_status_idx`(`status`),
    INDEX `invoices_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invoice_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `qty` DECIMAL(10, 3) NOT NULL,
    `unit_price` DECIMAL(15, 2) NOT NULL,
    `discount_pct` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `taxable_value` DECIMAL(15, 2) NOT NULL,
    `cgst_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `sgst_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `igst_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `cess_amount` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `tax_total` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `line_total` DECIMAL(15, 2) NOT NULL,

    INDEX `invoice_items_invoice_id_idx`(`invoice_id`),
    INDEX `invoice_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bank_accounts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account_name` VARCHAR(100) NOT NULL,
    `bank_name` VARCHAR(100) NOT NULL,
    `account_number` VARCHAR(20) NOT NULL,
    `ifsc_code` VARCHAR(11) NOT NULL,
    `balance` DECIMAL(15, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `payment_date` DATE NOT NULL,
    `amount_paid` DECIMAL(15, 2) NOT NULL,
    `payment_method` ENUM('UPI', 'CASH', 'BANK', 'CHEQUE', 'OTHER') NOT NULL,
    `reference_id` VARCHAR(100) NULL,
    `note` TEXT NULL,
    `bank_account_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `payments_invoice_id_idx`(`invoice_id`),
    INDEX `payments_payment_date_idx`(`payment_date`),
    INDEX `payments_bank_account_id_idx`(`bank_account_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_gst_config_id_fkey` FOREIGN KEY (`gst_config_id`) REFERENCES `gst_config`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_party_id_fkey` FOREIGN KEY (`party_id`) REFERENCES `parties`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_bank_account_id_fkey` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
