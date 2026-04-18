import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logError, logInfo } from "@/lib/logger";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);
const BACKUP_DIR = path.join(process.cwd(), "backups");

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/** Parse a MySQL URL into its components. */
function parseDatabaseUrl(url: string) {
  const match = url.match(
    /^mysql:\/\/([^:]+):([^@]*)@([^:\/]+):(\d+)\/(.+)$/
  );
  if (!match) throw new Error("Could not parse DATABASE_URL");
  const [, user, password, host, port, dbName] = match;
  return { user, password, host, port, dbName };
}

// GET /api/backup?type=json|sql&save=true|false
// - type=json  → JSON snapshot (default)
// - type=sql   → mysqldump SQL file
// - save=true  → also write the file to the backups/ folder on disk
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "json";
  const saveToDisk = req.nextUrl.searchParams.get("save") === "true";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  try {
    // ── SQL dump via mysqldump ────────────────────────────────────────────────
    if (type === "sql") {
      const rawUrl = process.env.DATABASE_URL ?? "";
      const { user, password, host, port, dbName } = parseDatabaseUrl(rawUrl);

      const { stdout } = await execAsync(
        `mysqldump -u ${user} -h ${host} -P ${port} --single-transaction ${dbName}`,
        {
          // Pass password via env var — keeps it out of the process list
          env: { ...process.env, MYSQL_PWD: password },
          maxBuffer: 100 * 1024 * 1024, // 100 MB
        }
      ).catch((err) => {
        throw new Error(
          `mysqldump failed: ${err.message}. Ensure mysqldump is installed and in PATH.`
        );
      });

      const fileName = `fairdeals_backup_${timestamp}.sql`;

      if (saveToDisk) {
        ensureBackupDir();
        fs.writeFileSync(path.join(BACKUP_DIR, fileName), stdout, "utf8");
        logInfo("Backup", `SQL backup saved to backups/${fileName}`);
      }

      return new NextResponse(stdout, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }

    // ── JSON snapshot (default) ───────────────────────────────────────────────
    const [
      products,
      parties,
      invoices,
      gstConfigs,
      bankAccounts,
      payments,
      gstAdjustments,
    ] = await Promise.all([
      prisma.product.findMany({ include: { gstConfig: true } }),
      prisma.party.findMany(),
      prisma.invoice.findMany({ include: { items: true, payments: true } }),
      prisma.gstConfig.findMany(),
      prisma.bankAccount.findMany(),
      prisma.payment.findMany(),
      prisma.gstAdjustment.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: "1.1",
      counts: {
        products: products.length,
        parties: parties.length,
        invoices: invoices.length,
        payments: payments.length,
      },
      products,
      parties,
      invoices,
      gstConfigs,
      bankAccounts,
      payments,
      gstAdjustments,
    };

    const json = JSON.stringify(backupData, null, 2);
    const fileName = `fairdeals_backup_${timestamp}.json`;

    if (saveToDisk) {
      ensureBackupDir();
      fs.writeFileSync(path.join(BACKUP_DIR, fileName), json, "utf8");
      logInfo("Backup", `JSON backup saved to backups/${fileName}`);
    }

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: unknown) {
    logError("BackupAPI", error);
    return NextResponse.json(
      {
        error: "Failed to generate backup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
