import { readdir, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  return (await Promise.all(entries.map(e => e.isDirectory() ? walk(resolve(dir, e.name)) : [resolve(dir, e.name)]))).flat();
}
const files = (await Promise.all(['server', 'extension', 'scripts'].map(walk))).flat().filter(p => /\.(?:mjs|js)$/.test(p));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) { process.stderr.write(result.stderr); process.exitCode = 1; }
}
console.log(`Checked syntax in ${files.length} JavaScript files.`);
const manifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
const forbiddenOptional = new Set(['debugger', 'declarativeNetRequest', 'devtools', 'geolocation', 'mdns', 'proxy', 'tts', 'ttsEngine', 'wallpaper']);
if ((manifest.optional_permissions || []).some(p => forbiddenOptional.has(p))) throw new Error('The manifest contains an unsupported optional permission.');
const references = [manifest.background.service_worker, manifest.action.default_popup, ...manifest.content_scripts.flatMap(s => s.js)];
await Promise.all(references.map(file => access(resolve('extension', file))));
console.log('Manifest permissions and file references are valid.');
