import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "error.log");

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error && error.stack ? `\n${error.stack}` : "";
  const entry = `[${timestamp}] ERROR [${context}] ${message}${stack}\n\n`;

  console.error(`[${context}]`, error);

  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, entry, "utf8");
  } catch {
    // Silently ignore — console.error above is the fallback
  }
}

export function logInfo(context: string, message: string): void {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] INFO  [${context}] ${message}\n`;

  console.log(`[${context}]`, message);

  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, entry, "utf8");
  } catch {
    // Silent fallback
  }
}
