// The motion of the comet that circles the mouse cursor. Everything here is in
// CSS pixels measured from the bottom-left of the canvas, y up, so the numbers
// read the same as what is on screen.
//
// Two layers make up the path:
//  - An anchor that chases the cursor on a critically damped spring. Moving the
//    mouse drags the whole orbit along a beat behind it, and that lag is what
//    draws the tail out when the cursor moves quickly.
//  - A Kepler ellipse around the anchor, with the anchor at one focus. The comet
//    whips round close to the cursor and loiters at the far end, the way a real
//    one does round the sun, and since the tail grows with speed it is longest
//    at the closest pass, as a real comet's is too.

const ORBIT_SIZE   = 70;    // semi-major axis of the ellipse, px
const ECCENTRICITY = 0.5;   // 0 is a circle; closer to 1 is a longer, thinner loop
const PERIOD       = 3.4;   // seconds per lap
const PRECESSION   = 0.16;  // rad/s the ellipse itself turns, so no two laps line up
const FOLLOW       = 7.0;   // how quickly the anchor catches the cursor, rad/s

// The spring is integrated in steps no longer than this, so a slow frame can't
// make it overshoot and ring.
const MAX_STEP = 1 / 120;

class Comet {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  speed = 0;
  // Signed curvature of the path, per px: positive while it turns counter-clockwise.
  curvature = 0;

  private anchorX = 0;
  private anchorY = 0;
  private anchorVx = 0;
  private anchorVy = 0;

  // Put the anchor straight onto the cursor, for when it first appears, so the
  // comet doesn't sweep in from wherever the anchor happened to be.
  reset(targetX: number, targetY: number) {
    this.anchorX = targetX;
    this.anchorY = targetY;
    this.anchorVx = 0;
    this.anchorVy = 0;
  }

  // Advance by `dt` seconds towards the cursor at (targetX, targetY). `time`
  // drives the orbit directly, so its phase never drifts however frames fall.
  update(targetX: number, targetY: number, dt: number, time: number) {
    // ---- the anchor, chasing the cursor --------------------------------------
    const k = FOLLOW * FOLLOW;
    const c = 2 * FOLLOW;   // critical damping: the fastest approach with no overshoot
    let ax = 0;
    let ay = 0;
    for (let left = dt; left > 0; left -= MAX_STEP) {
      const h = Math.min(left, MAX_STEP);
      ax = k * (targetX - this.anchorX) - c * this.anchorVx;
      ay = k * (targetY - this.anchorY) - c * this.anchorVy;
      this.anchorVx += ax * h;
      this.anchorVy += ay * h;
      this.anchorX += this.anchorVx * h;
      this.anchorY += this.anchorVy * h;
    }

    // ---- the orbit around it ------------------------------------------------
    // Kepler's equation, M = E - e sin E, solved for the eccentric anomaly E by
    // Newton's method. A handful of steps is plenty at this eccentricity.
    const a = ORBIT_SIZE;
    const e = ECCENTRICITY;
    const b = a * Math.sqrt(1 - e * e);
    const n = 2 * Math.PI / PERIOD;   // mean motion
    const M = n * time;
    let E = M;
    for (let i = 0; i < 5; ++i) {
      E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
    const cosE = Math.cos(E);
    const sinE = Math.sin(E);

    // Position relative to the focus, then its velocity and the gravitational
    // acceleration that holds it on the ellipse (GM = n^2 a^3).
    const px = a * (cosE - e);
    const py = b * sinE;
    const dE = n / (1 - e * cosE);
    const pvx = -a * sinE * dE;
    const pvy = b * cosE * dE;
    const r = Math.hypot(px, py);
    const g = -(n * n * a * a * a) / (r * r * r);
    const pax = g * px;
    const pay = g * py;

    // Turn the whole ellipse slowly. The turn adds its own small sideways
    // velocity; its effect on the acceleration is too small to see.
    const w = PRECESSION * time;
    const cw = Math.cos(w);
    const sw = Math.sin(w);
    const ox = cw * px - sw * py;
    const oy = sw * px + cw * py;
    const ovx = cw * pvx - sw * pvy - PRECESSION * oy;
    const ovy = sw * pvx + cw * pvy + PRECESSION * ox;
    const oax = cw * pax - sw * pay;
    const oay = sw * pax + cw * pay;

    // ---- together -----------------------------------------------------------
    this.x = this.anchorX + ox;
    this.y = this.anchorY + oy;
    this.vx = this.anchorVx + ovx;
    this.vy = this.anchorVy + ovy;
    const accX = ax + oax;
    const accY = ay + oay;

    this.speed = Math.hypot(this.vx, this.vy);
    this.curvature = this.speed > 1e-3
      ? (this.vx * accY - this.vy * accX) / (this.speed * this.speed * this.speed)
      : 0;
  }
};

export default Comet;
