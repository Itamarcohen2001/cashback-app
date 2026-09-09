// מזריק meta tags נדרשים ל-<head> של dist/index.html לאחר הבנייה (verification וכו').
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const FILE = "dist/index.html";

// תגיות אימות בעלות (Admitad/Mitgo וכו').
const META_TAGS = [
  '<meta name="mitgo-verification" content="cc6adf88-d18b-4e57-ad2f-270eb67c1396" />',
];

if (!existsSync(FILE)) {
  console.error(`inject-head: ${FILE} not found — did the web export run?`);
  process.exit(1);
}

let html = readFileSync(FILE, "utf8");
let added = 0;

for (const tag of META_TAGS) {
  const marker = tag.match(/name="([^"]+)"/)?.[1] ?? tag;
  if (!html.includes(marker)) {
    html = html.replace("</head>", `  ${tag}\n</head>`);
    added++;
  }
}

writeFileSync(FILE, html);
console.log(`inject-head: added ${added} meta tag(s) to ${FILE}.`);
