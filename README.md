# Koichi's portfolio

## Dopamine works pack

The works collection in dopamine mode opens as a foil card pack. Drag or swipe
its top seam in either direction, or use the keyboard-accessible open button.
Short or canceled swipes reset the seam. Escape returns to the sealed pack.
Every pack contains all works in the existing order; SSR is a visual treatment,
not a randomized reward. Normal works pages and the other dopamine experiences
are unchanged.

### Local verification

```sh
yarn install --frozen-lockfile
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
