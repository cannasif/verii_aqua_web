import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, '../src/locales');

const LANGS = ['ar', 'de', 'en', 'es', 'fr', 'it', 'tr'];

function getAllKeys(obj, prefix = '') {
  const keys = [];
  if (obj === null || typeof obj !== 'object') return keys;
  for (const k of Object.keys(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    keys.push(full);
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      keys.push(...getAllKeys(obj[k], full));
    }
  }
  return keys;
}

const langDirs = fs.readdirSync(localesDir).filter((f) => {
  const p = path.join(localesDir, f);
  return fs.statSync(p).isDirectory() && LANGS.includes(f);
});

const allNamespaces = new Set();
for (const lang of langDirs) {
  const dir = path.join(localesDir, lang);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  files.forEach((f) => allNamespaces.add(f));
}

const namespaceList = [...allNamespaces].sort();

const report = {
  missingFiles: {},
  keyDiff: {},
  summary: [],
};

for (const ns of namespaceList) {
  const byLang = {};
  for (const lang of LANGS) {
    const filePath = path.join(localesDir, lang, ns);
    if (!fs.existsSync(filePath)) {
      if (!report.missingFiles[ns]) report.missingFiles[ns] = [];
      report.missingFiles[ns].push(lang);
      continue;
    }
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      byLang[lang] = JSON.parse(raw);
    } catch (e) {
      report.summary.push({ type: 'parseError', ns, lang, error: e.message });
      continue;
    }
  }

  const langsWithFile = Object.keys(byLang);
  if (langsWithFile.length < 2) continue;

  const keySets = {};
  for (const lang of langsWithFile) {
    keySets[lang] = new Set(getAllKeys(byLang[lang]));
  }

  const refLang = langsWithFile.includes('tr') ? 'tr' : langsWithFile[0];
  const refKeys = keySets[refLang];
  const diffs = [];

  for (const lang of langsWithFile) {
    if (lang === refLang) continue;
    const missing = [...refKeys].filter((k) => !keySets[lang].has(k));
    const extra = [...keySets[lang]].filter((k) => !refKeys.has(k));
    if (missing.length || extra.length) {
      diffs.push({ lang, missing, extra });
    }
  }

  if (diffs.length) {
    report.keyDiff[ns] = { ref: refLang, diffs };
  }
}

for (const [ns, langs] of Object.entries(report.missingFiles)) {
  report.summary.push({ type: 'missingFile', ns, missingIn: langs });
}

console.log(JSON.stringify(report, null, 2));
