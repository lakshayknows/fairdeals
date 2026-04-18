-- CreateTable
CREATE TABLE `gst_adjustments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `amount` DECIMAL(15, 2) NOT NULL,
    `type` ENUM('INPUT', 'OUTPUT') NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `financial_year` VARCHAR(10) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `gst_adjustments_financial_year_idx`(`financial_year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
