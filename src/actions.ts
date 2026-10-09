// Everything that changes what the page shows: stepping between entries,
// opening and closing a case study (with its address), and the descent. The
// components and the input handlers both come through here, and this is the
// one place that steers the WebGL engine.
import {entries, FIRST_STOP, hasCaseStudy, INTRO} from './content/entries';
import {site} from './content/site';
import {ease} from './engine/Descent';
import type {Engine} from './engine/engine';
import {mediaUrl} from './media';
import {indexForPath, pathFor} from './routing';
import {getState, setState, type Theme} from './store';

// Set once a visitor has landed, so the descent only plays on a first visit.
const SEEN_KEY = 'tonyxtian.landed';

// The visitor's theme, kept for next time. index.html reads it too, before
// anything is drawn, so a light-theme visitor never sees the dark one flash.
const THEME_KEY = 'tonyxtian.theme';

// The browser's own chrome on phones follows the theme.
const THEME_COLORS: Record<Theme, string> = {dark: '#020a12', light: '#dceaf5'};

// How far the camera flies over the sea per step, in screens, and the most
// steps' worth it flies at once, so a jump across the whole index still glides.
const TRAVEL_PER_STEP = 0.8;
const MAX_TRAVEL_STEPS = 2;

// How long going back to the intro takes to lift the camera into space, and
// Skip to bring it all the way down (less if part of the descent has played).
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
// Where the running tween is taking the descent, if one is.
let tweenTo: number | null = null;

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

function storedTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

// The page's colours switch through data-theme (see app.css); the sea and sky
// turn through the engine.
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.dataset.theme = 'light';
  } else {
    delete root.dataset.theme;
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  if (engine) {
    engine.targets.day = theme === 'light' ? 1 : 0;
  }
}

export function setTheme(theme: Theme) {
  setState({theme});
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Without storage the theme lasts until the page is left.
  }
}

export function toggleTheme() {
  setTheme(getState().theme === 'light' ? 'dark' : 'light');
}

function caseTitle(index: number) {
  return `${entries[index].title} · ${site.name}`;
}

// What the stage shows once `next` is selected: `next` itself, except on the
// way back from Contact. Then the stage keeps Contact, whose card sinks away
// with the camera, and the next entry waits until the camera has come down
// from the horizon (finaleCleared) rather than arriving over the night sky.
function stageFor(next: number): number {
  const waiting = engine !== null && !engine.finaleClear && entries[next].id !== 'contact';
  return waiting ? getState().onStage : next;
}

// Points the camera at the selected entry: on over the sea, and up at the
// night sky for Contact.
function steer(from: number, to: number) {
  if (!engine) {
    return;
  }
  travel += clamp(to - from, -MAX_TRAVEL_STEPS, MAX_TRAVEL_STEPS) * TRAVEL_PER_STEP;
  engine.targets.travel = travel;
  engine.targets.finale = entries[to].id === 'contact' ? 1 : 0;
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
  tweenTo = null;
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
    if (t < 1) {
      tween = requestAnimationFrame(frame);
    } else {
      tween = 0;
      tweenTo = null;
    }
  };
  tween = requestAnimationFrame(frame);
  tweenTo = to;
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
  // A first visit starts at the intro, out in space; any other starts on the
  // ocean, at About unless the address names somewhere else.
  if (index < 0) {
    index = landing ? INTRO : FIRST_STOP;
  }

  const theme = storedTheme();
  setState({index, onStage: index === INTRO ? FIRST_STOP : index, open: deep, landing, webgl: engine !== null, theme});
  // Before the engine's first frame, which takes its targets as they are: a
  // page opened in the light theme starts in the day rather than turning to it.
  applyTheme(theme);
  // The page's own fades follow the descent and the finale through these; the
  // engine keeps them up to date from its first frame on.
  document.documentElement.style.setProperty('--descent', landing ? '0' : '1');
  if (engine) {
    document.documentElement.style.setProperty('--finale', '0');
  }
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
    setState({index, onStage: stageFor(index), open: true, direction: index >= from ? 1 : -1});
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
  // Without WebGL there is no descent, so no intro to go back to.
  const next = clamp(index, engine ? INTRO : FIRST_STOP, entries.length - 1);
  if (next === INTRO) {
    replay();
    return;
  }
  if (next === state.index) {
    if (state.sheet) {
      setState({sheet: false});
    }
    return;
  }
  setState({index: next, onStage: stageFor(next), direction: next > state.index ? 1 : -1, sheet: false});
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
  if (tweenTo !== null) {
    // Already gliding that way, up to the intro or down for Skip: let it
    // finish rather than stall it on the tail of the same scroll.
    if (Math.sign(tweenTo - engine.targets.descent) === Math.sign(amount)) {
      return;
    }
    stopTween();
  }
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

// Goes back to the intro: lifts the camera into space, from where scrolling
// plays the descent again. The Intro entry, a step up from About and the name
// in the top bar all come here.
export function replay() {
  const state = getState();
  if (!engine || state.landing) {
    return;
  }
  close();
  steer(state.index, INTRO);
  // The stage keeps what it shows and fades out with the rest of the site;
  // switching it to anything else now would flash on the way up.
  setState({index: INTRO, landing: true, sheet: false, direction: -1});
  tweenDescent(0, REPLAY_SECONDS);
}

// The engine calls this once the camera is back down from the horizon after
// Contact: whatever was selected meanwhile comes onto the stage now. During the
// intro the stage stays as it is until the landing.
export function finaleCleared() {
  const state = getState();
  if (!state.landing && state.onStage !== state.index) {
    setState({onStage: state.index});
  }
}

// The engine calls this once the camera is down. Down from the intro, the site
// starts at About, which only now comes onto the stage.
export function landed() {
  const state = getState();
  if (state.landing || state.index === INTRO) {
    const index = state.index === INTRO ? FIRST_STOP : state.index;
    setState({landing: false, index, onStage: index, arrivals: state.arrivals + 1, direction: 1});
  }
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Without storage the descent simply plays again next time.
  }
}
