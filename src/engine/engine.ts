// The portfolio hero's background. This is a copy of the 566-hw1 fireball
// project, reworked to live behind the page: it draws into the hero's canvas
// rather than a full-window one, and has none of the standalone project's
// on-screen tooling. The fireball is shrunk down to a comet that circles the
// mouse cursor.
import {mat4, vec3} from 'gl-matrix';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Comet from './Comet';
import {descentView, ease} from './Descent';
import {setGL} from './globals';
import ShaderProgram, {Shader, FireballParams, BackgroundParams, BackgroundView} from './rendering/gl/ShaderProgram';

import lambertVertSource from './shaders/lambert-vert.glsl?raw';
import lambertFragSource from './shaders/lambert-frag.glsl?raw';
import backgroundVertSource from './shaders/background-vert.glsl?raw';
import backgroundFragSource from './shaders/background-frag.glsl?raw';

// Set this to false to draw only the background quad (the planet and starfield).
const SHOW_FIREBALL = true;

// Full device resolution on a high-DPI screen quadruples the fragment work for
// a backdrop that is mostly soft noise, so the pixel ratio is capped.
const MAX_PIXEL_RATIO = 1.5;

// Once the landing is over, the ocean behind the content is drawn at less than
// one pixel per CSS pixel, whatever the screen's density. It is on screen for
// as long as the visitor reads, and it is soft enough to lose nothing by it.
// The end of the page goes back to full resolution once the camera starts to
// look up, for the horizon, the stars and the face of the moon.
const OCEAN_PIXEL_RATIO = 0.75;

// How fast the planet turns and its clouds drift, as seen from where the
// landing starts. Both are divided by the zoom as the camera falls, so the
// ground doesn't race past once it is magnified.
const SPIN_RATE = 0.012;
const CLOUD_DRIFT_RATE = 0.02;

// How quickly the landing catches up with the scroll position, per second.
// A mouse wheel scrolls in steps; following them this way turns each one into
// a short glide instead of a jump.
const SCROLL_SMOOTHING = 12;

// Radius of the comet's head in CSS pixels. Its glow thins out toward the edge,
// so the bright part of the head reads a little smaller than this.
const HEAD_RADIUS = 16;

// The tail answers to speed: near the flame's own shape when slow, and drawn
// out longer and narrower as the comet speeds up. Heights are in head radii.
// SPEED_SCALE is the speed, in px/s, at which it is about two-thirds grown.
const FAST_FLAME_HEIGHT = 6.5;
const FAST_TAPER = 0.75;
const SPEED_SCALE = 290;

// The sharpest the tail may curve, per head radius. A sudden jerk of the cursor
// spikes the path's curvature for a frame or two, and without a limit the tail
// would snap into a hook.
const MAX_CURVATURE = 0.3;

// Seconds the comet takes to grow in when the cursor first appears.
const APPEAR_TIME = 0.5;

// Where the comet's glow is seen from: straight out of the screen, to match the
// orthographic view.
const EYE = vec3.fromValues(0, 0, 100);

// The art-directed defaults from the standalone project. There is no dat.GUI
// panel here, so these are simply the values the shaders get, except that the
// comet overrides the flame height and taper every frame from its speed.
const params: FireballParams & BackgroundParams & {tesselations: number} = {
  tesselations: 5,
  displacement: 0.18,   // amplitude of the low-frequency upward sway
  lobeScale: 1.2,       // frequency of that sway
  detail: 0.37,         // amplitude of the high-frequency FBM, which forms the licks
  detailScale: 6,     // frequency of that FBM
  octaves: 5,           // how many FBM octaves get summed
  roilSpeed: 1.1,       // how fast the flame streams upward
  pulsePeriod: 4.7,     // seconds per surge cycle
  pulseStrength: 0.59,  // 0 holds the flame steady, 1 is the full surge
  heat: 0.5,            // 0.5 is the gradient as authored, higher runs hotter
  flow: 0.42,           // how strongly flowing noise warps the color gradient
  bandBlend: 0.79,      // 0 gives hard cel band edges, 1 an unbroken gradient
  flameHeight: 1.5,     // vertical stretch from sphere to flame
  taper: 0.12,          // how far the crown is drawn in relative to the root
  bands: 0,             // quantized color bands; below 2 the gradient is smooth. The
                        // fireball's 12 cel bands read as fire, not as a comet's glow.
  horizon: -0.3,        // where the planet's limb crosses the centre of the screen
  atmosphere: 0.028,    // thickness of the atmospheric halo above the limb
};

