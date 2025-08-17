import 'dotenv/config';
import { config } from 'dotenv';
import path from 'node:path';

// Load .env then .env.local if present
config();
config({ path: '.env.local' });

const arg = process.argv[2] || 'scripts/seed-licenses';
const resolved = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
const withExt = /\.[cm]?tsx?$/.test(resolved) ? resolved : `${resolved}.ts`;

// Use require so ts-node transpiles the target .ts file
// eslint-disable-next-line @typescript-eslint/no-var-requires
require(withExt);
