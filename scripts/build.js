/* Delaly Art Lofi static site builder. Pure Node.js, zero dependencies.
 * Usage: node scripts/build.js
 * Reads the SHOP catalog at ../delalyart-shop/data/catalog.json (read-only) plus
 * local data/tracks.json, and emits the lofi stream site into dist/.
 * When the shop catalog grows, just rebuild: new artworks flow in automatically.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SHOP_ROOT = path.join(ROOT, '..', 'delalyart-shop');
const T = require('./templates');

const catalog = JSON.parse(fs.readFileSync(path.join(SHOP_ROOT, 'data/catalog.json'), 'utf8'));
const tracksData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/tracks.json'), 'utf8'));
const tracks = tracksData.tracks;

function exhibitById(id) {
  return catalog.exhibits.find(function (e) { return e.id === id; });
}
function worksOf(exhibitId) {
  return catalog.artworks.filter(function (a) { return a.exhibitId === exhibitId; });
}
function exhibitTitle(id) {
  var e = exhibitById(id);
  return e ? e.title : id;
}

function write(relPath, html) {
  const full = path.join(DIST, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, 'utf8');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const s = path.join(src, f), d = path.join(dest, f);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

/* ---------- shared chrome ---------- */

function tracksScript() {
  return '<script>window.LOFI_TRACKS=' +
    JSON.stringify(tracks).replace(/</g, '\\u003c') + ';</script>';
}

function overlayHtml() {
  return '' +
    '<div class="vibe-overlay" id="vibe-overlay">' +
      '<div class="vibe-overlay-inner">' +
        '<div class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>' +
        '<h1>Tap to start the vibe</h1>' +
        '<p>Art scrolls. Lofi plays. Made for focus and study.</p>' +
        '<button class="vibe-start" id="vibe-start">Start the vibe</button>' +
      '</div>' +
    '</div>';
}

function playerHtml() {
  return '' +
    '<div class="player-bar" id="player-bar">' +
      '<div class="player-inner">' +
        '<button class="play-btn" id="play-btn" aria-label="Play or pause">' +
          '<svg id="icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
          '<svg id="icon-pause" viewBox="0 0 24 24" aria-hidden="true" style="display:none"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>' +
        '</button>' +
        '<div class="eq-mini" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '<div class="track-info">' +
          '<div class="track-title" id="track-title">Loading…</div>' +
          '<div class="track-sub" id="track-sub"></div>' +
        '</div>' +
        '<div class="vol-wrap"><label for="vol">VOL</label>' +
        '<input type="range" class="vol" id="vol" min="0" max="100" value="80" aria-label="Volume"></div>' +
        '<span class="loop-badge" title="The vibe loops forever">LOOP</span>' +
      '</div>' +
    '</div>' +
    '<audio id="lofi-audio" preload="auto"></audio>' +
    tracksScript() +
    '<script src="/assets/js/player.js"></script>';
}

function infiniteScrollScript() {
  return '' +
    '<script>(function(){' +
      'var cards=document.querySelectorAll("[data-deferred]");' +
      'var i=0;' +
      'function revealUpTo(id){' +
        'for(var k=0;k<cards.length;k++){cards[k].style.display="";if(cards[k].id===id){i=k+1;break;}}' +
      '}' +
      'var hash=(location.hash||"").slice(1);' +
      'if(hash){var t=document.getElementById(hash);if(t&&t.hasAttribute("data-deferred")){revealUpTo(hash);}}' +
      'if(!("IntersectionObserver" in window)){for(var j=i;j<cards.length;j++){cards[j].style.display="";}return;}' +
      'var sentinel=document.getElementById("scroll-sentinel");' +
      'if(!sentinel)return;' +
      'var io=new IntersectionObserver(function(entries){' +
        'if(entries[0].isIntersecting){' +
          'for(var n=0;n<8&&i<cards.length;n++,i++){cards[i].style.display="";}' +
          'if(i>=cards.length){io.disconnect();}' +
        '}' +
      '},{rootMargin:"1200px"});' +
      'io.observe(sentinel);' +
    '})();</script>';
}

function page(o) {
  // o: {headOpts, active, bodyHtml, streamJs}
  return '<!DOCTYPE html>\n<html lang="en">\n' +
    T.head(o.headOpts) +
    '\n<body>\n' +
    overlayHtml() + '\n' +
    T.header(o.active) + '\n' +
    '<main>\n' + o.bodyHtml + '\n</main>\n' +
    T.footer() + '\n' +
    playerHtml() + '\n' +
    (o.streamJs ? infiniteScrollScript() + '\n' : '') +
    '</body>\n</html>\n';
}

