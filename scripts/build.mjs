import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'docs');
const lineup = JSON.parse(await readFile(path.join(root, 'lineups.json'), 'utf8'));
const otherShows = JSON.parse(await readFile(path.join(root, 'shows.json'), 'utf8'));
const wikiPortraits = JSON.parse(await readFile(path.join(root, 'wiki-portraits.json'), 'utf8'));
const wikipediaTitles = JSON.parse(await readFile(path.join(root, 'wikipedia-titles.json'), 'utf8'));
const missingPortraits = Object.values(otherShows).flatMap(show => show.seasons.flat()).filter(name => !wikiPortraits[name]?.[0]);
if (missingPortraits.length) throw new Error(`Missing Taskmaster Wiki portraits for: ${missingPortraits.join(', ')}`);
const uncheckedLinks = Object.values(otherShows).flatMap(show => show.seasons.flat()).filter(name => !Object.hasOwn(wikipediaTitles, name));
if (uncheckedLinks.length) throw new Error(`Missing Wikipedia link decisions for: ${uncheckedLinks.join(', ')}`);
const imageSlug = name => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const [slug, show] of Object.entries(otherShows)) {
  for (const name of show.seasons.flat()) {
    await access(path.join(root, 'src/assets/fandom', slug, `${imageSlug(name)}.webp`));
  }
}
if (!lineup.length || lineup.some((group, index) => group.series !== index + 1 || group.contestants.length !== 5)) {
  throw new Error('Expected consecutive series starting at 1, each with five contestants');
}
const shows = {
  uk: { name: 'United Kingdom', seasons: lineup.map(({ series, contestants }) => ({ season: series, contestants })) },
  ...Object.fromEntries(Object.entries(otherShows).map(([slug, show]) => [slug, {
    name: show.name,
    seasons: show.seasons.map((names, index) => ({
      season: index + 1,
      contestants: names.map(name => ({
        name,
        wikiTitle: wikipediaTitles[name],
        imageSource: `https://taskmaster.fandom.com/wiki/${encodeURIComponent(name.replaceAll(' ', '_'))}`,
        image: `assets/fandom/${slug}/${imageSlug(name)}.webp`
      }))
    }))
  }]))
};
for (const [slug, show] of Object.entries(shows)) {
  if (!show.seasons.length || show.seasons.some((season, index) => season.season !== index + 1 || season.contestants.length !== 5)) {
    throw new Error(`Expected consecutive five-person seasons for ${slug}`);
  }
}
const css = await readFile(path.join(root, 'src/styles.css'));
const app = await readFile(path.join(root, 'src/app.js'));
const version = createHash('sha256').update(css).update(app).update(JSON.stringify(shows)).digest('hex').slice(0, 10);
const template = (await readFile(path.join(root, 'src/index.html'), 'utf8'))
  .replaceAll('{{VERSION}}', version);
await mkdir(dist, { recursive: true });
await cp(path.join(root, 'src/styles.css'), path.join(dist, 'styles.css'));
await cp(path.join(root, 'src/app.js'), path.join(dist, 'app.js'));
await cp(path.join(root, 'src/favicon.svg'), path.join(dist, 'favicon.svg'));
await cp(path.join(root, 'src/assets'), path.join(dist, 'assets'), { recursive: true });
await writeFile(path.join(dist, 'data.js'), `window.TM_SHOWS = ${JSON.stringify(shows)};\n`);
const render = (base, show, season = '') => template.replaceAll('{{BASE}}', base).replaceAll('{{SHOW}}', show).replaceAll('{{SEASON}}', String(season));
await writeFile(path.join(dist, 'index.html'), render('', 'uk'));
for (const group of lineup) {
  const folder = path.join(dist, `series_${group.series}`);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), render('../', 'uk', group.series));
}
for (const [slug, show] of Object.entries(shows)) {
  if (slug === 'uk') continue;
  const folder = path.join(dist, slug);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'index.html'), render('../', slug));
  for (const season of show.seasons) {
    const seasonFolder = path.join(folder, `season_${season.season}`);
    await mkdir(seasonFolder, { recursive: true });
    await writeFile(path.join(seasonFolder, 'index.html'), render('../../', slug, season.season));
  }
}
console.log(`Built ${Object.values(shows).reduce((sum, show) => sum + show.seasons.length, 0)} season pages.`);
