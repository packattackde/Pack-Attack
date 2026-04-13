import fs from 'fs';
import path from 'path';

const DE_PATH = path.resolve(__dirname, '../messages/de.json');
const EN_PATH = path.resolve(__dirname, '../messages/en.json');

function getLeafKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getLeafKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const de = JSON.parse(fs.readFileSync(DE_PATH, 'utf-8'));
const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf-8'));

const deKeys = new Set(getLeafKeys(de));
const enKeys = new Set(getLeafKeys(en));

const missingInEn = [...deKeys].filter(k => !enKeys.has(k));
const missingInDe = [...enKeys].filter(k => !deKeys.has(k));

let hasErrors = false;

if (missingInEn.length > 0) {
  console.error(`\n❌ ${missingInEn.length} key(s) in de.json but MISSING in en.json:`);
  missingInEn.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

if (missingInDe.length > 0) {
  console.error(`\n❌ ${missingInDe.length} key(s) in en.json but MISSING in de.json:`);
  missingInDe.forEach(k => console.error(`   - ${k}`));
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n🚫 i18n parity check FAILED. Both locale files must have identical key sets.\n');
  process.exit(1);
} else {
  console.log(`\n✅ i18n parity check passed. ${deKeys.size} keys in both de.json and en.json.\n`);
}
