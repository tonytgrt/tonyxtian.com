import type {Media, Pass} from './types';

export const site = {
  name: 'Tony Yiding Tian',
  shortName: 'Tony Tian',
  url: 'https://tonyxtian.com',
  title: 'Tony Yiding Tian · Graphics Engineer',
  description:
    'Tony Yiding Tian is a graphics engineer at the University of Pennsylvania working on GPU ' +
    'programming, real-time rendering and graphics systems: path tracers in CUDA and Vulkan, ' +
    'real-time renderers in WebGPU and Vulkan, animation tools and games.',
  subtitle: 'Computer Graphics & Computer Engineering @ UPenn',
  // Every "Contact" on the site is this address; there is no form.
  email: 'tonytg@engineering.upenn.edu',
  resume: 'https://raw.githubusercontent.com/tonytgrt/TonyTianResume/master/resume_cg.pdf',
  github: 'https://github.com/tonytgrt',
  linkedin: 'https://linkedin.com/in/ytian1109',
  copyright: '© Copyright 2026.',
  copyrightName: 'Yiding Tian',
};

// In the order the index lists them.
export const passes: Pass[] = [
  {id: 'production', name: 'Production'},
  {id: 'rendering', name: 'Rendering & GPU'},
  {id: 'interactive', name: 'Animation, games & XR'},
  {id: 'systems', name: 'Systems & embedded'},
];

export const about = {
  tagline: 'Graphics engineer working across GPU rendering, real-time graphics, and the tools and games built on them.',
  // The headshot, shown round: a square crop of the full-size original in
  // src/media/originals/, its whole height, centred on the face.
  portrait: {
    src: 'portrait.jpg',
    width: 1600,
    height: 1600,
    alt: 'Tony Yiding Tian on a city street at night, in a Penn Engineering T-shirt',
  } satisfies Media,
  bio: [
    "I'm **Tony**, a fourth year undergraduate student at the **University of Pennsylvania**, pursuing a Bachelor's in **Computer Engineering** and an accelerated Master's in **Computer Graphics and Game Technology**, both expected in May 2027. I specialize in **GPU programming**, **real-time rendering**, and **graphics systems**.",
    'This summer I was a **UI Rendering GPU Software Engineer Intern at Apple**, working on developer tooling for Core Animation and fixing system UI rendering bugs through the iOS and macOS 27 betas.',
    "I'm seeking **2027 new grad full-time positions** in computer graphics, rendering engineering, and GPU software. My work spans **path tracers** in CUDA and Vulkan built on recent SIGGRAPH research, **real-time renderers** in WebGPU and Vulkan, **animation tooling** in Maya, and **games** in Unreal Engine and Unity.",
    'Feel free to **contact** me for opportunities or collaboration!',
  ],
  skills: [
    {
      group: 'Programming',
      items: ['C++', 'Objective-C', 'CUDA', 'MSL', 'GLSL', 'WGSL', 'Slang', 'SwiftUI', 'TypeScript', 'C#', 'Python', 'Bash'],
    },
    {
      group: 'Graphics & Rendering',
      items: ['Core Animation', 'UI Compositing', 'GPU Profiling', 'Path Tracing', 'Deferred Rendering', 'PBR'],
    },
    {
      group: 'Tools & APIs',
      items: ['Metal', 'Vulkan', 'WebGPU', 'OpenGL', 'Nvidia Nsight', 'Xcode', 'Unreal Engine', 'Unity', 'Maya', 'Claude Code'],
    },
  ],
};

export const contact = {
  title: 'Get in touch',
  text: "I'm looking for 2027 new grad roles in computer graphics, rendering engineering and GPU software, and happy to talk about any of the work here.",
};
