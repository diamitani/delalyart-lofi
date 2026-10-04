# Delaly Art Lofi

An endless, cozy stream of Delaly artworks set to looping lofi hip hop — built as
Patrick's discovery/growth surface. SEO-tagged for **art lofi, lofi hip hop, focus
music, study music**, and related terms.

- **The Stream** (`/`) — every artwork in one infinite scroll, with a sticky music player
- **Exhibit streams** (`/beach/`, `/nocturne/`, `/city/`, `/shore/`) — the same vibe, one collection at a time
- **The Wall** (`/all/`) — all artworks in a dense grid; tap a tile to jump to it in the stream
- **About** (`/about/`) — what this is, plus links to the print shop and Instagram

No build dependencies — the generator is pure Node.js (`node scripts/build.js`).

## Quickstart

```bash
node scripts/build.js          # build into dist/
node scripts/serve.js 8080     # preview at http://localhost:8080/
node scripts/check-links.js    # verify zero dead links
```

## When the catalog grows

The builder reads the shop catalog **at build time** from
`../delalyart-shop/data/catalog.json` (read-only — never edited by this project).
When new artworks are added to the shop:

```bash
node scripts/build.js && node scripts/check-links.js
```

New pieces automatically appear in the stream, their exhibit page, and The Wall.
(`dist/` is git-ignored; any static host rebuilds it.)

## Adding more tracks

1. Drop audio files into `public/audio/` — provide **mp3 + ogg** for broad browser
   support (wav works as a fallback). Example encode from wav:
   ```bash
   ffmpeg -i track.wav -codec:a libmp3lame -b:a 128k track.mp3
   ffmpeg -i track.wav -codec:a libvorbis -q:a 4 track.ogg
   ```
2. Add an entry to `data/tracks.json`:
   ```json
   {"id": "my-track", "title": "My Track", "artist": "Delaly",
    "files": {"mp3": "/audio/my-track.mp3", "ogg": "/audio/my-track.ogg"}}
   ```
3. Rebuild. The player plays tracks in order and loops the list forever.

## How the player works

- Browsers block autoplay *with sound*, so the first visit shows a full-screen
  **"Tap to start the vibe"** overlay — one tap starts the music.
- A fixed bottom bar on every page: play/pause, track title, volume slider, loop badge.
- Play state, volume, track index, and position persist in `localStorage`, so the
  music **resumes from the same spot** when navigating between pages. If the
  browser blocks silent resume, the overlay reappears with "Tap to resume the vibe".

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages, S3+CloudFront).
Publish directory: `dist/`. Build command: `node scripts/build.js`.
Audio + images are plain static files — no server code needed.

The canonical domain placeholder is `https://lofi.delalyart.shop` (see
`SITE_URL` in `scripts/templates.js`); update it when the real domain is live,
then rebuild so canonical URLs, sitemap, and JSON-LD all agree.

## File map

| Path | Purpose |
|---|---|
| `scripts/build.js` | Static generator (reads shop catalog + tracks, emits `dist/`) |
| `scripts/templates.js` | HTML helpers, SEO tags, JSON-LD, `SITE_URL` |
| `scripts/check-links.js` | Dead-link + missing-asset checker |
| `scripts/serve.js` | Local preview server |
| `src/assets/css/style.css` | Dark lofi theme |
| `src/assets/js/player.js` | Overlay + persistent audio player |
| `data/tracks.json` | Track list (edit to add music) |
| `public/art/` | Artwork images (copied from the shop build) |
| `public/audio/` | Lofi audio files |
