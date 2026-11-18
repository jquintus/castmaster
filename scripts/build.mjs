import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'docs');
const lineup = JSON.parse(await readFile(path.join(root, 'lineups.json'), 'utf8'));
if (!lineup.length || lineup.some((group, index) => group.series !== index + 1 || group.contestants.length !== 5)) {
  throw new Error('Expected consecutive series starting at 1, each with five contestants');
}
const css = await readFile(path.join(root, 'src/styles.css'));
const app = await readFile(path.join(root, 'src/app.js'));
const version = createHash('sha256').update(css).update(app).update(JSON.stringify(lineup)).digest('hex').slice(0, 10);
const template = (await readFile(path.join(root, 'src/index.html'), 'utf8'))
  .replaceAll('{{LAST_SERIES}}', String(lineup.at(-1).series))
  .replaceAll('{{VERSION}}', version);
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'src/styles.css'), path.join(dist, 'styles.css'));
await cp(path.join(root, 'src/app.js'), path.join(dist, 'app.js'));
await cp(path.join(root, 'src/favicon.svg'), path.join(dist, 'favicon.svg'));
await cp(path.join(root, 'src/assets'), path.join(dist, 'assets'), { recursive: true });
await writeFile(path.join(dist, 'data.js'), `window.TM_SERIES = ${JSON.stringify(lineup)};\n`);
await writeFile(path.join(dist, 'index.html'), template.replaceAll('{{BASE}}', '').replaceAll('{{SERIES}}', ''));
for (const group of lineup) {
  const folder = path.join(dist, `series_${group.series}`);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), template.replaceAll('{{BASE}}', '../').replaceAll('{{SERIES}}', String(group.series)));
}
console.log(`Built ${lineup.length} series pages and ${lineup.reduce((sum, group) => sum + group.contestants.length, 0)} contestant cards.`);
