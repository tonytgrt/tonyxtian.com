# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tony Yiding Tian's portfolio (graphics engineer, UPenn), deployed at
tonyxtian.com. It is a single-page app built with Vite, React 19 and TypeScript
(strict mode). A WebGL 2 renderer draws the world behind it.

The layout is a GPU frame capture:
- **Top bar.** It shows the renderer's live frame time, pixel ratio and wave count.
- **Index.** The left panel is an event list of every stop, grouped into passes.
- **Stage.** It shows one entry at a time over the ocean, with its counters.
- **Bottom bar.** It holds a timeline from 2024 to 2026, "Replay descent" and the email address.

Each scroll gesture, swipe or arrow key moves one entry. A case study opens
in a pane docked on the right, full screen on phones, and it has its own
address.

## Commands

```bash
npm run dev        # dev server on http://localhost:5174 (5173 is taken: nginx
                   # proxies /webgpu_renderer to a dev server there)
npm run typecheck  # the app, then the Node-side files (vite.config.ts, scripts/, src/content/)
npm run build      # typecheck, vite build, then tsx scripts/prerender.ts
npm run preview    # serve dist/ on 5175
./deploy.sh        # on the server: pull, npm install, build, rsync dist/ to /var/www/tonyxtian.com
```

## Structure

- `src/main.tsx` boots the engine, the input handlers and React.
- `src/engine/` holds the WebGL world, in plain TypeScript and GLSL (no React):
  - `engine.ts` exports `createEngine(canvas)`. It returns `null` without WebGL 2, and the page then keeps its CSS gradient.
    - The app steers the engine only through `engine.targets`, and the frame loop eases toward them:
      - `descent` runs 0→1.
      - `finale` runs 0→2: night falls, then the camera looks up.
      - `travel` is how far the camera has flown over the sea.
    - It also exposes `descent`, `onLanded` and `onStats`, and writes the `--descent` CSS variable every frame.
  - `Descent.ts` is the landing timeline. `Comet.ts` is the comet that circles the cursor while in space.
  - `shaders/background-frag.glsl` draws the planet, clouds, ocean, night sky and moon.
    - The ocean is adapted from afl_ext's MIT-licensed "Very fast procedural ocean". Its copyright and license notice must stay in that file.
  - `rendering/gl/` and `geometry/` hold the old CIS 566 base classes.
- `src/store.ts` holds the small app state (`index`, `open`, `landing`, `sheet`, `direction`, `stats`), read with `useStore(selector)`.
- `src/actions.ts` handles every change of state and is the only code that touches `engine.targets`:
  - Selecting and stepping.
  - Opening and closing a case study, with `pushState`.
  - `popstate`.
  - The descent: skip and replay.
  - Boot: deep links and old `#about` / `#experience` / `#projects` anchors.
- `src/input/` turns input into steps:
  - `wheel.ts` gives one step per wheel or trackpad gesture.
  - `bind.ts` handles wheel, keys and touch. During the descent, the wheel, keys and touch play the descent instead of stepping.
  - Test changes to `wheel.ts` against real trackpad momentum and mouse notches.
- `src/routing.ts`: `/` is home; `/about/` and `/<work id>/` open a case study.
- `src/ui/` holds the React components: `App`, `TopBar`, `IndexList`, `Stage`, `Timeline`, `BottomBar`, `CaseStudy`, `Intro`, `Sheet` and the shared `bits`.
- `src/styles/app.css` is the only stylesheet: plain CSS, with tokens on `:root`.
- `src/media/` holds images and video, imported through `src/media.ts`, so Vite gives them content-hashed names.
- `scripts/prerender.ts` runs after `vite build`:
  - It writes `dist/<route>/index.html` for every route, with its own title, description, canonical URL and share card.
  - It adds a plain-HTML fallback of the content for crawlers and no-JS visitors.
  - It writes `sitemap.xml` and fails the build if a named image is missing.
