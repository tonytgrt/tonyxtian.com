# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tony Yiding Tian's portfolio (graphics engineer, UPenn), deployed at
tonyxtian.com. It is a single-page app built with Vite, React 19 and TypeScript
(strict mode). A WebGL 2 renderer draws the world behind it.

The layout is a GPU frame capture:
- **Top bar.** It shows the renderer's live frame time, pixel ratio and wave count.
- **Index.** The left panel, headed ADDR, lists every location, grouped into passes.
  - Each location has a hex address from `address()` in `src/ui/bits.tsx`. The intro and About are 0x00 and 0x01, each pass takes the next high digit (Apple 0x10, MatForge 0x20, Vulkan Grass 0x21), and Contact is 0xFF.
  - Addresses are worked out from the order of the entries, never written by hand. A pass holds at most 16.
- **Stage.** It shows one entry at a time over the ocean, with its counters.
- **Bottom bar.** It holds a timeline from 2024 to 2026, the night/day theme switch (`src/ui/DayNight.tsx`) and the email address.

Each scroll gesture, swipe or arrow key moves one entry. A case study opens
in a pane that fills everything to the right of the index (full screen on
phones), and it has its own address. Its article is centred and at most 980px
wide, with running text kept to 72ch.

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
      - `finale` runs 0→1: the camera looks up from the sea to the night horizon, as a spring like the glide.
      - `travel` is how far the camera has flown over the sea.
    - It also exposes `descent`, `finaleClear`, `onLanded`, `onFinaleClear` and `onStats`, and writes the `--descent` and `--finale` CSS variables every frame.
  - `Descent.ts` is the landing timeline. `Comet.ts` is the comet that circles the cursor while in space.
  - `shaders/background-frag.glsl` draws the planet, clouds, ocean, night sky and moon.
    - The ocean is adapted from afl_ext's MIT-licensed "Very fast procedural ocean". Its copyright and license notice must stay in that file.
  - `rendering/gl/` and `geometry/` hold the old CIS 566 base classes.
- `src/store.ts` holds the small app state (`index`, `open`, `landing`, `sheet`, `direction`, `stats`), read with `useStore(selector)`.
- `src/actions.ts` handles every change of state and is the only code that touches `engine.targets`:
  - Selecting and stepping.
  - Opening and closing a case study, with `pushState`.
  - `popstate`.
  - The descent: skip, and `replay`, which is what selecting the intro does.
  - Boot: deep links and old `#about` / `#experience` / `#projects` anchors.
- `src/input/` turns input into steps:
  - `wheel.ts` gives one step per wheel or trackpad gesture.
  - `bind.ts` handles wheel, keys and touch. During the descent, the wheel, keys and touch play the descent instead of stepping.
  - Test changes to `wheel.ts` against real trackpad momentum and mouse notches.
- `src/routing.ts`: `/` is home; `/about/` and `/<work id>/` open a case study.
- `src/ui/` holds the React components: `App`, `TopBar`, `IndexList`, `Stage`, `Timeline`, `BottomBar`, `CaseStudy`, `Intro`, `Sheet` and the shared `bits`.
- `src/styles/app.css` is the only stylesheet: plain CSS, with tokens on `:root`.
- `src/media/` holds images and video, imported through `src/media.ts`, so Vite gives them content-hashed names.
  - Only files directly in `src/media/` ship. `src/media/originals/` keeps full-size sources, such as the uncropped headshot behind the two portrait crops, and `src/media/drafts/` keeps drafts' images; the build leaves both out.
- `scripts/prerender.ts` runs after `vite build`:
  - It writes `dist/<route>/index.html` for every route, with its own title, description, canonical URL and share card.
  - It adds a plain-HTML fallback of the content for crawlers and no-JS visitors.
  - It writes `sitemap.xml` and fails the build if a named image is missing.
- `public/` is copied as is: the favicon and `robots.txt`.

## Landing and finale

- **Descent.** It plays by itself only on a first visit: never on a deep link, never with `prefers-reduced-motion`, and not again once `localStorage['tonyxtian.landed']` is set.
  - The wheel plays it over 2.4 screens of scrolling, and the panels fade in over its last stretch (`.app[data-landing='true']` in the CSS).
  - When the engine reports landing, `input.hold()` swallows the rest of that scroll gesture.
  - The descent stays dark the whole way, with no white-out.