var TAG_ROW = '<div class="tag-row" aria-label="Topics">' +
  ['art lofi', 'lofi art', 'lofi hip hop', 'focus music', 'study music',
   'chill study beats', 'relaxing art', 'art for studying', 'deep focus',
   'cozy art stream'].map(function (t) { return '<span>' + t + '</span>'; }).join('') +
  '</div>';

/* ---------- pages ---------- */

function streamSection(artworks) {
  var cards = artworks.map(function (a, i) {
    return T.streamCard(a, exhibitTitle(a.exhibitId), i);
  }).join('\n');
  return '<div class="stream">\n' + cards +
    '\n<div id="scroll-sentinel"></div>' +
    '\n<div class="stream-end"><p class="loop-note">You reached the end of the stream — the vibe keeps looping below.</p>' +
    '<a class="btn" href="/all/">Browse The Wall</a></div>\n</div>';
}

function homePage() {
  var desc = 'Delaly Art Lofi — an endless scroll of relaxing artwork with lofi hip hop for focus and study. Art lofi, chill study beats, and deep focus vibes in one cozy stream.';
  var body =
    '<section class="page-head"><div class="wrap">' +
      '<p class="eyebrow">Art + Lofi Hip Hop</p>' +
      '<h1>Scroll art. <em style="color:var(--accent);font-style:normal">Stay in focus.</em></h1>' +
      '<p class="lede">An infinite stream of Delaly artworks set to a looping lofi beat — made for studying, deep work, and unwinding. Pick a vibe below or just keep scrolling.</p>' +
      TAG_ROW +
    '</div></section>' +
    streamSection(catalog.artworks);
  return page({
    active: 'stream',
    streamJs: true,
    headOpts: {
      title: 'Delaly Art Lofi — Art & Lofi Hip Hop for Focus and Study',
      description: desc,
      path: '/',
      ogImage: '/art/' + catalog.artworks[0].image,
      jsonld: [
        T.musicPlaylistJsonLd(tracks),
        T.imageGalleryJsonLd('Delaly Art Lofi — The Stream', desc, '/', catalog.artworks)
      ]
    },
    bodyHtml: body
  });
}

function exhibitPage(exhibit) {
  var works = worksOf(exhibit.id);
  var desc = exhibit.title + ' Lofi — ' + works.length +
    ' relaxing artworks from the ' + exhibit.title +
    ' collection with lofi hip hop for focus and study. Chill study beats and cozy art, streaming endlessly.';
  var body =
    '<section class="page-head"><div class="wrap">' +
      '<p class="eyebrow">' + T.esc(exhibit.subtitle) + '</p>' +
      '<h1>' + T.esc(exhibit.title) + ' <em style="color:var(--accent);font-style:normal">Lofi</em></h1>' +
      '<p class="lede">' + T.esc(exhibit.description) + '</p>' +
      '<p class="lede" style="margin-top:10px">Press play and scroll — ' + works.length +
      ' pieces, one continuous lofi loop.</p>' +
    '</div></section>' +
    streamSection(works);
  return page({
    active: exhibit.id,
    streamJs: true,
    headOpts: {
      title: exhibit.title + ' Lofi — Relaxing Art & Lofi Hip Hop for Deep Focus | Delaly Art Lofi',
      description: desc,
      path: '/' + exhibit.id + '/',
      ogImage: '/art/' + exhibit.coverImage,
      jsonld: [
        T.musicPlaylistJsonLd(tracks),
        T.imageGalleryJsonLd('Delaly Art Lofi — ' + exhibit.title, desc, '/' + exhibit.id + '/', works)
      ]
    },
    bodyHtml: body
  });
}

