// The site's WebGL world, drawn into the canvas fixed behind everything: the
// landing from space, the ocean the site sits on, and the night it ends under.
// It began as the 566-hw1 fireball project, and the fireball lives on as a
// comet that circles the mouse cursor while the camera is still in space.
//
// The renderer knows nothing about the page. The app steers it through
// `targets`, and every frame eases the camera toward them, so React never has
// to render per frame.
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
// The finale goes back to full resolution once the camera starts to look up,
// for the horizon, the stars and the face of the moon.
const OCEAN_PIXEL_RATIO = 0.75;

// How fast the planet turns and its clouds drift, as seen from where the
// landing starts. Both are divided by the zoom as the camera falls, so the
// ground doesn't race past once it is magnified.
const SPIN_RATE = 0.012;
const CLOUD_DRIFT_RATE = 0.02;

// How quickly the landing catches up with its target, per second. The wheel
// moves the target in steps; following them this way turns each one into a
// short glide instead of a jump.
const DESCENT_SMOOTHING = 12;

// The camera's flight over the sea between entries is a critically damped
// spring: it eases out of rest and settles without overshooting, in about a
// second at this stiffness.
const TRAVEL_STIFFNESS = 4.5;

// The finale moves at a steady pace in stages per second: night falls over the
// first stage, then the camera looks up over the second. Each stage eases in
// and out, so they read as two beats rather than one long swing.
const FINALE_RATE = 0.7;

// How far the landing must have played before it counts as over.
const LANDED_AT = 0.985;

// How often, in seconds, the measured frame time is reported to the page.
const STATS_INTERVAL = 0.25;

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

// Wave evaluations per ocean pixel, read from the shader so the HUD can't drift
// from what is actually drawn.
const WAVES = Number(/WAVE_ITERATIONS\s*=\s*(\d+)/.exec(backgroundFragSource)?.[1] ?? 0);

export interface EngineStats {
  frameMs: number;  // mean time between frames over the last report
  ratio: number;    // drawing-buffer pixels per CSS pixel
  waves: number;    // wave evaluations per ocean pixel
}

export interface Engine {
  // Where the app wants the camera. The frame loop eases toward these; only
  // the first frame takes them as they are, so a page opened mid-site starts
  // there instead of flying in.
  targets: {
    descent: number;  // the landing: 0 in space, 1 down on the ocean (see Descent.ts)
    finale: number;   // 0 by day, 1 once night has fallen, 2 looking up at the horizon
    travel: number;   // how far over the sea the camera has flown, in screens
  };
  readonly descent: number;               // the landing as drawn this frame
  onLanded: (() => void) | null;          // once each time the landing completes
  onStats: ((stats: EngineStats) => void) | null;
}

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