- `public/` is copied as is: the favicon and `robots.txt`.

## Landing and finale

- **Descent.** It plays only on a first visit: never on a deep link, never with `prefers-reduced-motion`, and not again once `localStorage['tonyxtian.landed']` is set.
  - The wheel plays it over 2.4 screens of scrolling, and the panels fade in over its last stretch (`.app[data-landing='true']` in the CSS).
  - When the engine reports landing, `input.hold()` swallows the rest of that scroll gesture.
  - The descent stays dark the whole way, with no white-out.
- **Contact.** It is the last stop. Selecting it sets `targets.finale = 2`: night falls, then the camera pitches up to the horizon under the moon. The copyright line sits at the bottom of that stop and is the site's only footer.
- **Stage backgrounds.** Panels over the canvas are translucent glass and the stage itself is transparent, so the ocean stays visible.

## Content

All text lives in typed files:
- `src/content/site.ts` holds names, links, the title card, About (bio and skills), Contact and the pass names.
- `src/content/entries.ts` holds the work, plus the ordered list of stops.

Draw content from the resumes in `/home/ubuntu/TonyTianResume`. `resume_cg.tex` is the one used for new grad applications.

### Adding a project
1. Add a `WorkEntry` to `work` in `src/content/entries.ts`. Put it in its pass, newest first within the pass:
   - Production: Apple.
   - Rendering & GPU.
   - Animation, games & XR.
   - Systems & embedded, which is hidden while it has no published entries.
2. Fill in its fields:
   - `id`: also the route.
   - `metric`: the index column.
   - `tagline`: one line.
   - `dates`: as shown.
   - `span`: first and last month, for the timeline.
   - `stack`.
   - `counters`: measured results, two or three. Use real numbers from the resume, never adjectives.
   - `links`: the first one becomes the stage's second button.
   - `blocks`: the case study, with `**bold**` allowed.
3. Put the image in `src/media/`, resized to about 1600px wide (the originals are often 4–15 MB), and give its real `width`/`height` in `hero`.
   - For a clip, add a `video` (WebM) alongside a poster JPEG.
   - Work without a picture is set as type alone, like Apple.
4. Set `draft: true` to keep an entry out of the site. Drafts' images go in `src/media/drafts/`, which the build doesn't ship.
5. Don't mention the Metal Liquid Glass Renderer anywhere on the site.

## Theme

- **Palette.** The site is dark, its palette taken from the ocean. Colours are CSS custom properties on `:root` in `app.css`: `--bg`, `--glass`, `--fg`, `--muted`, `--dim`, `--accent`, `--primary`, and the pass colours `--sun`, `--accent` and `--teal`, set through `[data-pass]`. Use those rather than new hard-coded colours.
- **Fonts.** Archivo is used with its width axis (`font-stretch`), and JetBrains Mono for the capture-tool labels and numbers.

## Contact

There is no contact form. Every "Contact" on the site is `mailto:tonytg@engineering.upenn.edu` (`site.email`).

## Deployment and caching

- Nginx serves `/var/www/tonyxtian.com` with `try_files $uri $uri/ =404`, so `/matforge/` is `dist/matforge/index.html`.
- `deploy.sh` syncs only `dist/` there, with `--delete`.
- The site sits behind Cloudflare, which caches JS, CSS and images for hours and leaves the HTML uncached. Vite's content-hashed file names keep caching correct with no manual version stamps. Don't add `?v=` query strings.
- The resume is hosted on GitHub at `https://raw.githubusercontent.com/tonytgrt/TonyTianResume/master/resume_cg.pdf` (`site.resume`).

## Testing

Headless Chromium can render the site with SwiftShader (`--use-angle=swiftshader --enable-unsafe-swiftshader`). It runs at roughly one frame a second there, so wait long enough for the finale. Input timings are unrealistic under it: test wheel gesture logic with WebGL off (`--disable-3d-apis`) or directly against `WheelSteps`.