- **Intro.** The first entry, `intro`, is the descent itself; there is no title card. Selecting it runs `replay()`, which lifts the camera back into space.
  - The Intro row in the index, the name in the top bar, and a step up from About (wheel, ↑ or a swipe) all select it. The rest of that scroll gesture is held, so it can't stall the rise.
  - Landing, or Skip, arrives at About (`FIRST_STOP`), which returning visitors also start on.
  - The intro puts nothing of its own on the stage. The stage draws `onStage`, not the selection, and is hidden while `landing`.
    - Going up, the last entry fades out with the site. Coming down, the panels fade in around an empty stage, and About enters once landed.
    - An entry's entrance direction is fixed when it mounts (`Entrance` in `Stage.tsx`). Changing the `animation-name` of a mounted element restarts the animation, which flashes the content.
  - Without WebGL there is no intro: the row is hidden, and About is the first stop.
- **Contact.** It is the last stop. Selecting it sets `targets.finale = 1`, and the camera pitches up to the horizon under the moon. The copyright line sits at the bottom of that stop and is the site's only footer.
  - **Motion.** The pitch is a critically damped spring (`FINALE_STIFFNESS`) that sets off with the glide over the sea, so the camera never pauses. It is about 90% of the way in 1.2 s.
  - **Night.** Night falls over the first 0.45 s (`NIGHT_SECONDS`). It must be complete before any sky comes into view, about 0.53–0.6 s in, or the day sky shows above the curved horizon. On the way back it holds until the sky is out of view (`NIGHT_HOLD`).
    - Retiming either one means checking that the sky still comes into view only after night is complete. The view is ±34° vertically (focal length 1.5).
  - **Card.** The Contact card and copyright fade with the camera through the `--finale` CSS variable.
  - **Leaving Contact.** The stage keeps Contact while its card sinks away. The next entry comes on only once the camera is nearly down: `engine.onFinaleClear` → `finaleCleared()`, through `stageFor()` in `actions.ts`.
- **Stage backgrounds.** Panels over the canvas are translucent glass and the stage itself is transparent, so the ocean stays visible.

## Content

All text lives in typed files:
- `src/content/site.ts` holds names, links, About (bio, skills and the portrait), Contact and the pass names.
  - The About stage is headed by the name, with the portrait framed beside it like the work's pictures.
  - It uses two crops of the headshot through a `<picture>`, so each screen downloads only its own: 4:3 on desktop (`portrait-wide.jpg`, `about.portrait`), and a 4:5 thumbnail beside the name on phones (`portrait.jpg`, `about.portraitPhone`).
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

- **Two themes.** Dark ("night") is the site's own and the default. Light ("day") is set by `data-theme="light"` on `<html>`.
  - `actions.ts` sets the theme (`setTheme` / `toggleTheme`) and keeps it in `localStorage['tonyxtian.theme']`. An inline script in `index.html` applies the stored theme before the first paint.
- **Palette.** Colours are CSS custom properties on `:root` in `app.css`, with light-theme values under `:root[data-theme='light']`.
  - There are tokens for panels, bars, lines, fills, frames, shadows and text, plus the pass colours (`--sun`, `--accent`, `--teal`), set through `[data-pass]`. Use those rather than new hard-coded colours.
  - The tokens are registered with `@property` so a theme switch fades them, timed to the middle of the sea's change (`--theme-time`, `--theme-delay`).
  - The intro, out in space, pins the dark ones.
- **Frost.** In the light theme the stage sits on one frosted panel (`.stage::before`), since dark type on the bright sea alone doesn't read.
  - The panel is inset from the stage by the gutter, which is exactly where the case study pane goes. So it lines up with the index panel and the bars by construction, with the stage's 36px padding keeping the content 22px inside it.
  - Don't give the stage's parts frosts of their own: separately sized panels never line up.
  - **Contact.** It hides the panel (`--panel: 0`) so the day sky stays clear, and frosts only its own card and the copyright.
  - **Fading.** The frost fades with `--frost` and `--panel`, so the layout never moves when the theme switches.
  - **Phones.** They keep their own glass cards instead.
- **Sea and sky.** The engine's `targets.day` (0 night, 1 day) eases over 1.8 s (`DAY_SECONDS`), or at once with reduced motion, into `u_Day`.
  - **The wheel.** In the shader the sun and moon ride opposite ends of one wheel of sky turning about the view's forward axis (`wheel`). Night has the moon at `MOON_DIR`. Day turns it half round clockwise, which sets the moon, brings the sun up on the left, over the top, and down into the moon's place.
  - **The switch icon.** It is the same wheel in miniature, turning with the same timing.
  - **By day.** The sea is brighter (`DAY_EXPOSURE`, `DAY_SCATTER`, `DAY_SHEEN`), and Contact shows the day sky with clouds and the sun's disc (`sunFace`) in place of the night.
  - **Dark theme.** Every day term is zero at `u_Day = 0`, so the dark theme renders exactly as it did before there was a light one.
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
