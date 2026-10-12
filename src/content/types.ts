// The shape of everything the site says. The entries are plain data with no
// imports from the app, so scripts/prerender.ts can read them in Node too.

// The groups the index lists the work in, like the markers of a frame capture.
export type PassId = 'production' | 'rendering' | 'interactive' | 'systems';

export interface Pass {
  id: PassId;
  name: string;
}

// A measured result, shown big: "+2.57 dB", over what it measures.
export interface Counter {
  value: string;
  label: string;
}

export interface Link {
  label: string;
  href: string;
}

// An image in src/media, named by its file. `video` is a clip in the same
// folder that plays in its place, with the image as its poster. The size is
// the image's own, so its frame is laid out before it loads.
export interface Media {
  src: string;
  alt: string;
  width: number;
  height: number;
  video?: string;
}

// The case study, block by block. Text, list items, table cells and captions
// may mark **bold** and `code` spans.
// - A table's first column names its rows. A column whose every cell starts
//   with a number (or is a dash) is set as figures, right-aligned
//   (figureColumns in tables.ts).
// - A gallery sets its pictures side by side (stacked on a phone), each with a
//   label of its own, so a comparison reads the same either way.
export type Block =
  | {kind: 'p'; text: string}
  | {kind: 'h'; text: string}
  | {kind: 'list'; items: string[]; ordered?: boolean}
  | {kind: 'media'; media: Media; caption?: string}
  | {kind: 'gallery'; items: {media: Media; label: string}[]; caption?: string}
  | {kind: 'table'; head: string[]; rows: string[][]; caption?: string}
  | {kind: 'code'; text: string};

export interface WorkEntry {
  kind: 'work';
  id: string;            // also the route: /matforge/
  pass: PassId;
  title: string;
  label?: string;        // a shorter title for the index and the timeline
  metric: string;        // the index's right-hand column
  tagline: string;
  dates: string;         // as shown: "Nov – Dec 2025"
  span: [string, string]; // first and last month, "2025-11", for the timeline
  team?: string;
  place?: string;
  stack: string[];
  counters: Counter[];
  hero?: Media;
  links: Link[];
  blocks: Block[];
  draft?: boolean;       // kept here, but not on the site
}

// The stops that aren't work: the intro (the descent itself, out in space),
// About and Contact.
export interface PageEntry {
  kind: 'page';
  id: 'intro' | 'about' | 'contact';
  title: string;
  label: string;
}

export type Entry = WorkEntry | PageEntry;
