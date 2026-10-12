// Every stop on the site, in order: the intro and About, then the work by
// pass, newest first within each, then Contact. Scrolling steps through them
// one at a time. Content comes from the resumes in /home/ubuntu/TonyTianResume
// (resume_cg.tex is the one used for new grad applications).
import type {Entry, WorkEntry} from './types';
import {passes} from './site';

const work: WorkEntry[] = [
  {
    kind: 'work',
    id: 'apple',
    pass: 'production',
    title: 'Apple',
    metric: '4×',
    tagline: 'UI Rendering GPU Software Engineer Intern',
    dates: 'May – Aug 2026',
    span: ['2026-05', '2026-08'],
    place: 'Cupertino, CA',
    stack: ['Core Animation', 'UI Rendering', 'GPU Profiling', 'iOS & macOS'],
    counters: [
      {value: '4×', label: 'faster internal development workflow, merged into main'},
    ],
    links: [],
    blocks: [
      {kind: 'p', text: "GPU and UI rendering in production, on **Core Animation**, Apple's UI rendering framework."},
      {
        kind: 'list',
        items: [
          'Designed and shipped **internal developer tooling for Core Animation**, taking it from proposal through design, implementation, on-device validation, and multi-round code review with senior engineers toward integration into a shared release branch.',
          'Built **cross-platform CLI tooling** and wrote internal architecture documentation of the subsystems involved, verified against source, so other engineers can use the workflow after the internship. The tool speeds up an internal development workflow by **4×** and is merged into the main branch.',
          'Screened, triaged, and **fixed system UI rendering bugs** reported throughout the iOS and macOS 27.0 betas, working with other Apple teams to minimize regressions before each public release.',
        ],
      },
    ],
  },
    {
    kind: 'work',
    id: 'cuda-path-tracer',
    pass: 'rendering',
    title: 'CUDA Path Tracer',
    metric: '3–160×',
    tagline: 'Monte Carlo path tracing on the GPU, with a BVH and OptiX denoising',
    dates: 'Sep – Oct 2025',
    span: ['2025-09', '2025-10'],
    stack: ['CUDA', 'GLSL', 'C++'],
    counters: [
      {value: '3–160×', label: 'frame rate from the BVH in complex scenes'},
      {value: '+24–67%', label: 'from stream compaction'},
      {value: '+6–24%', label: 'from Russian roulette'},
    ],
    hero: {src: 'pathtracer.jpg', width: 1200, height: 1200, alt: 'Glass and chrome chess pieces on a checkered board, path traced in CUDA'},
    links: [{label: 'GitHub', href: 'https://github.com/tonytgrt/CUDA-Path-Tracer'}],
    blocks: [
      {
        kind: 'p',
        text: 'A physically-based Monte Carlo path tracer in CUDA, rendering complex 3D scenes with custom models and environment maps.',
      },
      {
        kind: 'list',
        items: [
          '**BSDF shading kernel** with global illumination, multiple importance sampling, anti-aliasing, and sub-surface scattering, across PBR materials with albedo and texture maps',
          '**Asset pipeline**: glTF 2.0 loading through tinygltf, and denoising with NVIDIA OptiX',
          '**GPU optimization**: a BVH for 3×–160× the frame rate in complex scenes, plus stream compaction (+24–67%), Russian roulette (+6–24%), and material sorting (+5%)',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'webgpu',
    pass: 'rendering',
    title: 'WebGPU Renderer',
    metric: '53×',
    tagline: '5,000 dynamic lights in a browser, three ways',
    dates: 'Sep – Oct 2025',
    span: ['2025-09', '2025-10'],
    stack: ['WebGPU', 'TypeScript', 'WGSL'],
    counters: [
      {value: '53×', label: 'faster than naive forward rendering'},
      {value: '497 → 9.3 ms', label: 'per frame at 5,000 lights'},
      {value: '3.5×', label: 'faster than Forward+'},
    ],
    hero: {src: 'webgpu.jpg', width: 1600, height: 765, alt: 'The Sponza atrium lit by thousands of coloured point lights'},
    links: [
      {label: 'Live demo', href: 'https://webgpu.tonyxtian.com'},
      {label: 'GitHub', href: 'https://github.com/tonytgrt/Project4-WebGPU-Forward-Plus-and-Clustered-Deferred'},
    ],
    blocks: [
      {
        kind: 'p',
        text: 'Three real-time renderers for 5,000+ dynamic point lights in the Sponza scene: naive forward, Forward+, and clustered deferred.',
      },
      {
        kind: 'list',
        items: [
          '**Light clustering** in compute shaders: a 16×9×24 grid with exponential depth slices and sphere–AABB culling',
          '**G-buffer** with 3 render targets for two-pass deferred shading',
          '**53× faster** than naive rendering (497 ms to 9.3 ms at 5,000 lights) and 3.5× faster than Forward+, measured by an automated benchmark across 30 configurations',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'matforge',
    pass: 'rendering',
    title: 'MatForge',
    metric: '+2.57 dB',
    tagline: 'Four SIGGRAPH papers in one Vulkan path tracer',
    dates: 'Nov – Dec 2025',
    span: ['2025-11', '2025-12'],
    team: 'Team project',
    stack: ['Vulkan 1.3', 'Slang', 'C++'],
    counters: [
      {value: '+2.57 dB', label: 'PSNR over PCG sampling at 512 spp'},
      {value: '44.7%', label: 'lower MSE than PCG'},
      {value: '<1%', label: 'sampling overhead'},
    ],
    hero: {src: 'matforge.jpg', width: 1600, height: 1041, alt: 'A ruined conservatory with a piano, rendered by MatForge'},
    links: [
      {label: 'Project website', href: 'https://matforge.github.io/'},
      {label: 'GitHub', href: 'https://github.com/MatForge/MatForge'},
    ],
    blocks: [
      {
        kind: 'p',
        text: 'A GPU path tracer that implements four SIGGRAPH 2023–24 papers in one Vulkan ray tracing pipeline. I wrote **2,400+ lines** of its C++ and Slang, covering the sampling and geometry systems.',
      },
      {
        kind: 'list',
        items: [
          "**Quad-optimized low-discrepancy sampling** (SIGGRAPH 2024): a base-3 Sobol' generator with Owen scrambling across 47 dimensions, for +2.57 dB PSNR and 44.7% lower MSE than PCG at 512 spp, under 1% overhead",
          '**RMIP intersection shaders** (SIGGRAPH Asia 2023) for tessellation-free displacement mapping by hierarchical ray traversal in texture space',
          '**Automated convergence benchmarks** measuring PSNR and SSIM across sampling configurations, on glTF 2.0 scenes with HDR environment maps',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'vulkan-grass',
    pass: 'rendering',
    title: 'Vulkan Grass Renderer',
    label: 'Vulkan Grass',
    metric: '4.31×',
    tagline: 'A million blades of grass, simulated and culled on the GPU',
    dates: 'Oct – Nov 2025',
    span: ['2025-10', '2025-11'],
    stack: ['Vulkan', 'GLSL', 'C++'],
    counters: [
      {value: '1M', label: 'blades simulated every frame'},
      {value: '4.31×', label: 'faster with GPU culling at 1M blades'},
      {value: '10 → 2', label: 'tessellation subdivisions, near to far'},
    ],
    hero: {
      src: 'vulkan-grass.jpg',
      video: 'vulkan-grass.webm',
      width: 1280,
      height: 718,
      alt: 'A dense field of grass blades bending in the wind under a pale sky',
    },
    links: [{label: 'GitHub', href: 'https://github.com/tonytgrt/Vulkan-Grass-Renderer'}],
    blocks: [
      {
        kind: 'p',
        text: 'Real-time grass in Vulkan: up to 1 million physically animated blades at interactive frame rates, using compute and tessellation pipelines.',
      },
      {
        kind: 'list',
        items: [
          "**Compute-shader physics** applying gravity, Hooke's-law recovery, and turbulent wind to Bézier-curve blades, 1M+ updates per frame",
          '**Three-tier GPU culling** (orientation, view frustum, distance) with atomics and indirect draws, 4.31× faster at 1M blades',
          '**Hardware tessellation** with distance-based level of detail, from 10 down to 2 subdivisions',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'this-site',
    pass: 'rendering',
    title: 'tonyxtian.com',
    label: 'This site',
    metric: 'WebGL 2',
    tagline: 'This portfolio, drawn live: a procedural planet, sea and sky in WebGL 2',
    dates: 'Sep – Oct 2026',
    span: ['2026-09', '2026-10'],
    stack: ['WebGL 2', 'GLSL', 'TypeScript', 'React'],
    counters: [
      {value: '1', label: 'full-screen shader for the whole world: space, planet, clouds, sea and sky'},
      {value: '24', label: 'wave evaluations per ocean pixel, from hundreds in the raymarched original'},
      {value: '0', label: 'textures or models: all of it is procedural'},
    ],
    hero: {
      src: 'og.jpg',
      width: 1600,
      height: 900,
      alt: "The site's night finale: the moon over a dark sea, its light in a path across the water",
    },
    links: [{label: 'GitHub', href: 'https://github.com/tonytgrt/TonyTianPortfolio'}],
    blocks: [
      {
        kind: 'p',
        text: 'The portfolio is itself a rendering project. Everything behind the pages is drawn live by **one full-screen GLSL fragment shader** on WebGL 2: space, a planet and its clouds, the sea, and the sky by night and by day. There are **no textures or models**; all of it is procedural, from noise, a few spheres and light.',
      },
      {kind: 'h', text: 'From orbit to the sea'},
      {
        kind: 'p',
        text: "The home page opens in space over a planet, with a comet circling the cursor on a precessing **Kepler orbit**, its tail stretching with speed and bending with its path. Scrolling plays the descent: the camera pans onto the planet and falls toward it. The clouds sit nearer the camera than the ground and magnify faster, a **parallax** that makes the zoom read as a fall, and they thin away as the camera drops through them. Noise octaves are added **fractionally** as the zoom doubles, so the coastlines keep their detail without popping, and the sea rises during the fall so the camera always comes down over open water.",
      },
      {
        kind: 'media',
        media: {src: 'og.jpg', width: 1200, height: 630, alt: 'The opening: the planet from orbit, under the name'},
        caption: 'The opening, out in space, where the descent starts.',
      },
      {kind: 'h', text: 'One pass of waves'},
      {
        kind: 'p',
        text: "The sea is adapted from afl_ext's MIT-licensed **Very fast procedural ocean**: peaked sine waves, each dragging the water along for the next. The original raymarches the surface and differences its height for the normal. Here the view ray meets the water directly, and the slope is summed alongside the height in the same loop: **24 wave evaluations a pixel instead of hundreds**. The water is a sphere the planet's size, which is what curves the horizon, and its normals flatten with distance so the far sea doesn't fizz with detail finer than its pixels. Fresnel reflection of the sky, light scattered up through the crests and an ACES tonemap finish it.",
      },
      {kind: 'h', text: 'Night and day'},
      {
        kind: 'p',
        text: "The last stop, Contact, looks up from the sea to the horizon on a **critically damped spring** that sets off alongside the camera's glide over the water. Night has to fall before any sky comes into view, so its timing comes from the camera's own geometry: night is complete in 0.45 s, and the top of the screen clears the horizon only at 0.53 to 0.6 s, whatever the screen's shape. The moon is shaded as a **sphere in screen space**, with seas, craters, a soft terminator and a darkened rim, and its light on the water is its own disc mirrored in the waves that catch it.",
      },
      {
        kind: 'media',
        media: {src: 'site-day.jpg', width: 1600, height: 900, alt: 'The same view by day: the sun low over a bright sea, with clouds'},
        caption: 'By day, where the moon was. The switch in the bottom bar turns the sky round to it.',
      },
      {
        kind: 'p',
        text: "The theme switch turns a **wheel of sky**: the sun and the moon ride opposite ends of it, turning about the view's axis, so the moon sets on the right as the sun rises on the left, arcs over the top and settles in its place. The page's own colours are registered CSS custom properties, which fade in step with the sea.",
      },
      {kind: 'h', text: 'Frame budget'},
      {
        kind: 'list',
        items: [
          "The sea behind the content is drawn at **0.75 pixels per CSS pixel**, whatever the screen's density; full resolution, capped at 1.5, comes back only for the finale's horizon, stars and moon",
          'Each scene is worked out only while it can be seen: the planet costs nothing once the sea has taken over',
          "The top bar shows the renderer's own numbers, **measured live**: the time between frames, the pixel ratio and the waves summed per pixel",
        ],
      },
      {kind: 'h', text: 'Around the renderer'},
      {
        kind: 'list',
        items: [
          'The renderer is plain TypeScript, and **React** draws the panels around it; the two meet only through a few targets the frame loop eases toward, so nothing re-renders per frame',
          '**One step per scroll gesture**: trackpad momentum is told apart from a fresh flick by its timing and by how its deltas grow, so a flick moves one project, not five',
          'Every project has its own **address**, prerendered with its own title, description and share card; assets are content-hashed, so the CDN can keep them for good',
          'Keyboard throughout, a live region that announces each step, **reduced motion** respected, and a plain HTML version of every page for visitors without script',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'icepeak',
    pass: 'interactive',
    title: 'IcePEAK',
    metric: 'Quest 3',
    tagline: 'VR ice climbing for Meta Quest 3',
    dates: 'Apr – May 2026',
    span: ['2026-04', '2026-05'],
    team: 'Team of 3',
    stack: ['Unity 6', 'C#', 'XR Interaction Toolkit'],
    counters: [],
    hero: {src: 'icepeak.jpg', width: 1600, height: 905, alt: 'IcePEAK in VR: an ice pick biting into a glacier wall'},
    links: [{label: 'GitHub', href: 'https://github.com/tonytgrt/IcePEAK'}],
    blocks: [
      {
        kind: 'p',
        text: "A first-person VR ice-climbing game for Meta Quest 3. I built the ice-pick climbing system, the game's signature mechanic.",
      },
      {
        kind: 'list',
        items: [
          "**Swing detection** that samples the pick's tip, not the controller, over a rolling 5-frame window, so a wrist flick registers as a real swing",
          "**Full-body climbing locomotion** driven by each hand's controller motion, kept stable during two-handed holds",
          '**Event-driven pick core** that let teammates add ice destruction, checkpoints, and gadgets without touching it, plus breakable ice with crack decals and physics debris',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'butterflight',
    pass: 'interactive',
    title: 'ButterFlight',
    metric: 'Maya C++',
    tagline: 'Physically plausible butterfly flight, as a Maya plug-in',
    dates: 'Feb – May 2026',
    span: ['2026-02', '2026-05'],
    team: 'Team of 2',
    stack: ['Maya C++', 'MEL', 'Python'],
    counters: [
      {value: '100', label: 'butterflies in a swarm, with path following and wind'},
      {value: '5 DOF', label: 'thorax, wings and abdomen'},
    ],
    hero: {src: 'butterflight.jpg', width: 1600, height: 900, alt: 'A blue butterfly animated by ButterFlight, landing on a flower'},
    links: [{label: 'GitHub', href: 'https://github.com/tonytgrt/ButterFlight'}],
    blocks: [
      {
        kind: 'p',
        text: "A Maya 2026 C++ plug-in that automates physically plausible butterfly flight, based on Chen et al.'s SIGGRAPH 2022 paper, so VFX artists can fill a scene with butterflies without keyframing them.",
      },
      {
        kind: 'list',
        items: [
          '**Parametric 5-DOF motion** of the thorax, wings, and abdomen, driving a hierarchical skeleton',
          '**Quasi-steady aerodynamics**: lift and drag on each wing, plus a curl-noise vortex field for the chaotic wobble of real flight',
          '**Swarms** of up to 100 butterflies with path following and wind, baked to standard Maya keyframes for Alembic or FBX export',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'umbra',
    pass: 'interactive',
    title: 'Umbra',
    metric: 'UE5',
    tagline: 'A puzzle game played in the shadows of movable lights',
    dates: 'Feb – Apr 2026',
    span: ['2026-02', '2026-04'],
    team: 'Team of 3',
    stack: ['Unreal Engine 5', 'C++', 'UMG/Slate'],
    counters: [
      {value: '37 of 59', label: 'gameplay source files written'},
      {value: '60%', label: "of the team's commits"},
      {value: '3', label: 'platforms: Windows, macOS and iOS'},
    ],
    hero: {src: 'umbra.jpg', width: 1600, height: 736, alt: "Umbra's tutorial on iOS: walking in a light's shadow, with the touch thumbstick"},
    links: [{label: 'GitHub', href: 'https://github.com/tonytgrt/Umbra'}],
    blocks: [
      {
        kind: 'p',
        text: 'A top-down puzzle game where the player travels through the shadows cast by movable lights. Shipped for Windows and macOS, then ported to iOS. I wrote 37 of its 59 gameplay source files.',
      },
      {
        kind: 'list',
        items: [
          '**Light subsystem**: every shadow-casting light and shadow bridge registers itself with a world subsystem, held by weak pointer so destroyed actors drop out cleanly',
          "**Shadow occlusion test** tracing from the player's feet to every light each tick, driving falls, bridge traversal, and the HUD",
          '**Complete front end** in UMG/Slate, and a touch thumbstick and mobile layout for the iOS port, which I did solo',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'stack-n-climb',
    pass: 'interactive',
    title: 'Stack-N-Climb',
    metric: 'UE5',
    tagline: 'Shoot falling disks to freeze them, then climb them',
    dates: 'Feb 2026',
    span: ['2026-02', '2026-02'],
    stack: ['Unreal Engine 5', 'C++', 'Blueprint'],
    counters: [],
    hero: {src: 'stacknclimb.jpg', width: 1600, height: 900, alt: 'Stack-N-Climb gameplay: the robot aiming at falling disks'},
    links: [
      {label: 'Watch demo', href: 'https://youtu.be/Ms5AON0CXhE'},
      {label: 'GitHub', href: 'https://github.com/tonytgrt/StackNClimb'},
    ],
    blocks: [
      {
        kind: 'p',
        text: 'A third-person climbing platformer: shoot falling disks to freeze them into platforms, and climb to the target height.',
      },
      {
        kind: 'list',
        items: [
          '**Component-based C++ systems**: a respawning disk grid, a three-state falling-disk machine, and a reusable shooting component',
          '**Freeze rules** that keep one active disk above the player and promote or release disks as they climb',
          '**Camera-accurate hitscan** with aim-down-sights, Niagara beam effects, and physics knockback',
        ],
      },
    ],
  },
  {
    kind: 'work',
    id: 'mini-minecraft',
    pass: 'interactive',
    title: 'Mini Minecraft',
    metric: 'OpenGL',
    tagline: 'A voxel engine with infinite procedural worlds',
    dates: 'Oct – Dec 2024',
    span: ['2024-10', '2024-12'],
    stack: ['C++', 'OpenGL', 'Qt', 'GLSL'],
    counters: [
      {value: '1M+', label: 'blocks of infinite procedural world'},
      {value: '60+ FPS', label: 'while the world generates'},
      {value: '5', label: 'biomes from Perlin noise'},
    ],
    hero: {src: 'minecraft.jpg', width: 1600, height: 1194, alt: 'Procedural voxel terrain: stone cliffs, blocky trees and a desert with cacti'},
    links: [{label: 'Watch demo', href: 'https://youtu.be/jRb4EHV5KQI'}],
    blocks: [
      {
        kind: 'p',
        text: 'A fully-featured voxel game engine built in C++ with OpenGL, generating infinite procedural worlds with 1M+ blocks while maintaining 60+ FPS.',
      },
      {
        kind: 'list',
        items: [
          '**Procedural terrain** from Perlin noise across 5 distinct biomes',
          '**Post-processing effects**, and dual physics simulation with gravity and buoyancy',
          '**Chunk-based world management** with frustum culling',
        ],
      },
    ],
  },

  // Drafts: not on the site. Their images are in src/media/drafts/, which the
  // build doesn't ship; move one up into src/media/ along with publishing it.
  {
    kind: 'work',
    id: 'pennos',
    pass: 'systems',
    title: 'PennOS',
    metric: 'C',
    tagline: 'A UNIX-like operating system in user space',
    dates: 'Mar – May 2025',
    span: ['2025-03', '2025-05'],
    team: 'Team of 4',
    stack: ['C', 'Make', 'GDB'],
    counters: [
      {value: '8,000+', label: 'lines of systems code'},
      {value: '50+', label: 'concurrent processes'},
    ],
    links: [],
    blocks: [
      {
        kind: 'p',
        text: 'A complete user-level operating system implemented in C with 8000+ lines of systems code. Features include Process Control Block (PCB) managing 50+ concurrent processes, preemptive multi-level priority scheduler with Round Robin time-slicing, POSIX-compliant interactive shell with 15+ built-in commands, and comprehensive system call interface with signal handling.',
      },
    ],
    draft: true,
  },
  {
    kind: 'work',
    id: 'tt-slots',
    pass: 'systems',
    title: 'T&T Slots',
    metric: 'AVR',
    tagline: 'A slot machine that adapts to your heart rate',
    dates: 'Mar – May 2025',
    span: ['2025-03', '2025-05'],
    stack: ['ATMega328PB', 'Bare-metal C'],
    counters: [{value: '100 Hz', label: 'heart rate sampling'}],
    links: [{label: 'Project website', href: 'https://upenn-embedded.github.io/final-project-s25-t-t-slots-sense-the-win/'}],
    blocks: [
      {
        kind: 'p',
        text: 'An embedded gaming system integrating biometric feedback with real-time probability adjustment. Features custom ATMega328PB firmware with I2C communication for MAX30102 SPO2 sensor achieving 100Hz heart rate sampling, real-time graphics rendering engine for LCD display, and adaptive probability algorithm correlating heart rate variability to game difficulty.',
      },
    ],
    draft: true,
  },
];

// The work that is on the site, grouped in the passes' order.
export const shownWork: WorkEntry[] = passes.flatMap((pass) =>
  work.filter((entry) => entry.pass === pass.id && !entry.draft));

export const entries: Entry[] = [
  {kind: 'page', id: 'intro', title: 'Intro', label: 'Intro'},
  {kind: 'page', id: 'about', title: 'About', label: 'About'},
  ...shownWork,
  {kind: 'page', id: 'contact', title: 'Contact', label: 'Contact'},
];

// The intro is the descent from space, so it has no page of its own: going to
// it lifts the camera back up, and landing arrives at the first stop, About.
// Without WebGL there is no descent, and About is where everything starts.
export const INTRO = entries.findIndex((entry) => entry.id === 'intro');
export const FIRST_STOP = entries.findIndex((entry) => entry.id === 'about');

// The entries that have a page of their own, which a route opens.
export function hasCaseStudy(entry: Entry): boolean {
  return entry.kind === 'work' || entry.id === 'about';
}

export function entryIndex(id: string): number {
  return entries.findIndex((entry) => entry.id === id);
}
