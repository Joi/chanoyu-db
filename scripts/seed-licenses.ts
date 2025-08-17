import 'dotenv/config';
import { supabaseAdmin } from '../lib/supabase/server';

const CC = [
  { code: 'CC0-1.0', name: 'CC0 1.0 Universal (Public Domain)', uri: 'https://creativecommons.org/publicdomain/zero/1.0/', summary: 'No rights reserved.' },
  { code: 'CC-BY-4.0', name: 'Attribution 4.0 International', uri: 'https://creativecommons.org/licenses/by/4.0/', summary: 'Must give appropriate credit.' },
  { code: 'CC-BY-SA-4.0', name: 'Attribution-ShareAlike 4.0 International', uri: 'https://creativecommons.org/licenses/by-sa/4.0/', summary: 'Share adaptations under the same terms.' },
  { code: 'CC-BY-ND-4.0', name: 'Attribution-NoDerivatives 4.0 International', uri: 'https://creativecommons.org/licenses/by-nd/4.0/', summary: 'No derivatives.' },
  { code: 'CC-BY-NC-4.0', name: 'Attribution-NonCommercial 4.0 International', uri: 'https://creativecommons.org/licenses/by-nc/4.0/', summary: 'NonCommercial use only.' },
  { code: 'CC-BY-NC-SA-4.0', name: 'Attribution-NonCommercial-ShareAlike 4.0 International', uri: 'https://creativecommons.org/licenses/by-nc-sa/4.0/', summary: 'NC + ShareAlike.' },
  { code: 'CC-BY-NC-ND-4.0', name: 'Attribution-NonCommercial-NoDerivatives 4.0 International', uri: 'https://creativecommons.org/licenses/by-nc-nd/4.0/', summary: 'NC + NoDerivatives.' },
];

async function main() {
  const db = supabaseAdmin();
  for (const lic of CC) {
    const { error } = await db.from('licenses').upsert(lic, { onConflict: 'code' });
    if (error) throw error;
  }
  console.log('Seeded Creative Commons licenses');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
