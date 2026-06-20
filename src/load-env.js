import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Carga en orden: paquete → home (~/.commit-ai.env) → cwd
// Así `commit-ai` global encuentra la config sin depender del directorio actual.
const envPaths = [
  path.join(packageRoot, '.env'),
  path.join(os.homedir(), '.commit-ai.env'),
  path.join(process.cwd(), '.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}