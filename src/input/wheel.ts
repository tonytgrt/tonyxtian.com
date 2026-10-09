// Turns the wheel into steps: one per gesture. A trackpad flick goes on
// sending events for a second or more as its momentum dies away, and all of
// that is still the one gesture, so it moves the site one entry, not five.

// Quiet, in ms, that ends a gesture.
const GAP = 240;
// How far, in px, a gesture must move before it steps, so a nudge doesn't.
const DEAD = 24;
// After a step, how long in ms before the same gesture may step again.
const COOL = 380;
// Momentum only ever fades, so an event this much bigger than the one before,
// twice running, is a new flick laid over the old one's tail; so is a single
// event JUMP times bigger, if it is big enough to be deliberate.
const RISE = 1.15;
const JUMP = 2.5;
// A wheel with notches sends one event per click, with pauses between; a
// trackpad streams them every frame. An event after this long a pause, in ms,
// is a fresh click.
const NOTCH = 90;

// The wheel's vertical movement in pixels, whichever unit the browser used.
export function wheelDelta(e: WheelEvent): number {
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
  return e.deltaY * unit;
}

export class WheelSteps {
  private last = -Infinity;       // when the latest event came
  private moved = 0;              // how far the gesture has gone before stepping
  private stepped = false;
  private steppedAt = -Infinity;
  private rising = 0;
  private previous = 0;           // the size of the event before
  private held = false;
  private onStep: (direction: 1 | -1) => void;

  constructor(onStep: (direction: 1 | -1) => void) {
    this.onStep = onStep;
  }

  feed(delta: number, time: number) {
    const pause = this.observe(time);
    const size = Math.abs(delta);

    if (!this.held) {
      if (!this.stepped) {
        this.moved += delta;
        if (Math.abs(this.moved) >= DEAD) {
          this.step(this.moved, time);
        }
      } else {
        this.rising = size > this.previous * RISE && size > 4 ? this.rising + 1 : 0;
        const flick = this.rising >= 2 || (size > this.previous * JUMP && size >= DEAD);
        const click = pause > NOTCH && size >= DEAD;
        if ((flick || click) && time - this.steppedAt > COOL) {
          this.step(delta, time);
        }
      }
    }
    this.previous = size;
  }

  // Notes an event's time without stepping: the descent takes the wheel while
  // it plays, but this still has to know when that gesture ends. Returns the
  // pause since the event before.
  observe(time: number): number {
    const pause = time - this.last;
    if (pause > GAP) {
      this.moved = 0;
      this.stepped = false;
      this.rising = 0;
      this.previous = 0;
      this.held = false;
    }
    this.last = time;
    return pause;
  }

  // Whether the gesture under way is being swallowed.
  get holding(): boolean {
    return this.held;
  }

  // Swallows the rest of the gesture under way: the descent ends partway
  // through a scroll, and its momentum shouldn't run on into the site. It lasts
  // until the events themselves pause, judged by their own timestamps, since a
  // busy page can deliver the tail of a gesture late; the first event of a new
  // gesture lifts it.
  hold() {
    this.held = true;
  }

  private step(delta: number, time: number) {
    this.stepped = true;
    this.steppedAt = time;
    this.rising = 0;
    this.onStep(delta > 0 ? 1 : -1);
  }
}
