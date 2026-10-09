// Every file in src/media by name, as the URL the build gives it. Vite names
// them by content hash, so the CDN can cache them for good while the HTML
// stays fresh. src/media/drafts/ is left out, so drafts' images don't ship.
const files = import.meta.glob<string>('./media/*.{jpg,png,webm,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const urls = new Map(Object.entries(files).map(([path, url]) => [path.slice('./media/'.length), url]));

export function mediaUrl(name: string): string {
  const url = urls.get(name);
  if (url === undefined) {
    throw new Error(`There is no src/media/${name}`);
  }
  return url;
}
