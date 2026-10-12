// Every stop on the site, in order: the intro and About, then the work by
// pass, newest first within each, then Contact. Scrolling steps through them
// one at a time. Content comes from the resumes in /home/ubuntu/TonyTianResume
// (resume_cg.tex is the one used for new grad applications), and the case
// studies from each project's README and docs on GitHub, with their measured
// results and the team's own record of who built what.
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
    // The work is internal: keep to what the resumes say.
    blocks: [
      {kind: 'p', text: "GPU and UI rendering in production, on **Core Animation**, Apple's UI rendering framework."},
      {kind: 'p', text: 'The details are internal, so this is the outline.'},
      {kind: 'h', text: 'Developer tooling'},
      {
        kind: 'list',
        items: [
          'Designed and shipped **internal developer tooling for Core Animation**, taking it from proposal through design, implementation, on-device validation, and multi-round code review with senior engineers toward integration into a shared release branch.',
          'Built **cross-platform CLI tooling** and wrote internal architecture documentation of the subsystems involved, verified against source, so other engineers can use the workflow after the internship. The tool speeds up an internal development workflow by **4×** and is merged into the main branch.',
        ],
      },
      {kind: 'h', text: 'In the rendering stack'},
      {
        kind: 'list',
        items: [
          'A **thread-safe publish/observe mechanism** in a large, performance-sensitive C++ codebase, replacing a per-consumer duplication scheme: a shared GPU resource is now built once and referenced by every consumer, instead of once for each.',
          "**Compiler-enforced thread-safety annotations** on shared mutable state, so a lock violation fails the build instead of relying on convention, and runtime assertions for an invariant that static analysis couldn't express across differing ownership models.",
          '**Less code doing more:** two near-duplicate cache-invalidation paths unified behind one parameterized helper, which also removed unneeded GPU pipeline recompilation on the narrower path.',
          '**Defects that appeared only in specific SDK and CPU-architecture build configurations**, diagnosed across platforms with controlled experiments that overturned an initial performance assumption by isolating where the cost actually was.',
        ],
      },
      {kind: 'h', text: 'Through the betas'},
      {
        kind: 'p',
        text: 'Screened, triaged, and **fixed system UI rendering bugs** reported throughout the iOS and macOS 27.0 betas, working with other Apple teams to minimize regressions before each public release.',
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
        text: 'A physically based **Monte Carlo path tracer** in CUDA. It renders globally illuminated images of custom scenes: glTF models with their own materials and textures, under HDR environment maps. It grew from the CIS 5650 base code into everything below.',
      },
      {kind: 'h', text: 'Materials'},
      {
        kind: 'list',
        items: [
          '**Diffuse:** Lambertian, sampled from a cosine-weighted hemisphere, so the BRDF and the PDF cancel and a bounce is just a multiply by the albedo.',
          "**Mirror and glass:** perfect specular reflection, and refraction by Snell's law, with Schlick's Fresnel choosing between reflecting and refracting, and total internal reflection.",
          '**PBR:** a Cook–Torrance BRDF in the metallic-roughness workflow, with the GGX (Trowbridge–Reitz) distribution, Smith masking and shadowing, Schlick Fresnel, transparency, and energy conserved between the diffuse and specular lobes.',
          '**Subsurface scattering** for translucent materials like jade, wax and skin: scattering radius and color per channel, anisotropy, and attenuation along diffusion profiles.',
        ],
      },
      {
        kind: 'gallery',
        items: [
          {
            media: {src: 'pt-sss-off.jpg', width: 800, height: 800, alt: 'A dark, opaque sphere in a Cornell box under a ceiling light'},
            label: 'Subsurface scattering off',
          },
          {
            media: {src: 'pt-sss-on.jpg', width: 800, height: 800, alt: 'The same sphere with subsurface scattering, pale and glowing with light from within'},
            label: 'Subsurface scattering on',
          },
        ],
      },
      {kind: 'h', text: 'Light and sampling'},
      {
        kind: 'list',
        items: [
          '**Multiple importance sampling** of three strategies, the area lights, the BRDF and the environment map, weighted by the power heuristic, in both the diffuse and the PBR shaders.',
          '**HDR environment maps** for image-based lighting, importance-sampled from precomputed CDFs.',
          '**Anti-aliasing** by jittering: each pixel is split into a grid, 2×2 by default, the iterations cycle through its cells, and each ray is jittered within its cell.',
          "**NVIDIA's OptiX 9.0 denoiser**, guided by albedo and normal buffers, with its blend and interval adjustable live: a clean preview in seconds instead of minutes.",
        ],
      },
      {
        kind: 'gallery',
        items: [
          {
            media: {src: 'pt-noisy.jpg', width: 800, height: 800, alt: 'Glass chess pieces on a marble board after 50 iterations, grainy with noise'},
            label: '50 iterations',
          },
          {
            media: {src: 'pt-denoised.jpg', width: 800, height: 800, alt: 'The same 50 iterations through the OptiX denoiser, smooth and clean'},
            label: '50 iterations, denoised',
          },
        ],
      },
      {kind: 'h', text: 'Geometry'},
      {
        kind: 'list',
        items: [
          '**glTF 2.0** through tinygltf, both `.gltf` and `.glb`: meshes, transforms, and metallic-roughness materials with their base color, normal and metallic-roughness textures.',
          '**A bounding volume hierarchy**, built on the CPU by the surface area heuristic into a GPU-friendly layout, and traversed iteratively with a stack.',
        ],
      },
      {
        kind: 'gallery',
        items: [
          {
            media: {src: 'pt-dragon.jpg', width: 800, height: 800, alt: 'A glass Stanford Dragon on a checkered cloth, lit through high windows'},
            label: 'Stanford Dragon, 134,995 triangles',
          },
          {
            media: {src: 'pt-porsche.jpg', width: 800, height: 800, alt: 'A black 1975 Porsche 911 parked on a street under a blue sky'},
            label: '1975 Porsche 911, 241K triangles',
          },
        ],
        caption: 'Models from the Khronos glTF samples, and by Lionsharp Studios on Sketchfab.',
      },
      {kind: 'h', text: 'Keeping the GPU busy'},
      {
        kind: 'p',
        text: 'Each bounce runs as kernels over every live path: intersection, then shading. Three optimizations work on that loop. All the timings are on an RTX 5080 with an i9-13900H.',
      },
      {
        kind: 'list',
        items: [
          '**Stream compaction.** Paths that miss everything or run out of bounces are gathered, then removed with `thrust::remove_if`, so each later bounce launches only for the paths still alive.',
          '**Russian roulette** from bounce 3: a path survives with a probability set by its throughput, kept within bounds, and survivors are divided by it, so the estimate stays unbiased.',
          '**Material sorting.** `thrust::sort_by_key` groups paths by material before shading, so the threads of a warp run the same code.',
        ],
      },
      {
        kind: 'table',
        head: ['Trace depth', 'With compaction', 'Without', 'Time saved'],
        rows: [
          ['4', '26 ms', '29 ms', '10%'],
          ['8', '32 ms', '42 ms', '24%'],
          ['12', '34 ms', '57 ms', '40%'],
          ['16', '34 ms', '68 ms', '50%'],
          ['24', '37 ms', '94 ms', '61%'],
          ['32', '39 ms', '118 ms', '**67%**'],
        ],
        caption: 'Stream compaction. With it, frame time levels off at 34–39 ms; without, it grows with every bounce.',
      },
      {
        kind: 'table',
        head: ['Trace depth', 'No roulette', 'From half depth', 'From a quarter'],
        rows: [
          ['8', '38 ms', '32 ms', '30 ms'],
          ['12', '42 ms', '36 ms', '32 ms'],
          ['16', '45 ms', '40 ms', '35 ms'],
          ['24', '48 ms', '45 ms', '39 ms'],
          ['32', '50 ms', '48 ms', '44 ms'],
        ],
        caption: 'Russian roulette, starting at half or at a quarter of the trace depth. From a quarter, it saves 12–24% of the frame.',
      },
      {
        kind: 'table',
        head: ['Scene', 'Triangles', 'With BVH', 'Without', 'Speedup'],
        rows: [
          ['Duck', '4K', '17 ms', '70 ms', '4.1×'],
          ['Spartan armor', '42K', '30 ms', '765 ms', '25.5×'],
          ['Dragon', '134K', '42 ms', '2,846 ms', '67.8×'],
          ['Dodge Challenger', '196K', '27 ms', '3,023 ms', '112×'],
          ['Porsche', '241K', '25 ms', '3,604 ms', '144×'],
          ['Chess set', '1.5M', '270 ms', '43,343 ms', '**160×**'],
        ],
        caption: 'The BVH. On the 1.5M-triangle chess set, 43 seconds a frame becomes 270 ms.',
      },
      {
        kind: 'table',
        head: ['Scene', 'Materials', 'Sorted', 'Unsorted'],
        rows: [
          ['Duck', '3', '17 ms', '15 ms'],
          ['Dragon', '6', '42 ms', '41 ms'],
          ['Spartan armor', '13', '29 ms', '28 ms'],
          ['Porsche', '16', '26 ms', '22 ms'],
          ['Dodge Challenger', '23', '27 ms', '23 ms'],
          ['Chess set', '18', '**267 ms**', '278 ms'],
        ],
        caption: 'Material sorting. It costs more than the coherence it buys, except on the 1.5M-triangle chess set, so it stays a compile-time switch, `MATERIAL_SORTING`.',
      },
      {kind: 'h', text: 'Tools'},
      {
        kind: 'p',
        text: 'An ImGui panel shows live statistics (frame rate, rays per second, iterations, active paths and per-kernel timings), orbits, pans and zooms the camera, loads another scene from its JSON file without a restart, drives the denoiser, and saves the image as a PNG.',
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
        text: 'Three real-time renderers for the Sponza atrium, lit by thousands of moving point lights, in WebGPU, TypeScript and WGSL: **naive forward**, **Forward+** and **clustered deferred**. It runs in the browser, live at webgpu.tonyxtian.com.',
      },
      {kind: 'h', text: 'Naive forward'},
      {
        kind: 'p',
        text: "The baseline. Every fragment loops over every light, with inverse-square falloff and Lambert's cosine, so its cost is fragments × lights: at 5,000 lights it draws 2 frames a second.",
      },
      {kind: 'h', text: 'Clustering the lights'},
      {
        kind: 'p',
        text: 'Forward+ and clustered deferred share a compute pass that sorts the lights into **clusters**. The view frustum is cut into a **16×9×24** grid: 16×9 tiles across the screen, and 24 slices in depth spaced **exponentially**, `near · (far / near)^(z / 24)`, so the slices are thin near the camera, where the detail is, and deep far away.',
      },
      {
        kind: 'p',
        text: "Each cluster gets a view-space bounding box, and every light whose sphere of influence meets the box joins the cluster's list through an `atomicAdd`, up to 256 lights a cluster. When shading, a fragment finds its cluster from its screen position and depth, and loops over only that cluster's lights. Every buffer follows WGSL's alignment rules, 16 bytes for a `vec3`, checked against an offset calculator.",
      },
      {kind: 'h', text: 'Forward+ and clustered deferred'},
      {
        kind: 'p',
        text: "**Forward+** shades in one pass, geometry and lighting together, with each fragment reading its cluster's lights. **Clustered deferred** splits it in two. A G-buffer pass writes position and normal (`rgba16float`) and albedo (`rgba8unorm`) to three render targets; then a fullscreen pass, a quad drawn with no vertex buffer, lights each pixel once from its cluster.",
      },
      {
        kind: 'table',
        head: ['', 'Forward+', 'Clustered deferred'],
        rows: [
          ['Passes', 'One: geometry and lighting', 'Two: G-buffer, then lighting'],
          ['Overdraw', 'Lights fragments that are later hidden', 'Lights each visible pixel once'],
          ['Memory', 'No G-buffer', 'Three G-buffer targets'],
          ['Bandwidth', 'Lower', 'The G-buffer is written, then read'],
          ['Transparency', 'Supported', 'Hard: one surface per pixel'],
        ],
      },
      {kind: 'h', text: 'Benchmarking'},
      {
        kind: 'p',
        text: 'One button runs the whole matrix unattended: 3 renderers × 10 light counts from 500 to 5,000, **30 configurations**. For each it switches renderer, waits 200 ms, warms up for 30 frames, records 120, and keeps the average, minimum and maximum; the results download as a CSV. It times whole frames, from one `requestAnimationFrame` to the next, so CPU work, GPU work and the two waiting on each other all count.',
      },
      {
        kind: 'table',
        head: ['Renderer', '500 lights', '2,000 lights', '5,000 lights', 'vs naive'],
        rows: [
          ['Naive forward', '52.3 ms', '199.3 ms', '497.2 ms', '1×'],
          ['Forward+', '8.3 ms', '16.0 ms', '32.8 ms', '15.1×'],
          ['Clustered deferred', '8.3 ms', '8.3 ms', '9.3 ms', '**53.4×**'],
        ],
        caption: 'Average frame time in Chrome on an RTX 5080, and the speedup at 5,000 lights. The display refreshes at 120 Hz, so 8.3 ms is the floor.',
      },
      {
        kind: 'p',
        text: 'Naive forward slows almost in proportion to the lights; Forward+ slows 4× for 10× the lights; clustered deferred barely moves. It was also the steadiest: across the run, naive frames took from 8 to 1,108 ms, Forward+ from 8 to 50, and clustered deferred from 8 to 17.',
      },
      {
        kind: 'p',
        text: 'With the same clusters, deferred is **3.5× faster than Forward+** at 5,000 lights. Forward+ lights fragments that are later drawn over, so its lighting cost rises with the geometry; deferred lights each visible pixel exactly once, in a fullscreen pass with coherent memory access.',
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
    team: 'Team of 3',
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
    // Who did what is from the project's README: Yiding the sampling and the
    // RMIP intersection shader, Cecilia the RMIP builder and analysis, Xiaonan
    // Fast-MSX and Bounded VNDF.
    blocks: [
      {
        kind: 'p',
        text: "A GPU path tracer that implements **four SIGGRAPH and SIGGRAPH Asia papers (2023–24)** in one Vulkan ray tracing pipeline, built by three of us in five weeks for CIS 5650, on NVIDIA's nvpro vk_gltf_renderer. I wrote **2,400+ lines** of its C++ and Slang: the sampling, its convergence analysis, and the RMIP intersection shader.",
      },
      {kind: 'h', text: 'One pipeline, four papers'},
      {kind: 'p', text: "Each paper owns a stage of a path's life:"},
      {
        kind: 'list',
        ordered: true,
        items: [
          '**Sampling.** Quad-optimized low-discrepancy sequences supply the random numbers.',
          '**Geometry.** RMIP ray-traces displacement maps directly, with no tessellation.',
          '**Directions.** Bounded VNDF sampling picks GGX reflection directions.',
          '**Evaluation.** Fast-MSX adds back the energy rough microfacets lose to multiple scattering.',
          '**Integration.** Monte Carlo combines them: `f(ωi, ωo) · L(ωo) · cos θ / pdf`.',
        ],
      },
      {kind: 'h', text: 'Quad-optimized sampling'},
      {
        kind: 'p',
        text: "From Ostromoukhov et al., SIGGRAPH 2024: low-discrepancy sequences optimized for the 2×2 pixel quads a GPU shades together, filling the sample space better than standard Sobol'. I built it end to end. On the host, a builder constructs the generator matrices of a **base-3 Sobol' sequence** from irreducible polynomials; on the GPU, a Slang sampler draws **Owen-scrambled** points, tracking each path's dimension, across **47 dimensions** and up to 243 (3⁵) points. A toggle switches between it and PCG while rendering.",
      },
      {
        kind: 'table',
        head: ['Samples per pixel', 'QOLDS', 'PCG', 'Gain', 'Lower MSE'],
        rows: [
          ['64', '37.70 dB', '37.24 dB', '+0.46 dB', '10.1%'],
          ['128', '40.67 dB', '39.80 dB', '+0.87 dB', '18.2%'],
          ['256', '43.58 dB', '42.03 dB', '+1.55 dB', '30.0%'],
          ['512', '46.38 dB', '43.81 dB', '**+2.57 dB**', '**44.7%**'],
        ],
        caption: 'PSNR with QOLDS and with PCG. The gain grows with the sample count, for under 1% more frame time.',
      },
      {
        kind: 'p',
        text: 'To measure it I wrote an **automated convergence framework**: it renders each sampling configuration, scores the images by PSNR, MSE and SSIM, and writes the results as CSV for plotting.',
      },
      {kind: 'h', text: 'Displacement without tessellation'},
      {
        kind: 'p',
        text: "RMIP, from Thonat, Georgiev, Beaune and Boubekeur (Adobe, SIGGRAPH Asia 2023), ray-traces displacement maps directly instead of tessellating them into triangles. A rectangular min-max image pyramid bounds the displaced height over any rectangle of texels, so a ray can be traversed through texture space hierarchically, skipping whole regions it can't hit. Cecilia built the pyramid and analyzed it; I wrote the **custom Vulkan intersection shader** that traverses it and reports where a ray meets the displaced surface, with support for glTF's `KHR_materials_displacement`. Getting it visually correct took 24 rounds of fixes.",
      },
      {
        kind: 'media',
        media: {
          src: 'matforge-rmip.jpg',
          width: 1404,
          height: 544,
          alt: 'Six flat planes carrying displacement maps, cobblestones, diamond quilting, rounded bumps and planks, each standing out in relief',
        },
        caption: 'Displacement maps ray-traced by RMIP, each on a flat plane with no tessellated geometry.',
      },
      {
        kind: 'table',
        head: ['Samples per pixel', 'PSNR, all leaves / ψ', 'SSIM, all leaves / ψ', 'ψ speedup'],
        rows: [
          ['4', '26.15 / 26.17', '0.6396 / 0.6412', '3.19×'],
          ['16', '32.22 / 32.27', '0.8772 / 0.8789', '1.42×'],
          ['64', '38.42 / 38.65', '0.9675 / 0.9692', '1.15×'],
          ['256', '45.38 / 47.28', '0.9933 / 0.9950', '0.93×'],
          ['512', '50.26 / 49.95', '0.9978 / 0.9976', '0.77×'],
        ],
        caption: "Two ways through the pyramid's leaves: testing every one, or ψ-guided marching. Guided marching is up to 3.2× faster at low sample counts and falls behind from about 128; holes stay under 0.3% of pixels at 512.",
      },
      {kind: 'h', text: 'The material model'},
      {kind: 'p', text: 'Xiaonan built the other two papers into the material system:'},
      {
        kind: 'list',
        items: [
          '**Bounded VNDF sampling** (Eto and Tokuyoshi, AMD, SIGGRAPH Asia 2023) samples GGX reflections from a tighter spherical cap, `k = (1 − a²)s² / (s² + a²z²)`, wasting fewer samples. In our tests it matched standard VNDF from α = 0.3 up and trailed it at low roughness, by 6.5 dB at α = 0.1, so standard VNDF stayed the default.',
          '**Fast-MSX** (SIGGRAPH 2023) adds the energy a single-scattering GGX BRDF loses at high roughness, through a relaxed V-cavity model. At α = 1.0 it reached about 48 dB at 512 spp, where plain GGX leveled off near 31.',
        ],
      },
      {kind: 'h', text: 'The demo scene'},
      {
        kind: 'p',
        text: "Sweeper3D's Forgotten Hall, with many of its materials and textures reworked so each paper has something to show: displaced stone paths, terrain and roof tiles for RMIP; rough stone, aged wood and metal fittings for the microfacet models; and foliage-dappled indirect light for the sampling.",
      },
      {
        kind: 'media',
        media: {
          src: 'matforge-close.jpg',
          width: 1280,
          height: 944,
          alt: 'Close up in the demo scene: stacks of old books, a goblet and a horse figurine on a round table, beside a weathered piano',
        },
        caption: 'A close view of the demo scene.',
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
        text: 'A real-time grass renderer in Vulkan, after Jahrmann and Wimmer\'s "Responsive Real-Time Grass Rendering for General 3D Scenes" (I3D 2017). Up to **2²⁰ blades**, about a million, are simulated and culled in a compute pass every frame, then tessellated into geometry by the graphics pipeline.',
      },
      {kind: 'h', text: 'A blade is a curve'},
      {kind: 'p', text: 'Each blade is a quadratic Bézier curve, its three control points packed with its parameters into 64 bytes:'},
      {
        kind: 'code',
        text: [
          'struct Blade {',
          '  vec4 v0;  // base position, and orientation θ',
          '  vec4 v1;  // Bézier guide point, and height',
          '  vec4 v2;  // tip, moved by the forces, and width',
          '  vec4 up;  // resting up direction, and stiffness',
          '};',
        ].join('\n'),
      },
      {kind: 'p', text: 'The forces move only the tip, v2. The guide point v1 follows from it, so the blade keeps a smooth curve.'},
      {kind: 'h', text: 'Forces'},
      {
        kind: 'list',
        items: [
          "**Gravity:** the environment's pull, plus a quarter of it toward the blade's front, `gE + 0.25·|gE|·f`, so blades droop forward instead of straight down.",
          "**Recovery:** Hooke's law, back toward the upright tip, `(v0 + up·h − v2) · stiffness`. Stiffness varies from 0.1 to 1.5 between blades, from floppy to stiff.",
          '**Wind:** a direction and strength modulated by gusts, slow waves of `sin` and `cos` across the field that you can see roll over it, plus faster turbulence. It pushes hardest on blades it meets broadside, and on those still standing tall.',
          "**Validation:** afterwards the tip is kept above the ground, the curve's length is held to the blade's height, and v1 is placed again so the curve stays smooth, whatever the forces did.",
        ],
      },
      {
        kind: 'gallery',
        items: [
          {
            media: {src: 'grass-still.jpg', width: 960, height: 540, alt: 'Grass blades standing straight up, tessellated with no forces applied'},
            label: 'No forces',
          },
          {
            media: {src: 'grass-gravity.jpg', width: 960, height: 540, alt: 'The same blades curving and drooping under gravity, held up by recovery'},
            label: 'Gravity and recovery',
          },
        ],
      },
      {kind: 'h', text: 'Culling'},
      {
        kind: 'p',
        text: 'The same compute pass decides which blades get drawn. The survivors are appended to an output buffer through an atomic counter, and the count feeds an **indirect draw**, so the CPU never needs to know how many are left.',
      },
      {
        kind: 'list',
        items: [
          '**Orientation:** a blade seen edge-on is a sliver, and `|dot(θ, view)| > 0.9` culls those within about 25° of edge-on.',
          "**View frustum:** the base and the tip are projected to NDC, and a blade is culled only when both are outside the same plane, with 0.1 of tolerance so blades don't pop at the edges of the screen.",
          "**Distance:** beyond 50 units every blade goes. Nearer, the distance falls into 10 buckets that keep a shrinking share of the blades, from all of them to a tenth, picked by a hash of each blade's position, so the same blades stay from frame to frame and nothing flickers.",
        ],
      },
      {kind: 'h', text: 'Tessellation'},
      {
        kind: 'p',
        text: "The tessellation control shader sets each blade's level of detail from its distance to the camera along the ground, falling off exponentially from **10 subdivisions** close up to **2** far away. The evaluation shader walks the curve by de Casteljau's algorithm and offsets each point sideways by the blade's width, tapering to the tip, and the fragment shader lights a dark-to-light green gradient with Lambert.",
      },
      {kind: 'h', text: 'Measuring it'},
      {
        kind: 'p',
        text: 'An ImGui panel tunes every force and culling parameter live, sets the blade count on a power-of-two slider from 1 to 2²⁰, and shows the current, average and **1% low** frame rates, with a frame-time graph. One button runs the benchmark: 8 blade counts × 5 culling setups, **40 configurations**, each warmed up for 0.5 s and measured for 5, into a CSV named after the CPU and GPU it ran on.',
      },
      {
        kind: 'table',
        head: ['Blades', 'No culling', 'Orientation', 'Frustum', 'Distance', 'All three'],
        rows: [
          ['8,192', '995.1', '903.2', '1,002.3', '1,442.4', '1,452.5'],
          ['16,384', '564.7', '566.5', '569.7', '1,290.3', '1,283.9'],
          ['32,768', '288.2', '304.2', '291.7', '962.0', '1,005.0'],
          ['65,536', '144.4', '157.8', '148.1', '494.7', '512.2'],
          ['131,072', '76.6', '86.2', '79.5', '266.1', '284.5'],
          ['262,144', '41.1', '44.4', '41.3', '149.1', '160.1'],
          ['524,288', '21.1', '22.6', '20.9', '76.2', '82.3'],
          ['1,048,576', '10.7', '11.6', '10.6', '42.7', '**46.2**'],
        ],
        caption: 'Average FPS on an RTX 5080 at 1920×1080, from a fixed overhead camera. With all three, a million blades run 4.31× faster.',
      },
      {
        kind: 'p',
        text: 'Distance culling does nearly all the work. From a fixed overhead camera few blades are edge-on or off-screen, so orientation and frustum culling cost about what they save; orientation culling even makes the smallest field 9% slower. Below about 32K blades the frame is bound by the CPU and the driver, and above about 262K, by compute.',
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
        text: "The home page opens in space. The planet is a single circle far larger than the screen, centred well below it, so only a shallow arc of its limb shows, the way something enormous looks from orbit. It's shaded as a sphere: continents and clouds from value-noise fbm on its surface, a wrapped terminator, and an atmospheric halo on the sunlit limb.",
      },
      {
        kind: 'p',
        text: "Scrolling plays the descent: the camera pans onto the planet and falls toward it, its altitude dropping geometrically, so the magnification multiplies at an even rate instead of lurching at the end. The clouds sit nearer the camera than the ground and magnify faster, a **parallax** that makes the zoom read as a fall, and they thin away as the camera drops through them. Noise octaves are added **fractionally** as the zoom doubles, so the coastlines keep their detail without popping, and the sea rises during the fall so the camera always comes down over open water.",
      },
      {
        kind: 'media',
        media: {src: 'og.jpg', width: 1200, height: 630, alt: 'The opening: the planet from orbit, under the name'},
        caption: 'The opening, out in space, where the descent starts.',
      },
      {kind: 'h', text: 'The comet'},
      {
        kind: 'p',
        text: "Out in space, a comet circles the cursor. It follows a **Kepler orbit**, solved from Kepler's equation every frame, so it speeds up close to the cursor and slows far from it, and the orbit itself turns a little each lap. The point it orbits follows the cursor on a critically damped spring. Its tail is a deformed icosphere that stretches and narrows with speed and bends with the path's curvature, clamped so a sudden jerk can't snap it into a hook.",
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
          'The renderer is plain TypeScript, and **React** draws the panels around it. The app steers the engine only through a few targets the frame loop eases toward, so nothing re-renders per frame; the engine answers through callbacks, and through two CSS variables it writes every frame, `--descent` and `--finale`, which fade the page in step with the camera',
          '**One step per scroll gesture.** A trackpad flick sends events for a second or more as its momentum dies away. A gesture ends after 240 ms of quiet and steps once it has moved 24 px; momentum only ever fades, so events that grow, twice running or in one large jump, are a fresh flick over the old one\'s tail; and a mouse wheel is recognised by the pause between its notches. A flick moves one project, not five',
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
        text: "A first-person VR ice-climbing game for Meta Quest 3, built by three of us in Unity 6.3 with URP, the XR Interaction Toolkit, OpenXR and the Meta XR SDK. You climb a frozen cliff with an ice pick in each hand: swing one into the ice, hold on, and pull yourself up before the ice cracks and shatters. I built the **ice-pick climbing system**, the game's signature mechanic, and the breaking ice.",
      },
      {kind: 'h', text: 'A real swing'},
      {
        kind: 'p',
        text: "A pick bites only when it's swung. `SwingDetector` sits on the pick's **tip**, not the controller, and measures its speed over a rolling **5-frame window**. The tip is on the end of a lever, so a flick of the wrist moves it much faster than the hand, and sampling the controller had missed wrist flicks. Above a tunable 1.5 m/s the pick embeds, with a thud and a haptic pulse.",
      },
      {kind: 'h', text: 'Climbing'},
      {
        kind: 'p',
        text: "An embedded pick is reparented to the world, so it stays put while the hand moves on, and goes back to the controller at its cached pose when released. `ClimbingLocomotion` moves the player: each frame it takes each anchored hand's controller movement and applies the opposite to the XR Origin, so pulling down lifts you. With both picks in, it averages the two.",
      },
      {
        kind: 'p',
        text: "After every move it samples the controllers again. Measured from before the origin moved, the next frame's movement would include the move itself and feed back as oscillation. While you climb off the ground, the rig's own movement (walking, turning, teleporting) is switched off.",
      },
      {kind: 'h', text: 'An event-driven core'},
      {
        kind: 'p',
        text: 'The pick core raises `OnEmbedded` and `OnReleased`, and the rest of the game hangs off those two events: ice destruction, checkpoints and the gadgets were all added without touching the pick code. Every tuning value is a `[SerializeField]`, so it can be tuned in the editor.',
      },
      {kind: 'h', text: 'Breaking ice'},
      {
        kind: 'p',
        text: "Ice is the clock. Once a pick is in, the block starts to crack: a crack decal spreads across it, animated through a sprite sheet, a warning crack sounds at 75% of its time, and then it shatters into physics debris. Unity's decal projectors didn't conform to the blocks' colliders, and screen-space decals broke up in stereo, so the cracks are tessellated quad meshes laid onto the collider's own surface, in world space. Rock never breaks; it's where you rest.",
      },
      {
        kind: 'p',
        text: "I also built falling and respawning, and the **drone**: grip it on your belt and you're lifted to an overview of the route, with a marker where you left off and a quick fade around the jump to spare motion sickness.",
      },
      {kind: 'h', text: 'Playtesting'},
      {
        kind: 'p',
        text: 'We ran an A/B session with another team. Each of three features got a variant that could be swapped from the inspector at runtime, and every tester played all six, in random order.',
      },
      {
        kind: 'table',
        head: ['Feature', 'A', 'B', 'Preferred'],
        rows: [
          ['Embedding', 'Only on a real swing', 'Whenever the tip is in ice', 'A, by 3 of 3'],
          ['Snow', 'Sparse', 'About twice as dense', 'B, by 3 of 3'],
          ['Crack to shatter', '6 s', '4 s', 'A, by 3 of 3'],
        ],
        caption: 'Without the swing gate, picks grabbed the wall at any brush of the hand; at 4 s the ice broke before testers had placed their next pick.',
      },
      {
        kind: 'p',
        text: "Their open feedback brought two more changes: embed and shatter sounds from a 3D source on each pick, so each hand's hits sound where they land, since a silent hit felt unfinished in VR; and an automatic swap from the grappling gun back to an ice pick on arrival, since testers fell before they could swap by hand. The findings also went into the tuned thresholds and a redesigned grip-and-release scheme.",
      },
      {kind: 'h', text: 'The rest of the climb'},
      {
        kind: 'list',
        items: [
          '**Rock and ice:** both take a pick, but only ice cracks, so rock ledges are the safe holds.',
          '**Falling rocks** drop from above the route with random size and spin; a hit sends you back to the last checkpoint, with a jolt in both hands.',
          '**A gadget belt** at the waist that follows your head, holding a grappling gun with a laser sight, green in range and red out of it, and the drone.',
          '**A climb timer**, and a restart on B that brings back the ice and resets the checkpoints, for another run at your time; confetti at the summit.',
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
    // Who did what is from the repo's doc/implementation_log.md: Cecilia the
    // force model and the maneuvering controller, Yiding the rest named here.
    blocks: [
      {
        kind: 'p',
        text: 'A Maya 2026 C++ plug-in that generates physically plausible butterfly flight, after Chen et al.\'s "A Practical Model for Realistic Butterfly Flight Simulation" (ACM Transactions on Graphics, 2022), so VFX artists can fill a scene with butterflies without keyframing them or knowing aerodynamics.',
      },
      {
        kind: 'p',
        text: 'Cecilia Chen and I built it. She wrote the force model and the maneuvering controller; I wrote the wing model, the simulation loop and the keyframe baking, path following, hover, and the cameras that frame from the viewport.',
      },
      {kind: 'h', text: 'The model'},
      {kind: 'p', text: 'The simulation follows the paper in three modules:'},
      {
        kind: 'list',
        ordered: true,
        items: [
          "**Wing kinematics.** Five angles drive a skeleton: thorax pitch; the forewings' flap, feather and sweep; the hindwings' flap; and the abdomen. Each follows `θ(t) = A(u)·cos(2π·f(u)·t + φp) + φm`, its frequency f and amplitude A sigmoids of the flight speed u, so a faster butterfly beats harder. They're held for a wingbeat and updated at its end, and the abdomen swings 180° out of phase, as a real Monarch's does.",
          "**Forces.** Each wing is a flat panel under quasi-steady aerodynamics (Ellington, 1984), with lift and drag of `½ρ|V|²A·C(α)` and the paper's empirical polynomials for the coefficients over the angle of attack. A curl-noise vortex force from Perlin noise acts on the thorax alone, and gives real flight its erratic wobble.",
          '**Maneuvering.** Velocity integrates the wing forces, the vortex force, gravity and a preferred acceleration toward a target. Between wingbeats, frequency and amplitude are smoothed over a sliding window of 10 cycles.',
        ],
      },
      {kind: 'h', text: 'Wings and baking'},
      {
        kind: 'p',
        text: "I wrote the wing model, with the paper's Monarch parameters for each of the five angles, and the step that maps them onto the rig: rotations on six joints, mirrored for the right side, written every frame as Maya animation curves along with the body's path. The result is ordinary keyframes. It scrubs on the timeline, renders without the plug-in, and exports to Alembic or FBX through Maya's own dialogs.",
      },
      {
        kind: 'p',
        text: "Wiring Cecilia's force and maneuvering modules into the loop, I applied each frame's angles before the force step, so the aerodynamics read the wings where they actually are. That also fixed animation that died after the first wingbeat: with the velocity never integrated, the speed sigmoids had collapsed every frequency and amplitude to nothing.",
      },
      {kind: 'h', text: 'Flying a path'},
      {
        kind: 'p',
        text: "The artist draws a NURBS curve, and the butterfly flies it. The first design steered at a velocity worked out from the curve's length, but the physics' speed clamp and slow velocity blend made every long curve fly at the same speed, and short ones end early. I replaced it with a **time-based cursor**: a target that slides along the curve at `remaining length / (frames × substeps) × speed scale`, which the butterfly chases on a spring while the aerodynamics keep their wobble. At a scale of 1 it reaches the end on the last frame, starting from the curve's beginning or from the point nearest the rig. Near the end it can decelerate, and blend the thorax into an exact pose to hand off to a hover.",
      },
      {kind: 'h', text: 'Hovering'},
      {
        kind: 'p',
        text: "At zero speed there's no lift, gravity pulls, and the vortex force pushes the butterfly off station. Rather than fight the physics with a controller, hover mode skips it: only the wing model runs, with floors on frequency and amplitude, 5 Hz and 40° of flap, so the wings keep beating. They ease down to the floors over about 3 s, which plays as the butterfly settling. Its position and full orientation can be set by hand.",
      },
      {kind: 'h', text: 'Cameras'},
      {
        kind: 'p',
        text: 'Framing a moving butterfly by hand is tedious, so the bake can make the camera too. The artist frames the shot in the viewport, and at simulate time the plug-in captures that camera and keeps its framing through the flight. I added that capture to the follow camera, and a **stationary camera** that stays where the viewport was and turns to hold the butterfly at the same place on screen: the offset `q₀ = camera · lookAt₀⁻¹` is kept, and applied as `q₀ · lookAtₜ` every frame. Its **auto zoom** keys the focal length as `f₀ · dₜ / d₀`, so the butterfly keeps its size as it comes near or flies off.',
      },
      {
        kind: 'gallery',
        items: [
          {
            media: {src: 'butterflight-follow.jpg', width: 1440, height: 810, alt: 'A blue butterfly flying low over grass past twisted roots'},
            label: 'Along a path, from the follow camera',
          },
          {
            media: {src: 'butterflight-stationary.jpg', width: 1600, height: 900, alt: 'A blue butterfly flying off over a meadow of red flowers, with others beyond'},
            label: 'Leaving the rose, from the stationary camera',
          },
        ],
        caption: 'Frames from the demo. No joint was keyed by hand: only the rig pose, the guide curves and the settings were set.',
      },
      {kind: 'h', text: 'Swarms and the panel'},
      {
        kind: 'p',
        text: 'Any mode can be a swarm: the rig is duplicated into many agents, the leader flies the chosen mode, and the rest flock with it by cohesion, separation and alignment, each running the whole pipeline with its own wingbeat phase and noise. It is all driven from a MEL panel with ten collapsible sections, which passes its settings to one C++ command, `bfSimulate`.',
      },
      {
        kind: 'media',
        media: {
          src: 'butterflight-maya.jpg',
          width: 1600,
          height: 850,
          alt: "Maya's viewport with ten butterflies along a guide curve, and the ButterFlight panel docked at the right",
        },
        caption: 'A swarm of ten on a guide curve in Maya 2026, with the ButterFlight panel.',
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
        text: 'A top-down puzzle game in Unreal Engine 5.7 where the player travels through the shadows cast by movable lights: shadow is solid ground, and lit void is a fall. Three of us built it for a game design practicum. It shipped for Windows and macOS with a tutorial and four levels, and I ported it to iOS on my own. I wrote **37 of its 59** gameplay source files, and 60% of the commits.',
      },
      {kind: 'h', text: 'A registry of lights'},
      {
        kind: 'p',
        text: '`UUmbraLightSubsystem` is a world subsystem that keeps a registry of every shadow-casting light and every shadow bridge in the level. Each registers itself on `BeginPlay` and leaves on `EndPlay`, held by `TWeakObjectPtr`, so a destroyed actor simply drops out with no dangling pointer, and a level needs no wiring by hand: place a lantern and it counts.',
      },
      {kind: 'h', text: 'In shadow or not'},
      {
        kind: 'p',
        text: "This is the test all the gameplay runs on. Every tick, the pawn traces a line toward each registered light that can reach it: inside its attenuation radius and, for a spotlight, inside its cone. The traces start from the pawn's **feet**, not its center, so the test agrees with the shadows drawn on the ground. A blocked trace means the pawn is in that light's shadow, and props tagged `NoShadow` are left out of the traces.",
      },
      {
        kind: 'p',
        text: 'Only changes of state matter. Stepping into shadow makes every shadow bridge solid, and stepping out makes them vanish; if you were standing on one, you shrink, glide back to the last solid ground and grow back, in 0.8 s. The same events drive falling, respawning and the HUD.',
      },
      {kind: 'h', text: 'The pieces'},
      {
        kind: 'list',
        items: [
          '**Lanterns**, dragged across the floor with the mouse, their height locked when you pick them up.',
          '**Lighthouses**, spotlights whose beams sweep back and forth between two angles and can slide along a rail, switched on by carrying a battery to their drop-off.',
          '**Pillars** that slide between stops set in the editor when you roll over a pressure plate, which can advance them, toggle them or fire just once.',
          '**Shadow bridges**: invisible floors over the void that hold only while you stand in shadow.',
        ],
      },
      {kind: 'h', text: 'Front end and iOS'},
      {
        kind: 'p',
        text: 'I built the whole UMG/Slate front end: the main menu, the in-game HUD, a pause screen over a blurred game, and the level-cleared and tutorial-complete screens. For the iOS port I wrote a custom **touch thumbstick** widget and a responsive mobile layout, routed through Enhanced Input.',
      },
      {kind: 'h', text: 'Process'},
      {
        kind: 'p',
        text: 'We worked from a design document to a fixed schedule of three milestones, prototype, beta and final, merging through pull-request review on one shared Unreal project.',
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
        text: "A third-person climbing platformer in Unreal Engine 5, in C++ and Blueprint, built on Epic's Stack-O-Bot starter. Disks rain down in a grid; shoot one and it freezes in mid-air, and the frozen ones are your way up to the target height.",
      },
      {
        kind: 'code',
        text: [
          'ADiskSpawner           the grid, freeze rules, win check, HUD',
          '  └ AFallingDisk ×N×M  Falling | FrozenRed | FrozenGreen',
          'UShootingComponent     aim, crosshair, hitscan, Niagara beam',
          'UPlayerHUDWidget       height, best, goal',
        ].join('\n'),
      },
      {kind: 'h', text: 'The grid'},
      {
        kind: 'p',
        text: "`ADiskSpawner`, placed once in a level, owns an N×M grid of `AFallingDisk`s above the player: 4×4 cells of 350 units, by default. Each cell always holds exactly one disk, falling at a random 150 to 500 units a second. When one reaches the ground or drifts 400 units below the player, it respawns 3,000 units above the player's current height.",
      },
      {
        kind: 'table',
        head: ['Disk state', 'Color', 'Meaning'],
        rows: [
          ['Falling', 'Default', 'Moving down at its own speed'],
          ['Frozen red', 'Red', 'The one frozen disk above the player'],
          ['Frozen green', 'Green', 'Frozen, at or below the player'],
        ],
      },
      {kind: 'h', text: 'Freeze rules'},
      {
        kind: 'list',
        items: [
          'Only one disk above you can be frozen at a time: shoot another, and the old red disk falls again at the speed it had.',
          'Any number of disks at or below you can be frozen green.',
          'Climb past a red disk and it turns green, freeing the slot above you.',
          'Drop below a green disk and it unfreezes at once.',
        ],
      },
      {kind: 'h', text: 'Shooting'},
      {
        kind: 'p',
        text: "`UShootingComponent` is a reusable actor component, decoupled from the character. Holding the right mouse button eases the spring arm's socket offset to an over-the-shoulder aim and shows a crosshair; the left button fires a **hitscan line trace from the camera** through the crosshair, so what you aim at is what you hit, whatever the character's pose. A Niagara beam draws the laser from the robot's chest to the hit point.",
      },
      {
        kind: 'p',
        text: "A falling disk that hits you in mid-air knocks you down and away from its center; frozen ones don't. The HUD shows your height, your best this session, and the target. Past 2,000 units a win screen appears, after a moment to land, with an infinite mode that turns the win check off and lets you keep climbing.",
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
    team: 'Team of 3',
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
        text: 'A voxel game engine in C++ and OpenGL with Qt, built by three of us: an infinite procedural world of 1M+ blocks that holds 60+ FPS while it generates.',
      },
      {kind: 'h', text: "What's in it"},
      {
        kind: 'list',
        items: [
          '**Terrain** from layered 2D and 3D Perlin noise, in five biomes (grassland, mountain, desert, islands and caves), each with its own mix of blocks and its own procedurally placed vegetation.',
          '**Chunks**, with frustum culling and level of detail. Faces between neighboring blocks are culled, which cuts draw calls by 80%.',
          '**Post-processing** in GLSL: underwater and lava distortion by warping the UV coordinates, and a crosshair overlay.',
          '**Physics** two ways: gravity and collision with the terrain on foot, and buoyancy in water and lava. A fly mode moves with six degrees of freedom.',
          "**Mining and placing** blocks by ray casting, with the chunk's mesh rebuilt at once, across 16 block types with their own textures and properties.",
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
