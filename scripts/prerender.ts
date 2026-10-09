// Runs after `vite build`. Writes an index.html for every route, so each has
// its own title, description and share card, and real text for crawlers and
// for anyone without script; then the sitemap. nginx serves /matforge/ as
// dist/matforge/index.html, and the app reads the address to open it.
import {existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, extname, join} from 'node:path';
import {entries, shownWork} from '../src/content/entries';
import {about, site} from '../src/content/site';
import type {Block, Media, WorkEntry} from '../src/content/types';

const DIST = 'dist';
const MEDIA = 'src/media';

const template = readFileSync(join(DIST, 'index.html'), 'utf8');
const manifestPath = join(DIST, '.vite', 'manifest.json');
const manifest: Record<string, {file?: string}> = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath, 'utf8'))
  : {};
const builtAssets = readdirSync(join(DIST, 'assets'));

// The address the build gave a file in src/media.
function asset(name: string): string {
  const listed = manifest[`${MEDIA}/${name}`]?.file;
  if (listed) {
    return `/${listed}`;
  }
  const ext = extname(name);
  const stem = name.slice(0, -ext.length);
  const found = builtAssets.find((file) => file.startsWith(`${stem}-`) && file.endsWith(ext));
  if (!found) {
    throw new Error(`The build has no ${name}: is it in ${MEDIA}/ and named in src/content?`);
  }
  return `/assets/${found}`;
}

// A missing picture fails the build here rather than showing up broken.
function checkMedia(media: Media) {
  for (const file of [media.src, media.video]) {
    if (file && !existsSync(join(MEDIA, file))) {
      throw new Error(`${MEDIA}/${file} is missing`);
    }
  }
}

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function rich(text: string): string {
  return escape(text).split('**').map((part, i) => (i % 2 === 1 ? `<strong>${part}</strong>` : part)).join('');
}

function blocks(list: Block[]): string {
  return list.map((block) => {
    switch (block.kind) {
      case 'p':
        return `<p>${rich(block.text)}</p>`;
      case 'h':
        return `<h3>${escape(block.text)}</h3>`;
      case 'list':
        return `<ul>${block.items.map((item) => `<li>${rich(item)}</li>`).join('')}</ul>`;
      case 'media':
        return `<figure>${image(block.media)}${block.caption ? `<figcaption>${escape(block.caption)}</figcaption>` : ''}</figure>`;
    }
  }).join('\n');
}

function image(media: Media): string {
  return `<img src="${asset(media.src)}" alt="${escape(media.alt)}" width="${media.width}" height="${media.height}" loading="lazy" />`;
}

function links(list: {label: string; href: string}[]): string {
  return list.map((link) => `<a href="${escape(link.href)}">${escape(link.label)}</a>`).join(' · ');
}

interface Page {
  path: string;          // '/', or '/matforge/'
  title: string;
  description: string;
  image: {url: string; alt: string; width: number; height: number};
  body: string;
}

function setMeta(html: string, attribute: 'name' | 'property', key: string, value: string): string {
  const pattern = new RegExp(`(<meta ${attribute}="${key}" content=")[^"]*(")`);
  if (!pattern.test(html)) {
    throw new Error(`index.html has no <meta ${attribute}="${key}">`);
  }
  return html.replace(pattern, (_, before: string, after: string) => before + escape(value) + after);
}

