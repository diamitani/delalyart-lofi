/* Template helpers for the Delaly Art Lofi static build. Pure Node, no dependencies. */
'use strict';

var SITE_URL = 'https://lofi.delalyart.shop';
var BRAND = 'Delaly Art Lofi';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

var KEYWORDS = 'art lofi, lofi art, lofi hip hop, focus music, study music, chill study beats, relaxing art, art for studying, deep focus playlist, cozy art stream, lofi beats to relax, study beats, aesthetic art, chillhop art';

function head(o) {
  // o: {title, description, path, ogImage, jsonld (array of objects), extraHead}
  var canonical = SITE_URL + o.path;
  var tags = '';
  tags += '<meta charset="utf-8">\n';
  tags += '<meta name="viewport" content="width=device-width, initial-scale=1">\n';
  tags += '<title>' + esc(o.title) + '</title>\n';
  tags += '<meta name="description" content="' + esc(o.description) + '">\n';
  tags += '<meta name="keywords" content="' + esc(KEYWORDS) + '">\n';
  tags += '<meta name="author" content="Delaly Art">\n';
  tags += '<link rel="canonical" href="' + esc(canonical) + '">\n';
  tags += '<meta name="robots" content="index, follow">\n';
  tags += '<meta property="og:type" content="website">\n';
  tags += '<meta property="og:site_name" content="' + esc(BRAND) + '">\n';
  tags += '<meta property="og:title" content="' + esc(o.title) + '">\n';
  tags += '<meta property="og:description" content="' + esc(o.description) + '">\n';
  tags += '<meta property="og:url" content="' + esc(canonical) + '">\n';
  tags += '<meta property="og:image" content="' + esc(SITE_URL + o.ogImage) + '">\n';
  tags += '<meta name="twitter:card" content="summary_large_image">\n';
  tags += '<meta name="twitter:title" content="' + esc(o.title) + '">\n';
  tags += '<meta name="twitter:description" content="' + esc(o.description) + '">\n';
  tags += '<meta name="twitter:image" content="' + esc(SITE_URL + o.ogImage) + '">\n';
  tags += '<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n';
  tags += '<link rel="stylesheet" href="/assets/css/style.css">\n';
  (o.jsonld || []).forEach(function (obj) {
    tags += '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>\n';
  });
  if (o.extraHead) tags += o.extraHead;
  return '<head>\n' + tags + '</head>';
}

function header(active) {
  function link(href, label, key) {
    return '<a href="' + href + '"' + (active === key ? ' class="active" aria-current="page"' : '') + '>' + label + '</a>';
  }
  return '' +
    '<header class="site-header"><div class="wrap header-inner">' +
      '<a class="brand" href="/">Delaly <em>Lofi</em></a>' +
      '<nav class="main-nav" aria-label="Main">' +
        link('/', 'Stream', 'stream') +
        link('/beach/', 'Beach', 'beach') +
        link('/nocturne/', 'Nocturne', 'nocturne') +
        link('/city/', 'City', 'city') +
        link('/shore/', 'Shore', 'shore') +
        link('/all/', 'The Wall', 'wall') +
        link('/about/', 'About', 'about') +
      '</nav>' +
    '</div></header>';
}

function footer() {
  return '' +
    '<footer class="site-footer"><div class="wrap">' +
      '<p><strong>Delaly Art Lofi</strong> — art and lofi hip hop for focus and study.</p>' +
      '<p class="footer-links">' +
        '<a href="https://delalyart.shop">Print shop</a> · ' +
        '<a href="https://instagram.com/delalyart.shop">Instagram @delalyart.shop</a>' +
      '</p>' +
      '<p class="fine">Artworks by Delaly · Music: "Just Be Cool — Lofi Hip Hop Remix"</p>' +
    '</div></footer>';
}

/* One stream card. index>11 cards are hidden until the infinite-scroll JS reveals them. */
function streamCard(a, exhibitTitle, index) {
  var hidden = index > 11 ? ' data-deferred="1" style="display:none"' : '';
  return '' +
    '<article class="vibe-card" id="' + esc(a.id) + '"' + hidden + '>' +
      '<div class="vibe-media"><img src="/art/' + esc(a.image) + '" alt="' + esc(a.title + ' — ' + a.style) + '" loading="lazy" decoding="async"></div>' +
      '<div class="vibe-meta">' +
        '<h2>' + esc(a.title) + '</h2>' +
        '<p class="vibe-style">' + esc(a.style) + '</p>' +
        '<p class="vibe-blurb">' + esc(a.blurb) + '</p>' +
        '<a class="chip" href="/' + esc(a.exhibitId) + '/">' + esc(exhibitTitle) + '</a>' +
      '</div>' +
    '</article>';
}

function wallTile(a) {
  return '' +
    '<a class="wall-tile" href="/#' + esc(a.id) + '" title="' + esc(a.title + ' — ' + a.style) + '">' +
      '<img src="/art/' + esc(a.image) + '" alt="' + esc(a.title + ' — ' + a.style) + '" loading="lazy" decoding="async">' +
      '<span class="wall-label">' + esc(a.title) + '</span>' +
    '</a>';
}

function musicPlaylistJsonLd(tracks) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: 'Delaly Art Lofi — Focus & Study Stream',
    description: 'Lofi hip hop for focus and study, paired with a scrolling gallery of Delaly artworks.',
    numTracks: tracks.length,
    track: tracks.map(function (t) {
      return {
        '@type': 'MusicRecording',
        name: t.title,
        byArtist: { '@type': 'MusicGroup', name: t.artist },
        audio: SITE_URL + (t.files.mp3 || t.files.ogg || t.files.wav)
      };
    })
  };
}

function imageGalleryJsonLd(name, description, path, artworks) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: name,
    description: description,
    url: SITE_URL + path,
    associatedMedia: artworks.map(function (a) {
      return {
        '@type': 'ImageObject',
        name: a.title,
        caption: a.style + ' — ' + a.blurb,
        contentUrl: SITE_URL + '/art/' + a.image
      };
    })
  };
}

module.exports = {
  SITE_URL: SITE_URL,
  BRAND: BRAND,
  KEYWORDS: KEYWORDS,
  esc: esc,
  head: head,
  header: header,
  footer: footer,
  streamCard: streamCard,
  wallTile: wallTile,
  musicPlaylistJsonLd: musicPlaylistJsonLd,
  imageGalleryJsonLd: imageGalleryJsonLd
};