function wallPage() {
  var desc = 'The Wall — all ' + catalog.artworks.length +
    ' Delaly artworks in one dense grid. Tap any piece to jump to it in the lofi stream. Art lofi, focus music, and study beats.';
  var tiles = catalog.artworks.map(function (a) { return T.wallTile(a); }).join('\n');
  var body =
    '<section class="page-head"><div class="wrap">' +
      '<p class="eyebrow">Every piece, at once</p>' +
      '<h1>The Wall</h1>' +
      '<p class="lede">All ' + catalog.artworks.length +
      ' artworks in a single grid. Tap any tile to jump to that piece in the stream — the music never stops.</p>' +
    '</div></section>' +
    '<div class="wall">\n' + tiles + '\n</div>';
  return page({
    active: 'wall',
    streamJs: false,
    headOpts: {
      title: 'The Wall — Every Delaly Artwork in One Place | Delaly Art Lofi',
      description: desc,
      path: '/all/',
      ogImage: '/art/' + catalog.artworks[0].image,
      jsonld: [
        T.musicPlaylistJsonLd(tracks),
        T.imageGalleryJsonLd('Delaly Art Lofi — The Wall', desc, '/all/', catalog.artworks)
      ]
    },
    bodyHtml: body
  });
}

function aboutPage() {
  var desc = 'About Delaly Art Lofi — an endless art stream with lofi hip hop for focus and study. By Delaly (@delalyart.shop). Prints available in the gallery shop.';
  var body =
    '<section class="page-head"><div class="wrap">' +
      '<p class="eyebrow">About</p>' +
      '<h1>Art for your focus hours</h1>' +
    '</div></section>' +
    '<div class="prose">' +
      '<p><strong>Delaly Art Lofi</strong> is a slow stream: ' + catalog.artworks.length +
      ' artworks drifting past to a looping lofi hip hop beat. No feed to refresh, no algorithm shouting — just cozy visuals and chill study beats, built for deep work, late-night studying, and quiet mornings.</p>' +
      '<h2>The art</h2>' +
      '<p>Every piece starts as a photograph Delaly shot around Lake Michigan and Chicago, then reimagines it through the hand of a master of art history — Van Gogh, Hokusai, Basquiat, Kusama, and dozens more. The collection grows over time; the stream grows with it.</p>' +
      '<h2>The music</h2>' +
      '<p>The stream opens with <strong>"Just Be Cool — Lofi Hip Hop Remix"</strong> on an endless loop. Press play once and it follows you from page to page while you study.</p>' +
      '<h2>Own the art</h2>' +
      '<p>Love a piece? Museum-quality prints of every artwork are available in the <a href="https://delalyart.shop">Delaly Art print shop</a>. Follow the process on <a href="https://instagram.com/delalyart.shop">Instagram @delalyart.shop</a>.</p>' +
    '</div>';
  return page({
    active: 'about',
    streamJs: false,
    headOpts: {
      title: 'About — Art + Lofi Hip Hop for Focus and Study | Delaly Art Lofi',
      description: desc,
      path: '/about/',
      ogImage: '/art/' + catalog.artworks[0].image,
      jsonld: [T.musicPlaylistJsonLd(tracks)]
    },
    bodyHtml: body
  });
}

function sitemapXml() {
  var urls = ['/', '/all/', '/about/'].concat(catalog.exhibits.map(function (e) { return '/' + e.id + '/'; }));
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(function (u) {
    xml += '  <url><loc>' + T.SITE_URL + u + '</loc><changefreq>weekly</changefreq></url>\n';
  });
  xml += '</urlset>\n';
  return xml;
}

/* ---------- build ---------- */

write('index.html', homePage());
catalog.exhibits.forEach(function (e) {
  write(path.join(e.id, 'index.html'), exhibitPage(e));
});
write(path.join('all', 'index.html'), wallPage());
write(path.join('about', 'index.html'), aboutPage());
write('sitemap.xml', sitemapXml());
write('robots.txt', 'User-agent: *\nAllow: /\nSitemap: ' + T.SITE_URL + '/sitemap.xml\n');
write('favicon.svg',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
  '<rect width="64" height="64" rx="14" fill="#141210"/>' +
  '<circle cx="32" cy="32" r="16" fill="none" stroke="#e8a33d" stroke-width="5"/>' +
  '<circle cx="32" cy="32" r="5" fill="#e8a33d"/></svg>\n');

// static assets
copyDir(path.join(ROOT, 'src', 'assets'), path.join(DIST, 'assets'));
copyDir(path.join(ROOT, 'public', 'art'), path.join(DIST, 'art'));
copyDir(path.join(ROOT, 'public', 'audio'), path.join(DIST, 'audio'));

const htmlCount = (function walk(d, n) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) n = walk(p, n);
    else if (f.endsWith('.html')) n++;
  }
  return n;
})(DIST, 0);

console.log('Built ' + htmlCount + ' pages into dist/ (' +
  catalog.artworks.length + ' artworks, ' + tracks.length + ' track(s))');
