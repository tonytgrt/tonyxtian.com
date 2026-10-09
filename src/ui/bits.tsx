// Small pieces the panels share.
import {Fragment, type ReactNode} from 'react';
import {entries} from '../content/entries';
import {passes} from '../content/site';
import type {Block, Entry, Media as MediaInfo, Pass} from '../content/types';
import {mediaUrl} from '../media';

const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Two digits, like the event numbers in a capture.
export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function passOf(entry: Entry): Pass | null {
  return entry.kind === 'work' ? passes.find((pass) => pass.id === entry.pass) ?? null : null;
}

// Where an entry sits within its pass: [position from 1, how many].
export function placeInPass(index: number): [number, number] {
  const entry = entries[index];
  if (entry.kind !== 'work') {
    return [0, 0];
  }
  const peers = entries.filter((other) => other.kind === 'work' && other.pass === entry.pass);
  return [peers.indexOf(entry) + 1, peers.length];
}

// The passes that have anything on the site, in order.
export const shownPasses: Pass[] = passes.filter((pass) =>
  entries.some((entry) => entry.kind === 'work' && entry.pass === pass.id));

// An entry's address in the index, in hex like a debugger's. The intro and
// About are 0x00 and 0x01; each pass takes the next high digit, its entries
// numbered on from 0 (Apple 0x10, MatForge 0x20, Vulkan Grass 0x21); Contact,
// the end, is 0xFF. A pass can hold 16 entries before it runs into the next.
export function address(index: number): string {
  const entry = entries[index];
  let value: number;
  if (entry.kind === 'work') {
    const pass = shownPasses.findIndex((shown) => shown.id === entry.pass) + 1;
    value = pass * 16 + placeInPass(index)[0] - 1;
  } else if (entry.id === 'contact') {
    value = 0xff;
  } else {
    value = entries.filter((page) => page.kind === 'page' && page.id !== 'contact').indexOf(entry);
  }
  return `0x${value.toString(16).toUpperCase().padStart(2, '0')}`;
}

// Text with **bold** spans.
export function Rich({text}: {text: string}) {
  const parts = text.split('**');
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>))}
    </>
  );
}

export function Media({media, className}: {media: MediaInfo; className?: string}) {
  const poster = mediaUrl(media.src);
  if (media.video) {
    return (
      <video
        className={className}
        src={mediaUrl(media.video)}
        poster={poster}
        width={media.width}
        height={media.height}
        aria-label={media.alt}
        autoPlay={!reducedMotion}
        controls={reducedMotion}
        muted
        loop
        playsInline
        preload="auto"
      />
    );
  }
  return (
    <img className={className} src={poster} alt={media.alt} width={media.width} height={media.height} decoding="async" />
  );
}

export function Blocks({blocks}: {blocks: Block[]}) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'p':
            return <p key={i}><Rich text={block.text} /></p>;
          case 'h':
            return <h3 key={i}>{block.text}</h3>;
          case 'list':
            return (
              <ul key={i}>
                {block.items.map((item, j) => <li key={j}><Rich text={item} /></li>)}
              </ul>
            );
          case 'media':
            return (
              <figure key={i} className="case__figure">
                <Media media={block.media} />
                {block.caption && <figcaption>{block.caption}</figcaption>}
              </figure>
            );
        }
      })}
    </>
  );
}

export function ExternalLink({href, className, children, label}: {
  href: string;
  className?: string;
  children: ReactNode;
  label?: string;
}) {
  const mail = href.startsWith('mailto:');
  return (
    <a
      className={className}
      href={href}
      aria-label={label}
      target={mail ? undefined : '_blank'}
      rel={mail ? undefined : 'noreferrer'}
    >
      {children}
    </a>
  );
}

// GitHub's mark, from Primer Octicons (MIT).
export function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// LinkedIn's mark, from Simple Icons (CC0).
export function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
      <path d="M2 4.5l6 4.5 6-4.5" />
    </svg>
  );
}
