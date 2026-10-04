# Koichi's portfolio

## Dopamine works pack

The works collection in dopamine mode opens as a foil card pack. Drag or swipe
its top seam in either direction, or use the keyboard-accessible open button.
Short or canceled swipes reset the seam. Escape closes an open work detail and
returns to the collection; in all other pack phases, it exits dopamine mode and
returns to the normal works page.
Every pack contains all works in the existing order; SSR is a visual treatment,
not a randomized reward. Normal works pages and the other dopamine experiences
are unchanged.

### Local verification

```sh
yarn install --frozen-lockfile
yarn test:review
yarn dev
# In a second terminal, with Chromium available:
CHROMIUM_PATH=/usr/bin/chromium node scripts/test-pack-opening.cjs
```

The browser test covers mouse and touch opening, incomplete/canceled gestures,
card navigation, collection links, replay, keyboard cancellation, timer cleanup,
turning dopamine mode off, mobile overflow, and reduced motion. It activates the
existing hidden mode through six rapid clicks on the home logo. Override
`PACK_BASE_URL` for a different local server and `PACK_SCREENSHOTS` for the QA
image directory (default: `/tmp/portfolio-pack-qa`).

`yarn test:review` runs browser-free React regression tests for changing mute
during the timeline's rewind hold, canceling that hold, disabled timeline nodes
during playback/replay, and removing/restoring the layout navigation around the
full-screen FAQ, profile, and timeline. It mocks motion and audio boundaries;
the Playwright scripts remain necessary for visual and keyboard-browser QA.
