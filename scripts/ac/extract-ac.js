#!/usr/bin/env -S node --enable-source-maps
import fs from "node:fs";

const body = fs.readFileSync(0, "utf8");
const start = body.indexOf("<!-- AC:BEGIN -->");
const end = body.indexOf("<!-- AC:END -->", start + 1);
if (start === -1 || end === -1) { console.error("NO_AC_BLOCK"); process.exit(2); }

const block = body.slice(start, end);
const lines = block.split(/\r?\n/).map(l => l.trim());
const ac = lines
  .map(l => {
    const m = l.match(/^\-\s*\[\s*(x?)\s*\]\s*(AC-[\w\-]+):\s*(.+)$/i);
    return m ? { id: m[2], checked: m[1].toLowerCase() === "x", text: m[3].trim() } : null;
  })
  .filter(Boolean);

if (!ac.length) { console.error("NO_AC_ITEMS"); process.exit(3); }

console.log(JSON.stringify(ac, null, 2));