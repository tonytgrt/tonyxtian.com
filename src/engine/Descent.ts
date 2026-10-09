// The landing that plays as the visitor scrolls through the hero: the camera
// pans down to look straight at the planet, falls toward it, drops through the
// clouds as they thin away, and comes down over the ocean the content page
// sits on, still looking down at it.
// `progress` runs from 0 at the top of the page to 1 where the hero hands over
// to the content.
//
//   0.00 - 0.40  pan down and a little right until the planet's centre is mid-screen
//   0.30 - 0.85  fall: the ground zooms in, and the nearer clouds faster still,
//                swelling past the edges of the screen and thinning away
//   0.64 - 0.86  the close view of the sea fades up as the last clouds clear, and
//                the camera drops toward it
//
// The sea is in view before the content's light text starts to rise over it
// (see $heroOverlap), and the last stretch is the sea alone, so the smoothing
// in main.ts has caught up by the time the content takes over.

// Height of the cloud deck and the lowest the camera gets, both as fractions of
// the altitude it starts from. Each layer's magnification is the starting
// altitude over its current distance from the camera, so as the camera nears
// the deck the clouds balloon while the ground far below grows only steadily.
const CLOUD_DECK = 0.03;
const LOWEST = 0.034;

export interface DescentView {
  pan: number;        // 0 to 1, toward looking straight at the planet's centre
  zoom: number;       // magnification of the ground
  cloudZoom: number;  // magnification of the cloud deck
  inside: number;     // 0 to 1, from the planet's own ocean to the close view of it
  comet: number;      // brightness of the comet, which belongs to space and fades
                      // out before the fall
}

// Where `x` is between `a` and `b`, as 0 to 1.
function span(x: number, a: number, b: number) {
  return Math.min(1, Math.max(0, (x - a) / (b - a)));
}

// Eased in and out, so no stage starts or stops with a jolt.
export function ease(x: number) {
  return x * x * (3 - 2 * x);
}

export function descentView(progress: number): DescentView {
  // The altitude falls geometrically, so the magnification multiplies at an
  // even rate rather than lurching at the end.
  const altitude = Math.pow(LOWEST, ease(span(progress, 0.30, 0.85)));

  return {
    pan: ease(span(progress, 0.0, 0.40)),
    zoom: 1 / altitude,
    cloudZoom: (1 - CLOUD_DECK) / (altitude - CLOUD_DECK),
    inside: ease(span(progress, 0.64, 0.86)),
    comet: 1 - ease(span(progress, 0.20, 0.35)),
  };
}
