# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website for Tony Yiding Tian (Computer Graphics Engineer) built using the Dopefolio template. The site is a multi-page, static HTML/CSS/JavaScript portfolio showcasing graphics projects, deployed to a custom Nginx server.

## Development Commands

### SASS Compilation
```bash
# Watch and compile SASS files (use this during development)
npm run compile:scss

# Production build: compress CSS, build the hero background
# (fireball/ -> js/fireball.js), then cache-bust every asset reference
npm run build
```

The `compile:scss` command watches `sass/main.scss` and outputs to `css/style.css`. Keep this running while editing styles.

### Deployment
```bash
# Full deployment pipeline (git pull, build, sync to web root, restart nginx)
./deploy.sh
```

This script is configured for deployment to `/var/www/tonyxtian.com` on the production server.

## Project Structure

### Pages
- `index.html` - Main homepage: hero (the landing), about, experience, projects, and the finale
- `project-{1,2,3}.html` - Individual project case study pages (identical structure, different content)

### Styling Architecture
SASS files are organized in `sass/` using a modular structure:
- `abstracts/` - Variables (`_variables.scss` contains `$themeClrPrimary` for theme color), mixins, utilities
- `base/` - Base styles and resets
- `components/` - Reusable components (header, footer, skills, mouse-scroll)
- `pages/` - Page-specific styles (home, project case studies)
- `main.scss` - Main entry point that imports all partials

**Theme**: the site is dark, its palette taken from the ocean the home page lands on. All of it is in the `$themeClr*` variables in `sass/abstracts/_variables.scss`; use those rather than new hard-coded colours. The hamburger icons in `assets/svg/` carry their own stroke colour.

### JavaScript
`index.js` contains vanilla JavaScript for:
- Mobile hamburger menu toggle functionality
- Header logo click navigation
- No frameworks or libraries used

`fireball/` is the hero's WebGL background (a copy of the 566-hw1 fireball
project, TypeScript + GLSL): a procedural planet with a comet circling the mouse
cursor. Vite builds it into `js/fireball.js` (`npm run build:fireball`, or
`npm run watch:fireball` while working on it).

The canvas is fixed behind the whole home page (`.backdrop`). The hero is a
tall scroll track in front of it; scrolling through it plays a landing: the
camera pans to the planet, falls through the clouds as they thin away and
comes down over the ocean, which stays as the background to all the content
below. It stays dark the whole way: there is no white-out. The
ocean is adapted from afl_ext's MIT-licensed "Very fast procedural ocean"
shader; its copyright and license notice in `background-frag.glsl` must stay
with it. The
timeline is in `fireball/src/Descent.ts`, and the track's length
(`$heroTravel`) and how far About overlaps its end (`$heroOverlap`) are in
`sass/pages/_home.scss`. Sections over the canvas must stay transparent; the
hero paints its space colour only until the `webgl` class is set, which
`main.ts` does once the first frame is drawn. The header and the social links are hidden
until the landing ends: `index.js` adds `landed` to the body.

The home page has no footer beyond a copyright line. It ends in `.finale`,
another tall track: night falls while the last content scrolls away (so the
sky is fully night before any of it is in view), then scrolling on pitches
the camera up from the sea to the horizon, and the copyright sits at its very
bottom. Its length is `$finaleTravel` in
`sass/pages/_home.scss`. The project pages keep the old `.main-footer`.

### Cache busting
The site sits behind Cloudflare, which caches CSS, JS and images for hours.
Every local asset reference in the pages (and every `url()` in the CSS) carries
`?v=<hash of the file>`, which `scripts/stamp-assets.mjs` rewrites as the last
step of `npm run build`. Never edit these stamps by hand; add new references
without one and the build fills it in.

## Key Implementation Details

### Adding New Projects
Projects in `index.html` are in two groups, each headed by a `.projects__group-title`:
"Rendering & GPU" first, then "Animation, Games & XR", newest first within each.
Content is drawn from the resumes in `/home/ubuntu/TonyTianResume` (`resume_cg.tex`
is the one used for new grad applications).

1. Add a `.projects__row` in the right group. Under the title, a
   `.projects__row-content-meta` line gives tech, dates, and team size; then a
   one-paragraph description and a short `<ul>` of highlights
2. Put its buttons in `.projects__row-content-links`: the main link as
   `btn--theme`, a second (usually the GitHub repo) as `btn--theme-inv`
3. Add the image to `assets/jpeg/` resized to about 1600px wide (the originals
   are often 4-15 MB). A project with no image yet can use the
   `.projects__row-img-cont--card` title card in its place (see `_home.scss`)
4. Don't mention the Metal Liquid Glass Renderer anywhere on the site

### Image Assets
- Profile/header images: `assets/jpeg/` or `assets/png/`
- Icons: `assets/png/` (social media icons)
- SVG: `assets/svg/` (hamburger menu icons)
- Project mockups should be optimized and cropped to minimize file size

### Contact
There is no contact section or form. Every "Contact" link, in the header menus
of all pages and the About section's button, is
`mailto:tonytg@engineering.upenn.edu`.

## Deployment Notes

The site is configured for deployment to a custom server:
- Web root: `/var/www/tonyxtian.com`
- Web server: Nginx
- The deployment script handles git pull, npm build, file sync, and server restart
- Assets are served directly from the web root. `npm run build` does rewrite the
  pages' `?v=` stamps, so commit the HTML it changes along with the assets

## Resume Link

The resume is hosted externally on GitHub at `https://raw.githubusercontent.com/tonytgrt/TonyTianResume/master/resume_cg.pdf`. Update this link in both desktop and mobile menu sections if the resume location changes.
