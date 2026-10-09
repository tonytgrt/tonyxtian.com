// The wheel, keys and touch. The page itself never scrolls: a gesture steps
// between entries, or plays the descent while that is on. Only the case study
// and the index scroll natively, and only when they overflow.
import {entries} from '../content/entries';
import {close, descend, open, select, setSheet, skip, step, stepCase} from '../actions';
import {getState} from '../store';
import {WheelSteps, wheelDelta} from './wheel';

// How many screens of scrolling the whole descent takes, as it did when it was
// a scroll track on the old page.
const DESCENT_SCREENS = 2.4;
// A drag on a touch screen covers less ground than a wheel, so it counts double.
const TOUCH_DESCENT_GAIN = 2;
// How much of the descent one press of an arrow key plays.
const KEY_DESCENT = 0.12;
// How far, in px, a finger must travel to count as a swipe.
const SWIPE = 48;
// The fastest a held key repeats a step, in ms.
const KEY_REPEAT = 140;

// The scrolling element around `target`, if it has anything to scroll.
function scroller(target: EventTarget | null): HTMLElement | null {
  const element = target instanceof Element ? target.closest<HTMLElement>('[data-scroll]') : null;
  return element && element.scrollHeight > element.clientHeight + 1 ? element : null;
}

export function bindInput(): {hold: () => void} {
  const wheel = new WheelSteps((direction) => step(direction));

  window.addEventListener('wheel', (e) => {
    // Pinching on a trackpad arrives as a wheel with ctrl held: that's the
    // browser's zoom, not ours.
    if (e.ctrlKey) {
      return;
    }
    const state = getState();
    const delta = wheelDelta(e);
    if (state.landing) {
      e.preventDefault();
      wheel.observe(e.timeStamp);
      descend(delta / (DESCENT_SCREENS * window.innerHeight));
      return;
    }
    if (state.open) {
      // The case study takes the wheel wherever the pointer is.
      const pane = document.querySelector<HTMLElement>('[data-pane-scroll]');
      if (pane && !pane.contains(e.target as Node)) {
        e.preventDefault();
        pane.scrollBy({top: delta});
      }
      return;
    }
    if (state.sheet || scroller(e.target)) {
      return;
    }
    e.preventDefault();
    wheel.feed(delta, e.timeStamp);
  }, {passive: false});

  let lastKeyStep = 0;
  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('input, textarea, select, [contenteditable]')) {
      return;
    }
    // Enter and Space on a focused button or link press it, as usual.
    const onControl = !!target?.closest('a, button, [role="button"]');
    const state = getState();

    if (state.landing) {
      switch (e.key) {
        case 'ArrowDown': case 'PageDown': case ' ': case 'j':
          if (e.key === ' ' && onControl) {
            return;
          }
          descend(KEY_DESCENT);
          break;
        case 'ArrowUp': case 'PageUp': case 'k':
          descend(-KEY_DESCENT);
          break;
        case 'Enter': case 'Escape':
          if (e.key === 'Enter' && onControl) {
            return;
          }
          skip();
          break;
        default:
          return;
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'Escape') {
      if (state.sheet) {
        setSheet(false);
      } else if (state.open) {
        close();
      } else {
        return;
      }
      e.preventDefault();
      return;
    }
    if (state.sheet) {
      return;
    }
    if (e.repeat && e.timeStamp - lastKeyStep < KEY_REPEAT) {
      e.preventDefault();
      return;
    }

    if (state.open) {
      // Up, down and space scroll the case study, which has focus.
      if (e.key === 'ArrowLeft') {
        stepCase(-1);
      } else if (e.key === 'ArrowRight') {
        stepCase(1);
      } else {
        return;
      }
    } else {
      switch (e.key) {
        case 'ArrowDown': case 'ArrowRight': case 'PageDown': case 'j':
          step(1);
          break;
        case 'ArrowUp': case 'ArrowLeft': case 'PageUp': case 'k':
          step(-1);
          break;
        case ' ':
          if (onControl) {
            return;
          }
          step(e.shiftKey ? -1 : 1);
          break;
        case 'Home':
          select(0);
          break;
        case 'End':
          select(entries.length - 1);
          break;
        case 'Enter':
          if (onControl) {
            return;
          }
          open();
          break;
        default:
          return;
      }
    }
    lastKeyStep = e.timeStamp;
    e.preventDefault();
  });

  // One finger: during the descent a drag plays it like a scroll; otherwise a
  // swipe steps, up or left for the next entry.
  let touch: {x: number; y: number; lastY: number; scrolls: boolean} | null = null;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) {
      touch = null;
      return;
    }
    const point = e.touches[0];
    touch = {x: point.clientX, y: point.clientY, lastY: point.clientY, scrolls: scroller(e.target) !== null};
  }, {passive: true});

  window.addEventListener('touchmove', (e) => {
    if (!touch || e.touches.length !== 1) {
      return;
    }
    const y = e.touches[0].clientY;
    if (getState().landing) {
      descend(TOUCH_DESCENT_GAIN * (touch.lastY - y) / (DESCENT_SCREENS * window.innerHeight));
    }
    touch.lastY = y;
  }, {passive: true});

  window.addEventListener('touchend', (e) => {
    const start = touch;
    touch = null;
    const state = getState();
    if (!start || start.scrolls || state.landing || state.open || state.sheet) {
      return;
    }
    const point = e.changedTouches[0];
    const dx = point.clientX - start.x;
    const dy = point.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) {
      return;
    }
    if (Math.abs(dy) > Math.abs(dx)) {
      step(dy < 0 ? 1 : -1);
    } else {
      step(dx < 0 ? 1 : -1);
    }
  }, {passive: true});

  window.addEventListener('touchcancel', () => {
    touch = null;
  }, {passive: true});

  return {hold: () => wheel.hold()};
}
