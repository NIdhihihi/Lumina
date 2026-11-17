import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function readJSON<T>(filename: string, defaultValue: T): T {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as T;
  } catch {
    return defaultValue;
  }
}

export function writeJSON(filename: string, data: unknown): void {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}
