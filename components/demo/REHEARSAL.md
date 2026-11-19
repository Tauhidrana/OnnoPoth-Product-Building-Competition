# BuildDayDemo — rehearsal notes

**Gold copied:** `loading` (skeleton → content in the content's own geometry) for the page, `ruled-bento` for the terminal lines; framing from `hero-demo` (corner bleed beside copy).

**What it shows:** build day's last hour. `vercel --prod` is typed, the build runs, Ready prints the live URL, the student's Bangla price tracker resolves row by row and holds; `clear` resets the loop.

**Sizes:** wide 600×440 (browser corner-bled, terminal straddling its left edge over the page sidebar, 28px gutter). Compact 358×356 below 560px: the browser alone, with the address-bar icon (spinner → lock) carrying the load, since a straddling terminal doesn't fit at phone width.

**Gate:** `film.mjs --gate` passes at 1280 and 390.

**Known, not fixed:**
- One `settle snap` of 1px on a skeleton bar in wide: the Bangla webfont swapping in under the first frames.
- At 390 the kit reports jumps/vanishes at 0.12s: the stage server-renders wide, then switches to compact on mount. It happens under the hero's fade-in, before anything is visible.
- `kit override` lines appear only if the whole kit is imported (Next merges kit CSS into one chunk, so the checker can't tell kit rules from page rules). The demo imports parts one by one to avoid that.

**Not checked:** dark mode (the site is light only), Safari/Firefox playback.