function write(page: Page) {
  const url = site.url + page.path;
  let html = template.replace(/<title>[^<]*<\/title>/, () => `<title>${escape(page.title)}</title>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:title', page.title);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:image', site.url + page.image.url);
  html = setMeta(html, 'property', 'og:image:alt', page.image.alt);
  html = html.replace(
    '<meta property="og:image:alt"',
    () => `<meta property="og:image:width" content="${page.image.width}" />\n    ` +
      `<meta property="og:image:height" content="${page.image.height}" />\n    <meta property="og:image:alt"`,
  );
  html = html.replace(/<link rel="canonical" href="[^"]*"/, () => `<link rel="canonical" href="${url}"`);
  if (!html.includes('<div id="root"></div>')) {
    throw new Error('index.html has no empty <div id="root"></div> to fill');
  }
  html = html.replace('<div id="root"></div>', () => `<div id="root"><main class="fallback">\n${page.body}\n</main></div>`);

  const file = join(DIST, page.path, 'index.html');
  mkdirSync(dirname(file), {recursive: true});
  writeFileSync(file, html);
}

// The share card for pages without a picture of their own: og.jpg if there is
// one, the portrait otherwise.
const card = existsSync(join(MEDIA, 'og.jpg'))
  ? {url: asset('og.jpg'), alt: `${site.name}'s portfolio`, width: 1200, height: 630}
  : {url: asset('head.jpg'), alt: site.name, width: 400, height: 400};

const contactLine = `<p><a href="mailto:${site.email}">${site.email}</a> · ${links([
  {label: 'LinkedIn', href: site.linkedin},
  {label: 'GitHub', href: site.github},
  {label: 'Resume', href: site.resume},
])}</p>`;

function workPage(entry: WorkEntry): Page {
  const hero = entry.hero;
  const meta = [entry.stack.join(', '), entry.dates, entry.place, entry.team].filter(Boolean).join(' · ');
  const results = entry.counters.map((counter) => `${counter.value} ${counter.label}`).join('; ');
  return {
    path: `/${entry.id}/`,
    title: `${entry.title} · ${site.name}`,
    description: results ? `${entry.tagline}: ${results}.` : `${entry.tagline}.`,
    image: hero ? {url: asset(hero.src), alt: hero.alt, width: hero.width, height: hero.height} : card,
    body: [
      `<p><a href="/">${escape(site.name)}</a></p>`,
      `<h1>${escape(entry.title)}</h1>`,
      `<p>${escape(entry.tagline)}</p>`,
      `<p>${escape(meta)}</p>`,
      entry.counters.length ? `<ul>${entry.counters.map((c) => `<li><strong>${escape(c.value)}</strong> ${escape(c.label)}</li>`).join('')}</ul>` : '',
      hero ? image(hero) : '',
      blocks(entry.blocks),
      entry.links.length ? `<p>${links(entry.links)}</p>` : '',
      contactLine,
    ].filter(Boolean).join('\n'),
  };
}

for (const entry of shownWork) {
  if (entry.hero) {
    checkMedia(entry.hero);
  }
  for (const block of entry.blocks) {
    if (block.kind === 'media') {
      checkMedia(block.media);
    }
  }
}

const pages: Page[] = [
  {
    path: '/',
    title: site.title,
    description: site.description,
    image: card,
    body: [
      `<h1>${escape(site.name)}</h1>`,
      `<p>${escape(site.subtitle)}</p>`,
      `<p>${escape(about.tagline)}</p>`,
      `<p>${rich(about.bio[0])}</p>`,
      '<ul>',
      ...entries.filter((entry) => entry.kind === 'work' || entry.id === 'about').map((entry) =>
        entry.kind === 'work'
          ? `<li><a href="/${entry.id}/">${escape(entry.title)}</a>: ${escape(entry.tagline)}</li>`
          : `<li><a href="/about/">About</a></li>`),
      '</ul>',
      contactLine,
    ].join('\n'),
  },
  {
    path: '/about/',
    title: `About · ${site.name}`,
    description: about.tagline,
    image: card,
    body: [
      `<p><a href="/">${escape(site.name)}</a></p>`,
      '<h1>About</h1>',
      ...about.bio.map((paragraph) => `<p>${rich(paragraph)}</p>`),
      ...about.skills.map((group) => `<h2>${escape(group.group)}</h2><p>${group.items.map(escape).join(', ')}</p>`),
      contactLine,
    ].join('\n'),
  },
  ...shownWork.map(workPage),
];

for (const page of pages) {
  write(page);
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...pages.map((page) => `  <url><loc>${site.url}${page.path}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
writeFileSync(join(DIST, 'sitemap.xml'), sitemap);

// The manifest was only for this script; it shouldn't be published.
rmSync(join(DIST, '.vite'), {recursive: true, force: true});

console.log(`prerendered ${pages.length} routes: ${pages.map((page) => page.path).join(' ')}`);
