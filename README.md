# tonyxtian.com

Tony Yiding Tian's portfolio, live at [tonyxtian.com](https://tonyxtian.com).

The site reads like a GPU frame capture of the work: an index of every
project grouped into passes, a stage that shows one at a time with its
measured results, and a timeline from 2024 to 2026. It all sits over a live
WebGL ocean. A first visit opens in space and descends through the clouds to
that ocean; the last stop, Contact, looks up from the sea to a night sky.

- Scroll, swipe or use the arrow keys to step through the projects, one per gesture.
- Enter or "Open case study" opens a project's page, which has its own address (`/matforge/`).
- Esc closes it. Intro, at the top of the index, or scrolling up from About goes back up to space for the descent again.
- The switch in the bottom bar turns night to day: the sky wheels round, the moon setting as the sun comes up, and the site goes light.

## Stack

Vite, React 19 and TypeScript (strict). The renderer in `src/engine/` is plain
TypeScript and GLSL on WebGL 2, and it grew out of a CIS 566 fireball
project. React draws the panels around it, and the two only meet in
`src/actions.ts`.

## Working on it

```bash
npm install
npm run dev        # http://localhost:5174
npm run build      # typecheck, build, and prerender every route into dist/
npm run preview    # serve dist/
./deploy.sh        # on the server: pull, build, sync dist/ to the web root
```

Content lives in `src/content/` as typed data, and images live in `src/media/`.

## Credits

The ocean is adapted from afl_ext's "Very fast procedural ocean" (MIT). Its
copyright and permission notice are in `src/engine/shaders/background-frag.glsl`.

`LICENSE` is the GPL-3.0 file from the Dopefolio template this repository
was first forked from.