// Everything only the flame needs, created only when it is shown.
interface Fireball {
  lambert: ShaderProgram;
  icosphere: Icosphere;
}

function createFireball(gl: WebGL2RenderingContext): Fireball {
  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, lambertVertSource),
    new Shader(gl.FRAGMENT_SHADER, lambertFragSource),
  ]);

  const icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, params.tesselations);
  icosphere.create();

  return {lambert, icosphere};
}

function main() {
  const canvas = <HTMLCanvasElement> document.getElementById('backdrop-canvas');
  if (!canvas) {
    return;
  }
  const gl = canvas.getContext('webgl2');
  // Without WebGL 2 the page just keeps its plain CSS backgrounds.
  if (!gl) {
    return;
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  const square = new Square(vec3.fromValues(0, 0, 0));
  square.create();

  const renderer = new OpenGLRenderer(canvas);
  // The background covers every pixel, so this only shows if it fails to draw.
  renderer.setClearColor(0.004, 0.006, 0.014, 1);

  const background = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, backgroundVertSource),
    new Shader(gl.FRAGMENT_SHADER, backgroundFragSource),
  ]);

  const fireball = SHOW_FIREBALL ? createFireball(gl) : null;
  const comet = new Comet();
  const shape = {...params};
  const viewProj = mat4.create();
  const model = mat4.create();

  // The cursor, in client coordinates. Tracked on the window, because the
  // canvas sits underneath the page and never receives the mouse itself. Only
  // a real mouse counts; on touch screens there is no cursor to circle, so the
  // comet stays hidden.
  let pointerX = 0;
  let pointerY = 0;
  let hasPointer = false;
  let appearedAt = -1;
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') {
      pointerX = e.clientX;
      pointerY = e.clientY;
      hasPointer = true;
    }
  }, {passive: true});

  // Match the drawing buffer to the canvas's CSS size at `ratio` pixels per CSS
  // pixel. Checked every frame, so a resize or a change of ratio comes out right.
  function resize(ratio: number) {
    const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width === width && canvas.height === height) {
      return;
    }
    renderer.setSize(width, height);
  }

  // The hero is a tall track of scroll the landing plays out over; the canvas
  // itself is fixed behind the whole page.
  const hero = document.querySelector<HTMLElement>('.home-hero');
  // And the end of the page is another, below the content: night falls as
  // the last of it scrolls away, and once it has gone, scrolling on looks up
  // from the sea to the horizon.
  const finale = document.querySelector<HTMLElement>('.finale');
  const view: BackgroundView = {
    pan: 0, zoom: 1, cloudZoom: 1, spin: 0, cloudDrift: 0, inside: 0, scroll: 0, night: 0, finale: 0,
  };
  let progress = -1;
  let nightProgress = -1;
  let finaleProgress = -1;

  const startTime = performance.now();
  let lastTime = 0;
  let drawn = false;

  // This function will be called every frame
  function tick() {
    // Seconds since the program started, passed to the shaders so their
    // displacement and color animate over time.
    const time = (performance.now() - startTime) * 0.001;
    // Capped, so a frame after a hidden tab comes back doesn't fling the comet.
    const dt = Math.min(time - lastTime, 0.1);
    lastTime = time;

    // 0 at the top of the page, 1 where the content takes over: the distance
    // scrolled through is the hero's height less the screen's. The first frame
    // starts where the page already is, so a reload halfway down doesn't
    // replay the landing. Without a hero there is no landing, only the ocean.
    const rect = canvas.getBoundingClientRect();
    let target = 1;
    if (hero) {
      const heroRect = hero.getBoundingClientRect();
      const travel = heroRect.height - rect.height;
      target = travel > 0 ? Math.min(1, Math.max(0, -heroRect.top / travel)) : 0;
    }
    const follow = 1 - Math.exp(-dt * SCROLL_SMOOTHING);
    progress = progress < 0 ? target : progress + (target - progress) * follow;

    // Night: 0 as the end of the content reaches the bottom of the screen, 1
    // as it leaves the top, so the sky is all night before the camera looks
    // up at it. Then the look up: 0 there, 1 at the very bottom of the page,
    // measured against the visible height so that it gets there.
    let nightTarget = 0;
    let finaleTarget = 0;
    if (finale) {
      const finaleRect = finale.getBoundingClientRect();
      const screen = window.innerHeight;
      const travel = finaleRect.height - screen;
      nightTarget = Math.min(1, Math.max(0, (screen - finaleRect.top) / screen));
      finaleTarget = travel > 0 ? Math.min(1, Math.max(0, -finaleRect.top / travel)) : 0;
    }
    nightProgress = nightProgress < 0
      ? nightTarget
      : nightProgress + (nightTarget - nightProgress) * follow;
    finaleProgress = finaleProgress < 0
      ? finaleTarget
      : finaleProgress + (finaleTarget - finaleProgress) * follow;

    const descent = descentView(progress);
    view.pan = descent.pan;
    view.zoom = descent.zoom;
    view.cloudZoom = descent.cloudZoom;
    view.inside = descent.inside;
    view.scroll = window.scrollY / Math.max(1, rect.height);
    view.night = ease(nightProgress);
    view.finale = ease(finaleProgress);
    view.spin += dt * SPIN_RATE / descent.zoom;
    view.cloudDrift += dt * CLOUD_DRIFT_RATE / descent.cloudZoom;

    const fullRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    resize(descent.inside >= 1 && view.finale <= 0 ? OCEAN_PIXEL_RATIO : fullRatio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    renderer.clear();

    // The background is a screen-space quad drawn before anything else. With
    // the depth test off it neither tests nor writes depth, so it can never
    // occlude the flame no matter where the camera is.
    gl.disable(gl.DEPTH_TEST);
    background.setTime(time);
    background.setDimensions(canvas.width, canvas.height);
    background.setBackgroundParams(params);
    background.setBackgroundView(view);
    background.draw(square);

    if (fireball && hasPointer && descent.comet > 0 && rect.width >= 1 && rect.height >= 1) {
      // The cursor in the comet's coordinates: CSS pixels from the canvas's
      // bottom-left corner, y up. Read fresh each frame, since scrolling moves
      // the canvas under a mouse that hasn't moved.
      const targetX = pointerX - rect.left;
      const targetY = rect.bottom - pointerY;
      if (appearedAt < 0) {
        comet.reset(targetX, targetY);
        appearedAt = time;
      }
      comet.update(targetX, targetY, dt, time);

      const grow = 1 - Math.exp(-comet.speed / SPEED_SCALE);
      shape.flameHeight = params.flameHeight + (FAST_FLAME_HEIGHT - params.flameHeight) * grow;
      shape.taper = params.taper + (FAST_TAPER - params.taper) * grow;

      // Orthographic and sized in pixels: one unit of the flame's own space is
      // one head radius on screen, centred on the comet. Depth is squashed into
      // range and flipped so +z faces the eye.
      const appear = Math.min(1, (time - appearedAt) / APPEAR_TIME);
      const scale = HEAD_RADIUS * appear * appear * (3 - 2 * appear);
      mat4.fromTranslation(viewProj, [2 * comet.x / rect.width - 1,
                                      2 * comet.y / rect.height - 1, 0]);
      mat4.scale(viewProj, viewProj, [2 * scale / rect.width, 2 * scale / rect.height, -0.1]);

      // Turn the flame's +Y, which is its tail, to point back along the path.
      mat4.fromZRotation(model, Math.atan2(comet.vx, -comet.vy));
      const curvature = Math.max(-MAX_CURVATURE,
                                 Math.min(MAX_CURVATURE, comet.curvature * HEAD_RADIUS));

      // Added on top of the sky rather than drawn over it, which is what makes
      // the comet glow and its tail thin away to nothing. Addition doesn't care
      // about order, so the near and far sides of it need no depth test.
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      fireball.lambert.setTime(time);
      fireball.lambert.setFireballParams(shape);
      fireball.lambert.setCurvature(curvature);
      renderer.render(viewProj, model, EYE, fireball.lambert, [fireball.icosphere],
                      descent.comet);
      gl.disable(gl.BLEND);
    }

    // With a frame drawn, the canvas can take over as the page's background:
    // the stylesheet clears the sections' own backgrounds under this class.
    // Not before, or they would clear onto a blank canvas for a frame.
    if (!drawn) {
      document.documentElement.classList.add('webgl');
      drawn = true;
    }

    // Tell the browser to call `tick` again whenever it renders a new frame.
    // The canvas is always on screen now, so this runs for as long as the page
    // is open, and the browser pauses it on its own in a background tab.
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

main();
