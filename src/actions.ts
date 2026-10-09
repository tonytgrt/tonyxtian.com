// Everything that changes what the page shows: stepping between entries,
// opening and closing a case study (with its address), and the descent. The
// components and the input handlers both come through here, and this is the
// one place that steers the WebGL engine.
import {entries, hasCaseStudy} from './content/entries';
import {site} from './content/site';
import {ease} from './engine/Descent';
import type {Engine} from './engine/engine';
import {mediaUrl} from './media';
import {indexForPath, pathFor} from './routing';
import {getState, setState} from './store';

// Set once a visitor has landed, so the descent only plays on a first visit.
const SEEN_KEY = 'tonyxtian.landed';

// How far the camera flies over the sea per step, in screens, and the most
// steps' worth it flies at once, so a jump across the whole index still glides.
const TRAVEL_PER_STEP = 0.8;
const MAX_TRAVEL_STEPS = 2;

// How long Replay takes to lift the camera back to space, and Skip to bring it
// all the way down (less if part of the descent has already played).
const REPLAY_SECONDS = 1.4;
const SKIP_SECONDS = 1.8;

// The old single-page site's anchors, so links to them still land somewhere.
const OLD_ANCHORS: Record<string, string> = {
  '#about': 'about',
  '#experience': 'apple',
  '#projects': 'matforge',
};

let engine: Engine | null = null;
let travel = 0;
// Whether the open case study pushed its own history entry, so closing it can
// go back rather than stack another.
let pushed = false;
let tween = 0;

function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

function caseTitle(index: number) {
  return `${entries[index].title} · ${site.name}`;
}

// Points the camera at the selected entry: on over the sea, and up at the
// night sky for Contact.
function steer(from: number, to: number) {
  if (!engine) {
    return;
  }
  travel += clamp(to - from, -MAX_TRAVEL_STEPS, MAX_TRAVEL_STEPS) * TRAVEL_PER_STEP;
  engine.targets.travel = travel;
  engine.targets.finale = entries[to].id === 'contact' ? 2 : 0;
}

// Fetches the images either side of the stage, so a step shows its picture at once.
function prefetch(index: number) {
  for (const near of [index + 1, index - 1]) {
    const entry = entries[near];
    if (entry?.kind === 'work' && entry.hero) {
      new Image().src = mediaUrl(entry.hero.src);
    }
  }
}

function stopTween() {
  cancelAnimationFrame(tween);
  tween = 0;
}

function tweenDescent(to: number, seconds: number) {
  stopTween();
  if (!engine) {
    return;
  }
  const from = engine.targets.descent;
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / (seconds * 1000));
    if (engine) {
      engine.targets.descent = from + (to - from) * ease(t);
    }
    tween = t < 1 ? requestAnimationFrame(frame) : 0;
  };
  tween = requestAnimationFrame(frame);
}

export function boot(created: Engine | null) {
  engine = created;
  let index = indexForPath(location.pathname);
  const deep = index >= 0;
  const anchor = OLD_ANCHORS[location.hash];
  if (!deep && anchor) {
    index = entries.findIndex((entry) => entry.id === anchor);
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const landing = engine !== null && index < 0 && !seen() && !reducedMotion;
  index = Math.max(0, index);

  setState({index, open: deep, landing});
  // The page's own fades follow the descent through this; the engine keeps it
  // up to date from its first frame on.
  document.documentElement.style.setProperty('--descent', landing ? '0' : '1');
  if (deep) {
    history.replaceState(null, '', pathFor(entries[index].id) + location.search);
    document.title = caseTitle(index);
  } else if (location.pathname !== '/' || location.hash) {
    history.replaceState(null, '', '/' + location.search);
  }

  if (engine) {
    // Anywhere but a first visit starts on the ocean: the first frame takes
    // these as they are.
    engine.targets.descent = landing ? 0 : 1;
    steer(index, index);
  }
  prefetch(index);
  window.addEventListener('popstate', onPopState);
}

// The browser's back and forward buttons move between the home page and a case study.
function onPopState() {
  const index = indexForPath(location.pathname);
  if (index >= 0) {
    if (getState().landing) {
      skip();
    }
    const from = getState().index;
    setState({index, open: true, direction: index >= from ? 1 : -1});
    steer(from, index);
    pushed = true;
    document.title = caseTitle(index);
  } else {
    setState({open: false});
    pushed = false;
    document.title = site.title;
  }
}

export function select(index: number) {
  const state = getState();
  const next = clamp(index, 0, entries.length - 1);
  if (next === state.index) {
    if (state.sheet) {
      setState({sheet: false});
    }
    return;
  }
  setState({index: next, direction: next > state.index ? 1 : -1, sheet: false});
  steer(state.index, next);
  prefetch(next);

  // An open case study follows the selection, or closes on a stop without one.
  if (state.open) {
    if (hasCaseStudy(entries[next])) {
      history.replaceState(null, '', pathFor(entries[next].id));
      document.title = caseTitle(next);
    } else {
      close();
    }
  }
}

export function step(direction: number) {
  select(getState().index + direction);
}

// The previous or next entry that has a case study, from inside one.
export function caseNeighbour(direction: 1 | -1): number {
  for (let i = getState().index + direction; i >= 0 && i < entries.length; i += direction) {
    if (hasCaseStudy(entries[i])) {
      return i;
    }
  }
  return -1;
}

export function stepCase(direction: 1 | -1) {
  const index = caseNeighbour(direction);
  if (index >= 0) {
    select(index);
  }
}

export function open(index = getState().index) {
  if (!hasCaseStudy(entries[index])) {
    return;
  }
  const state = getState();
  if (index !== state.index) {
    select(index);
  }
  if (state.open) {
    history.replaceState(null, '', pathFor(entries[index].id));
  } else {
    history.pushState(null, '', pathFor(entries[index].id));
    pushed = true;
  }
  setState({open: true, sheet: false});
  document.title = caseTitle(index);
}

export function close() {
  if (!getState().open) {
    return;
  }
  setState({open: false});
  document.title = site.title;
  if (pushed) {
    pushed = false;
    history.back();
  } else {
    history.replaceState(null, '', '/');
  }
}

export function setSheet(sheet: boolean) {
  setState({sheet});
}

// Moves the descent by `amount` of its whole length, from the wheel, a drag
// or a key, while it is playing.
export function descend(amount: number) {
  if (!engine) {
    return;
  }
  stopTween();
  engine.targets.descent = clamp(engine.targets.descent + amount, 0, 1);
}

// Plays the rest of the descent quickly rather than cutting it.
export function skip() {
  if (!engine) {
    setState({landing: false});
    return;
  }
  const left = 1 - engine.targets.descent;
  tweenDescent(1, Math.max(0.4, SKIP_SECONDS * left));
}

// Lifts the camera back into space and starts the descent over.
export function replay() {
  if (!engine) {
    return;
  }
  close();
  select(0);
  setState({landing: true, sheet: false});
  tweenDescent(0, REPLAY_SECONDS);
}

// The engine calls this once the camera is down.
export function landed() {
  if (getState().landing) {
    setState({landing: false});
  }
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Without storage the descent simply plays again next time.
  }
}