// Starts drawing into `canvas` and returns the handle that steers it, or null
// if there is no WebGL 2 or the shaders won't build, in which case the page
// keeps its plain CSS background.
export function createEngine(canvas: HTMLCanvasElement): Engine | null {
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    return null;
  }
  // `setGL` sets the `gl` the rendering classes import from `globals.ts`.
  setGL(gl);

  let square: Square;
  let renderer: OpenGLRenderer;
  let background: ShaderProgram;
  let fireball: Fireball | null;
  try {
    square = new Square(vec3.fromValues(0, 0, 0));
    square.create();
    renderer = new OpenGLRenderer(canvas);
    // The background covers every pixel, so this only shows if it fails to draw.
    renderer.setClearColor(0.004, 0.006, 0.014, 1);
    background = new ShaderProgram([
      new Shader(gl.VERTEX_SHADER, backgroundVertSource),
      new Shader(gl.FRAGMENT_SHADER, backgroundFragSource),
    ]);
    fireball = SHOW_FIREBALL ? createFireball(gl) : null;
  } catch (error) {
    console.error('The WebGL backdrop failed to start:', error);
    return null;
  }

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

  const view: BackgroundView = {
    pan: 0, zoom: 1, cloudZoom: 1, spin: 0, cloudDrift: 0, inside: 0, scroll: 0, night: 0, finale: 0,
  };
  let progress = 0;
  let stage = 0;
  let travel = 0;
  let travelSpeed = 0;
  let first = true;
  let landed = false;
  let shownDescent = -1;

  const engine: Engine = {
    targets: {descent: 0, finale: 0, travel: 0},
    get descent() {
      return progress;
    },
    onLanded: null,
    onStats: null,
  };

  const root = document.documentElement;
  const startTime = performance.now();
  let lastTime = 0;
  let statFrames = 0;
  let statTime = 0;

  const tick = () => {
    // Seconds since the engine started, passed to the shaders so their
    // displacement and color animate over time.
    const time = (performance.now() - startTime) * 0.001;
    const frameTime = time - lastTime;
    // Capped, so a frame after a hidden tab comes back doesn't fling the comet.
    const dt = Math.min(frameTime, 0.1);
    lastTime = time;

    const targets = engine.targets;
    const descentTarget = Math.min(1, Math.max(0, targets.descent));
    const stageTarget = Math.min(2, Math.max(0, targets.finale));
    if (first) {
      progress = descentTarget;
      stage = stageTarget;
      travel = targets.travel;
      first = false;
    } else {
      progress += (descentTarget - progress) * (1 - Math.exp(-dt * DESCENT_SMOOTHING));

      const stageStep = dt * FINALE_RATE;
      stage = stageTarget > stage
        ? Math.min(stageTarget, stage + stageStep)
        : Math.max(stageTarget, stage - stageStep);

      const decay = Math.exp(-dt * TRAVEL_STIFFNESS);
      const offset = travel - targets.travel;
      const pull = (travelSpeed + TRAVEL_STIFFNESS * offset) * dt;
      travel = targets.travel + (offset + pull) * decay;
      travelSpeed = (travelSpeed - TRAVEL_STIFFNESS * pull) * decay;
    }

    // The page fades its own pieces in and out with the landing through this.
    if (Math.abs(progress - shownDescent) > 0.0005 || (progress === descentTarget && progress !== shownDescent)) {
      shownDescent = progress;
      root.style.setProperty('--descent', progress.toFixed(4));
    }

    if (descentTarget >= 1 && progress > LANDED_AT) {
      if (!landed) {
        landed = true;
        engine.onLanded?.();
      }
    } else if (descentTarget < 1) {
      landed = false;
    }

    const descent = descentView(progress);
    view.pan = descent.pan;
    view.zoom = descent.zoom;
    view.cloudZoom = descent.cloudZoom;
    view.inside = descent.inside;
    view.scroll = travel;
    view.night = ease(Math.min(1, stage));
    view.finale = ease(Math.max(0, stage - 1));
    view.spin += dt * SPIN_RATE / descent.zoom;
    view.cloudDrift += dt * CLOUD_DRIFT_RATE / descent.cloudZoom;

    const fullRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const ratio = descent.inside >= 1 && view.finale <= 0 ? OCEAN_PIXEL_RATIO : fullRatio;
    resize(ratio);
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

    const rect = canvas.getBoundingClientRect();
    if (fireball && hasPointer && descent.comet > 0 && rect.width >= 1 && rect.height >= 1) {
      // The cursor in the comet's coordinates: CSS pixels from the canvas's
      // bottom-left corner, y up.
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

    // With a frame drawn, the canvas can take over as the page's background.
    if (!root.classList.contains('webgl')) {
      root.classList.add('webgl');
    }

    // The real time between frames, not the capped step, so a slow frame
    // shows; but not the gap while the tab was hidden.
    if (frameTime < 1) {
      statFrames += 1;
      statTime += frameTime;
    }
    if (statTime >= STATS_INTERVAL) {
      engine.onStats?.({frameMs: statTime * 1000 / statFrames, ratio, waves: WAVES});
      statFrames = 0;
      statTime = 0;
    }

    // The canvas is always on screen, so this runs for as long as the page is
    // open; the browser pauses it on its own in a background tab.
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
  return engine;
}
