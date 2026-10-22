/*
 * "Live from NASA" section on the home page.
 * Data comes from our own server (/api/nasa/*), which calls NASA's public APIs:
 *   APOD · NeoWs (near-Earth objects) · Exoplanet Archive
 */
(function () {
  'use strict';

  var apodBox = document.getElementById('live-apod');
  var neoBox = document.getElementById('live-neo');
  var exoBox = document.getElementById('live-exo');
  if (!apodBox) return;

  var REFRESH_MS = 30 * 60 * 1000;
  var RETRY_MS = 60 * 1000;
  var REQUEST_TIMEOUT_MS = 15 * 1000;
  var MAX_BG_RETRIES = 5;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function link(href, text) {
    var a = el('a', 'live-src', text);
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  }

  function reset(box) {
    while (box.children.length > 1) box.removeChild(box.lastChild);
  }

  function fail(box, err) {
    reset(box);
    if (err) console.error('[nasa-live]', err.message || err);
    var fallback = 'NASA is not reachable right now. Please try again soon.';
    var msg = window.SSLang ? window.SSLang.t('live.error', fallback) : fallback;
    box.appendChild(el('p', 'live-status', msg));
    if (err && err.message) box.appendChild(el('small', 'live-credit', '(' + err.message + ')'));
  }

  var API = String(window.SS_API || '/api').replace(/\/+$/, '');
  if (!/\/api$/.test(API)) API += '/api';

  // ── Network: timeout + retry ──
  function get(path) {
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS) : null;
    var opts = controller ? { signal: controller.signal } : {};
    
    // Ensure accurate Netlify route targeting
    var targetPath = path.replace(/^\/api/, '');
    var url = API + targetPath;

    return fetch(url, opts).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var why = body.detail || body.message || body.error || '';
          throw new Error('HTTP ' + res.status + (why ? ' – ' + why : ''));
        }
        return body;
      });
    }).then(function (body) {
      if (timer) clearTimeout(timer);
      return body;
    }, function (err) {
      if (timer) clearTimeout(timer);
      if (err && err.name === 'AbortError') err = new Error('timeout');
      throw err;
    });
  }

  function getWithRetry(path, attempts) {
    return get(path).catch(function (err) {
      if (attempts <= 1) throw err;
      var wait = (4 - attempts + 1) * 2000;
      return new Promise(function (resolve) { setTimeout(resolve, wait); })
        .then(function () { return getWithRetry(path, attempts - 1); });
    });
  }

  // ── Cache Handler ──
  var CACHE_PREFIX = 'ss-nasa-';
  function saveCache(key, data) {
    try { localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), data: data })); } catch (e) {}
  }
  function readCache(key) {
    try {
      var raw = JSON.parse(localStorage.getItem(CACHE_PREFIX + key));
      return raw && raw.data ? raw : null;
    } catch (e) { return null; }
  }

  var retryTimers = {};
  var failCount = {};
  var rendered = {};
  var lastLoad = 0;

  function status(box, msg) {
    reset(box);
    box.appendChild(el('p', 'live-status', msg));
  }

  function savedNote(box, cached) {
    box.appendChild(el('small', 'live-credit',
      'Showing saved data from ' + new Date(cached.t).toLocaleString() + ' (refreshing from NASA…)'));
  }

  function load(key, path, box, render) {
    clearTimeout(retryTimers[key]);

    if (!rendered[key]) {
      var cached = readCache(key);
      if (cached) {
        try { render(cached.data); rendered[key] = true; savedNote(box, cached); } catch (e) {}
      }
    }

    var slowTimer = null;
    if (!rendered[key]) {
      slowTimer = setTimeout(function () {
        if (!rendered[key]) status(box, 'NASA is responding slowly, still trying…');
      }, 6000);
    }

    getWithRetry(path, 3).then(function (d) {
      clearTimeout(slowTimer);
      failCount[key] = 0;
      saveCache(key, d);
      render(d);
      rendered[key] = true;
    }).catch(function (err) {
      clearTimeout(slowTimer);
      console.error('[nasa-live]', key, err.message || err);
      if (!rendered[key]) fail(box, err);
      failCount[key] = (failCount[key] || 0) + 1;
      if (failCount[key] <= MAX_BG_RETRIES) {
        retryTimers[key] = setTimeout(function () { load(key, path, box, render); }, RETRY_MS);
      }
    });
  }

  var number = function (n) { return Number(n).toLocaleString(); };

  // ── APOD Render Fix ──
  function renderApod(d) {
    reset(apodBox);
    var isVideo = (d.media_type || d.mediaType) === 'video';
    // Fallback order for img url: url -> hdurl -> thumbnail
    var imgUrl = isVideo ? (d.thumbnail_url || d.thumbnail) : (d.url || d.hdurl);
    
    if (imgUrl) {
      var img = el('img', 'live-img');
      img.src = imgUrl;
      img.alt = d.title || 'Astronomy Picture of the Day';
      img.loading = 'lazy';
      img.onerror = function () { img.style.display = 'none'; };
      apodBox.appendChild(img);
    }
    
    apodBox.appendChild(el('h4', 'live-title', d.title || ''));
    var exp = d.explanation || '';
    var text = exp.length > 320 ? exp.slice(0, 320).replace(/\s+\S*$/, '') + '…' : exp;
    apodBox.appendChild(el('p', 'live-text', text));
    var credit = 'Credit: ' + (d.copyright ? String(d.copyright).replace(/\s+/g, ' ').trim() : 'NASA') + (d.date ? ' · ' + d.date : '');
    apodBox.appendChild(el('p', 'live-credit', credit));
    
    if (isVideo && d.url) {
      apodBox.appendChild(link(d.url, 'Watch today’s video ↗'));
    }
    apodBox.appendChild(link(d.source || 'https://apod.nasa.gov/apod/astropix.html', 'Source: NASA APOD ↗'));
  }

  function loadApod() { load('apod', '/api/nasa/apod', apodBox, renderApod); }

  // ── NeoWs Render ──
  function renderNeo(d) {
    reset(neoBox);
    neoBox.appendChild(el('p', 'live-text', number(d.count) + ' near-Earth objects are tracked today (' + d.date + '). Closest approaches:'));
    var list = el('ul', 'live-list');
    (d.objects || []).slice(0, 5).forEach(function (o) {
      var li = el('li');
      var name = o.link ? link(o.link, o.name) : el('strong', '', o.name);
      li.appendChild(name);
      li.appendChild(el('span', o.hazardous ? 'live-tag warn' : 'live-tag', o.hazardous ? 'potentially hazardous' : 'not hazardous'));
      li.appendChild(el('small', '', '~' + number(o.diameterM) + ' m wide · misses Earth by ' + number(o.missKm) + ' km · ' + o.speedKps + ' km/s'));
      list.appendChild(li);
    });
    neoBox.appendChild(list);
    neoBox.appendChild(link(d.source, 'Source: NASA NeoWs / JPL CNEOS ↗'));
  }
  function loadNeo() { load('neo', '/api/nasa/neo', neoBox, renderNeo); }

  // ── Exoplanets Render ──
  function renderExo(d) {
    reset(exoBox);
    var wrap = el('div', 'live-table-wrap');
    var table = el('table', 'live-table');
    var head = el('tr');
    ['Planet', 'Star', 'Found', 'Size (× Earth)', 'Year length (days)', 'Distance (light-years)'].forEach(function (h) {
      head.appendChild(el('th', '', h));
    });
    table.appendChild(head);
    (d.planets || []).forEach(function (p) {
      var row = el('tr');
      [p.name, p.star, p.year, p.radiusEarth != null ? p.radiusEarth.toFixed(1) : '–',
       p.periodDays != null ? p.periodDays.toFixed(1) : '–', p.distanceLy != null ? number(p.distanceLy) : '–']
        .forEach(function (v) { row.appendChild(el('td', '', String(v))); });
      table.appendChild(row);
    });
    wrap.appendChild(table);
    exoBox.appendChild(wrap);
    exoBox.appendChild(link(d.source, 'Source: NASA Exoplanet Archive ↗'));
  }
  function loadExo() { load('exo', '/api/nasa/exoplanets', exoBox, renderExo); }

  function loadAll() {
    lastLoad = Date.now();
    loadApod();
    loadNeo();
    loadExo();
  }

  loadAll();
  setInterval(loadAll, REFRESH_MS);

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && Date.now() - lastLoad > REFRESH_MS) loadAll();
  });
})();
