const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const hymnsDir = path.join(root, 'documents', 'hymns');
const manifestPath = path.join(hymnsDir, 'index.json');

function titleFromFileName(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compareTitles(a, b) {
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

const hymns = fs
  .readdirSync(hymnsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
  .map((entry) => ({
    title: titleFromFileName(entry.name),
    file: `documents/hymns/${entry.name}`,
  }))
  .sort(compareTitles);

const manifest = {
  version: 1,
  source: 'static-manifest',
  hymns,
};

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
