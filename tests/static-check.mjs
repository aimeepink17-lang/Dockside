import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [html, js, css, config] = await Promise.all([
  fs.readFile(path.join(root, 'index.html'), 'utf8'),
  fs.readFile(path.join(root, 'app.js'), 'utf8'),
  fs.readFile(path.join(root, 'styles.css'), 'utf8'),
  fs.readFile(path.join(root, 'config.js'), 'utf8')
]);

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const refs = new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]));
for (const id of refs) assert.ok(ids.has(id), `app.js references missing element: ${id}`);
assert.ok(html.includes('<script src="grounding.js"></script>'), 'grounding script loads before the app');
assert.ok(css.includes('assets/dublin-bay-hero.png'), 'hero image is referenced');
await fs.access(path.join(root, 'assets', 'dublin-bay-hero.png'));
assert.ok(config.includes('docs.google.com/spreadsheets/d/'), 'the existing Google Sheet remains configured');
assert.ok(config.includes('api.open-meteo.com'), 'Open-Meteo remains configured');
assert.ok(config.includes('bdaib-hub.pages.dev/brain/chat'), 'the class brain remains configured');
console.log(`PASS  Static page checks (${refs.size} JavaScript DOM IDs, three original integrations, and local hero image).`);
