// Addresses. The home page is /, and every entry with a case study has its
// own: /about/ and /<project id>/. The build writes an index.html into each
// of those folders (scripts/prerender.ts), so nginx serves them as they are.
import {entries, entryIndex, hasCaseStudy} from './content/entries';

export function pathFor(id: string): string {
  return `/${id}/`;
}

// The entry an address opens, or -1 for the home page and anything unknown.
export function indexForPath(pathname: string): number {
  const id = pathname.replace(/^\/+|\/+$/g, '');
  if (!id) {
    return -1;
  }
  const index = entryIndex(id);
  return index >= 0 && hasCaseStudy(entries[index]) ? index : -1;
}
