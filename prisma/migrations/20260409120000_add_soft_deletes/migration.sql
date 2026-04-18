-- Add soft-delete support to invoices and parties
-- Records are marked deleted via `deleted_at` timestamp instead of being permanently removed.
-- This enables "undo" recovery and preserves audit history.

ALTER TABLE `invoices` ADD COLUMN `deleted_at` DATETIME NULL;
ALTER TABLE `parties`  ADD COLUMN `deleted_at` DATETIME NULL;
