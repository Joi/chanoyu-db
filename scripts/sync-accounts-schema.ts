import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';

type Column = {
  column_name: string;
  data_type: string;
  udt_name?: string | null;
  is_nullable?: 'YES' | 'NO';
  character_maximum_length?: number | null;
  numeric_precision?: number | null;
  numeric_scale?: number | null;
};

const CORE_ACCOUNT_COLUMNS = new Set([
  'id',
  'email',
  'full_name_en',
  'full_name_ja',
  'role',
  'password_hash',
  'created_at',
]);

function toSqlType(c: Column): string {
  const dt = (c.data_type || '').toLowerCase();
  const udt = (c.udt_name || '').toLowerCase();
  if (dt.includes('character varying')) {
    const len = c.character_maximum_length;
    return len && Number.isFinite(len) ? `varchar(${len})` : 'text';
  }
  if (dt === 'text') return 'text';
  if (dt === 'uuid' || udt === 'uuid') return 'uuid';
  if (dt.startsWith('timestamp')) return 'timestamptz';
  if (dt === 'integer' || udt === 'int4') return 'int';
  if (dt === 'bigint' || udt === 'int8') return 'bigint';
  if (dt === 'boolean' || udt === 'bool') return 'boolean';
  if (dt === 'jsonb') return 'jsonb';
  if (dt === 'numeric') {
    const p = c.numeric_precision;
    const s = c.numeric_scale;
    if (Number.isFinite(p) && Number.isFinite(s)) return `numeric(${p},${s})`;
    return 'numeric';
  }
  return dt || 'text';
}

async function fetchAccountsColumns(): Promise<Column[]> {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  const endpoint = `${url}/rest/v1/information_schema.columns?table_schema=eq.public&table_name=eq.accounts&select=column_name,data_type,udt_name,is_nullable,character_maximum_length,numeric_precision,numeric_scale`;
  const r = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (r.ok) {
    const cols = (await r.json()) as Column[];
    return cols;
  }
  // Fallback: sample a row from accounts and infer column names (types default to text)
  const sample = await fetch(`${url}/rest/v1/accounts?select=*&limit=1`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
  if (!sample.ok) {
    throw new Error(`Fetch information_schema failed: ${r.status} ${await r.text()}`);
  }
  const arr = (await sample.json()) as Record<string, unknown>[];
  const keys = Object.keys(arr[0] || {});
  return keys.map((k) => ({ column_name: k, data_type: 'text' } as Column));
}

function updateInitSql(alterLines: string[]): void {
  const file = path.resolve('supabase/sql/init.sql');
  const src = fs.readFileSync(file, 'utf-8');
  const blockHeader = '-- Extend accounts with optional member profile fields (idempotent)';
  const newBlock = [
    blockHeader,
    ...alterLines.map((l) => `alter table accounts add column if not exists ${l};`),
  ].join('\n');

  let out: string;
  if (src.includes(blockHeader)) {
    out = src.replace(
      new RegExp(`${blockHeader}[\s\S]*?(?:\n(?=\S)|$)`),
      `${newBlock}\n\n`
    );
  } else {
    // Append after objects extension block if possible, else at end
    const anchor = '-- Extend objects with editorial and commerce fields (idempotent)';
    if (src.includes(anchor)) {
      out = src.replace(anchor, `${anchor}\n\n${newBlock}`);
    } else {
      out = `${src.trim()}\n\n${newBlock}\n`;
    }
  }
  fs.writeFileSync(file, out, 'utf-8');
}

async function main() {
  const cols = await fetchAccountsColumns();
  const extras = cols.filter((c) => !CORE_ACCOUNT_COLUMNS.has(c.column_name));
  const statements: string[] = extras.map((c) => `${c.column_name} ${toSqlType(c)}`);
  if (!statements.length) {
    console.log('No extra account columns found. init.sql unchanged.');
    return;
  }
  updateInitSql(statements);
  console.log('init.sql updated with columns:', statements);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


