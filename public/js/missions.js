/*
 * SpaceSkribble Missions (all run in the browser, so they work on Netlify):
 *   1. Classroom Mode        – teacher link -> student quiz -> report code -> class report
 *   2. Citizen Science       – classify real NASA images (NASA Image Library)
 *   3. Adaptive Revision     – remembers weak topics, builds a revision round
 *   4. AR Sky Mode           – camera + compass + real ephemeris (astronomy-engine)
 *
 * Quiz questions are generated from public/data/spaceObjects.js, so adding objects there
 * automatically adds questions here.
 */
(function () {
  'use strict';

  var OBJ = window.SPACE_OBJECTS || [];
  if (!OBJ.length || !document.getElementById('missions')) return;

  // ───────────────────────── helpers ─────────────────────────
  var user = (window.SSAuth && window.SSAuth.getUser && window.SSAuth.getUser()) || null;
  var UID = user ? String(user.id || user.email || 'me') : 'guest';
  var KEY = function (k) { return 'ss_' + UID + '_' + k; };
  function load(k, def) { try { var v = JSON.parse(localStorage.getItem(KEY(k))); return v == null ? def : v; } catch (e) { return def; } }
  function save(k, v) { try { localStorage.setItem(KEY(k), JSON.stringify(v)); } catch (e) {} }
  function T(k, en) { return window.SSLang ? window.SSLang.t(k, en) : en; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }); }
  function b64e(o) { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64d(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return JSON.parse(decodeURIComponent(escape(atob(s)))); }
  function byId(id) { for (var i = 0; i < OBJ.length; i++) if (OBJ[i].id === id) return OBJ[i]; return null; }
  function copyText(text, btn) {
    var done = function () { if (btn) { var old = btn.textContent; btn.textContent = T('cl.copied', 'Copied!'); setTimeout(function () { btn.textContent = old; }, 1500); } };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { var t = el('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); }
  }
  function download(name, text, type) {
    var a = el('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/csv' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  function button(text, cls, fn) { var b = el('button', cls || 'btn btn-secondary', text); b.type = 'button'; if (fn) b.addEventListener('click', fn); return b; }
  function firstSentence(t) { var m = String(t || '').match(/^.*?[.!?](\s|$)/); return m ? m[0].trim() : String(t || ''); }

  // Bangla for strings built by this file
  if (window.SSLang && window.SSLang.extend) window.SSLang.extend({
    'q.correct': '✅ সঠিক!', 'q.answerIs': '❌ সঠিক উত্তর:', 'q.next': 'পরের প্রশ্ন →', 'q.finish': 'ফলাফল দেখো', 'q.score': 'তোমার স্কোর', 'q.learn': 'NASA-তে আরও জানো ↗',
    'q.which': 'এই ইঙ্গিত কোন মহাজাগতিক বস্তুর?', 'q.type': 'ধরন কী?', 'q.stat': 'নিচের কোনটি সঠিক?',
    'cl.title': 'ক্লাসরুম মোড', 'cl.teacher': 'শিক্ষক', 'cl.student': 'শিক্ষার্থী', 'cl.name': 'ক্লাসের নাম', 'cl.count': 'প্রতি শিক্ষার্থীর প্রশ্ন',
    'cl.topics': 'টপিক বেছে নাও', 'cl.create': 'অ্যাসাইনমেন্ট লিংক বানাও', 'cl.copy': 'কপি', 'cl.copied': 'কপি হয়েছে!',
    'cl.collect': 'শিক্ষার্থীদের রিপোর্ট জমা নাও', 'cl.paste': 'রিপোর্ট কোড পেস্ট করো, প্রতি লাইনে একটি', 'cl.show': 'ক্লাসের রিপোর্ট দেখাও',
    'cl.csv': 'CSV ডাউনলোড', 'cl.none': 'এখনো কোনো অ্যাসাইনমেন্ট নেই। শিক্ষকের কাছ থেকে লিংক নাও।', 'cl.start': 'অ্যাসাইনমেন্ট শুরু করো',
    'cl.report': 'তোমার রিপোর্ট কোড: এটি শিক্ষককে পাঠাও', 'cl.col.student': 'শিক্ষার্থী', 'cl.col.score': 'স্কোর', 'cl.col.weak': 'রিভিশন দরকার',
    'cl.avg': 'ক্লাসের গড়', 'cl.hard': 'সবচেয়ে বেশি ভুল হওয়া টপিক', 'cl.link': 'শিক্ষার্থীদের এই লিংক পাঠাও',
    'cl.note': 'প্রোটোটাইপ: সার্ভার ছাড়াই চলে। রিপোর্ট কোড শিক্ষার্থী নিজে পাঠায়, তাই এটি যাচাই-করা ফল নয়।', 'cl.noreports': 'কোনো বৈধ রিপোর্ট পাওয়া যায়নি।',
    'cl.class': 'ক্লাস', 'cl.questions': 'প্রশ্ন',
    'sc.title': 'সিটিজেন সায়েন্স মিশন', 'sc.skip': 'বাদ দাও', 'sc.unsure': 'নিশ্চিত না', 'sc.count': 'তুমি যত ছবি শ্রেণিবিন্যাস করেছ', 'sc.export': 'আমার শ্রেণিবিন্যাস (CSV) ডাউনলোড',
    'sc.loading': 'NASA ছবি আনা হচ্ছে…', 'sc.saved': 'সেভ হয়েছে!', 'sc.credit': 'ছবি', 'sc.source': 'NASA Image Library-তে দেখো ↗',
    'sc.note': 'প্রোটোটাইপ: ফল শুধু তোমার ডিভাইসে সেভ হয়। এটি Zooniverse-এ জমা হয় না। আসল গবেষণায় অংশ নিতে zooniverse.org দেখো।',
    'sc.t.galaxy': 'গ্যালাক্সির আকার', 'sc.t.crater': 'চাঁদের গর্ত', 'sc.t.galaxy.q': 'ছবির মূল গ্যালাক্সির আকার কেমন?', 'sc.t.crater.q': 'ছবিতে প্রায় কয়টি গর্ত দেখা যায়?',
    'rv.title': 'অ্যাডাপটিভ রিভিশন', 'rv.weak': 'তোমার দুর্বল টপিক', 'rv.none': 'এখনো কোনো ইতিহাস নেই। আগে একটি মিশ্র কুইজ দাও।', 'rv.start': 'রিভিশন রাউন্ড শুরু করো',
    'rv.again': 'আরেকটি রাউন্ড', 'rv.reset': 'ইতিহাস মুছে ফেলো', 'rv.mixed': 'মিশ্র কুইজ শুরু করো', 'rv.sub': 'ভুল বেশি হওয়া টপিক থেকে বেশি প্রশ্ন আসবে।',
    'ar.title': 'AR আকাশ মোড', 'ar.start': 'ক্যামেরায় আকাশ দেখো', 'ar.now': 'এখন আকাশে', 'ar.above': 'দিগন্তের উপরে', 'ar.below': 'দিগন্তের নিচে', 'ar.drag': 'ঘুরে দেখতে ছবিতে টানো',
    'ar.loc': 'অবস্থান', 'ar.dhaka': 'অবস্থানের অনুমতি নেই, তাই ঢাকা ধরা হয়েছে', 'ar.dark': 'সূর্য দিগন্তের নিচে: গ্রহ খোঁজার ভালো সময়।',
    'ar.light': 'সূর্য উপরে: দিনের আলোয় গ্রহ দেখা কঠিন।', 'ar.warn': 'সূর্যের দিকে কখনো সরাসরি তাকিও না।', 'ar.name': 'বস্তু', 'ar.alt': 'উচ্চতা', 'ar.dir': 'দিক',
    'ar.nocam': 'ক্যামেরা পাওয়া যায়নি। ছবি টেনে আকাশ ঘুরিয়ে দেখো।', 'ar.loading': 'আকাশের হিসাব লোড হচ্ছে…', 'ar.fail': 'আকাশের লাইব্রেরি লোড হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করো।',
    'ar.note': 'হিসাব আসল ephemeris থেকে। ফোনের কম্পাস সামান্য ভুল দেখাতে পারে।',
    'b.Sun': 'সূর্য', 'b.Moon': 'চাঁদ', 'b.Mercury': 'বুধ', 'b.Venus': 'শুক্র', 'b.Mars': 'মঙ্গল', 'b.Jupiter': 'বৃহস্পতি', 'b.Saturn': 'শনি', 'b.Uranus': 'ইউরেনাস', 'b.Neptune': 'নেপচুন'
  });

  // ───────────────────────── question generator ─────────────────────────
  function usableClues(o) { var nm = o.name.toLowerCase(); return (o.clues || []).filter(function (c) { return c.toLowerCase().indexOf(nm) < 0; }); }

  function statQuestion(o) {
    var stats = shuffle(o.stats || []);
    for (var i = 0; i < stats.length; i++) {
      var s = stats[i], others = [];
      OBJ.forEach(function (x) {
        if (x === o) return;
        (x.stats || []).forEach(function (t) { if (t.label === s.label && t.value !== s.value && others.indexOf(t.value) < 0) others.push(t.value); });
      });
      if (others.length >= 3) return { label: s.label, value: s.value, wrong: shuffle(others).slice(0, 3) };
    }
    return null;
  }

  function makeQuestion(o) {
    var types = ['category'];
    if (usableClues(o).length) types.push('clue', 'clue');
    var st = statQuestion(o);
    if (st) types.push('stat');
    var t = pick(types), q;

    if (t === 'clue') {
      var same = shuffle(OBJ.filter(function (x) { return x !== o && x.category === o.category; }));
      var rest = shuffle(OBJ.filter(function (x) { return x !== o && x.category !== o.category; }));
      var d = same.concat(rest).slice(0, 3).map(function (x) { return x.name; });
      q = { prompt: T('q.which', 'Which space object matches this clue?'), detail: '“' + pick(usableClues(o)) + '”', options: shuffle([o.name].concat(d)), answer: o.name };
    } else if (t === 'stat') {
      q = { prompt: o.name + ' — ' + st.label + '?', detail: T('q.stat', 'Pick the correct value.'), options: shuffle([st.value].concat(st.wrong)), answer: st.value };
    } else {
      var cats = uniq(OBJ.map(function (x) { return x.category; })).filter(function (c) { return c !== o.category; });
      q = { prompt: T('q.type', 'What type of object is') + ' ' + o.name + '?', options: shuffle([o.category].concat(shuffle(cats).slice(0, 3))), answer: o.category };
    }
    q.obj = o;
    return q;
  }

  // ───────────────────────── adaptive memory ─────────────────────────
  function record(o, ok) {
    var st = load('adaptive', {});
    var r = st[o.id] || { s: 0, c: 0 };
    r.s += 1; if (ok) r.c += 1;
    st[o.id] = r;
    save('adaptive', st);
  }

  // ───────────────────────── quiz runner (shared) ─────────────────────────
  function runQuiz(box, objects, onDone) {
    var qs = objects.map(makeQuestion), i = 0, score = 0, results = [];
    (function show() {
      clear(box);
      if (i >= qs.length) return onDone(score, results);
      var q = qs[i], locked = false;
      box.appendChild(el('p', 'q-progress', (i + 1) + ' / ' + qs.length));
      box.appendChild(el('h3', 'q-prompt', q.prompt));
      if (q.detail) box.appendChild(el('p', 'q-detail', q.detail));
      var wrap = el('div', 'q-options'), fb = el('div', 'q-feedback');
      q.options.forEach(function (opt) {
        var b = button(opt, 'q-opt', function () {
          if (locked) return; locked = true;
          var ok = opt === q.answer;
          if (ok) score++;
          record(q.obj, ok);
          results.push({ id: q.obj.id, ok: ok });
          Array.prototype.forEach.call(wrap.children, function (c) { c.disabled = true; if (c.textContent === q.answer) c.classList.add('right'); });
          if (!ok) b.classList.add('wrong');
          fb.appendChild(el('p', ok ? 'ok' : 'bad', ok ? T('q.correct', '✅ Correct!') : T('q.answerIs', '❌ The answer is') + ' ' + q.answer));
          fb.appendChild(el('p', '', firstSentence(q.obj.description)));
          if (q.obj.nasaReference) {
            var a = el('a', 'live-src', T('q.learn', 'Learn more at NASA ↗')); a.href = q.obj.nasaReference.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
            fb.appendChild(a);
          }
          fb.appendChild(button(i + 1 >= qs.length ? T('q.finish', 'See result') : T('q.next', 'Next →'), 'btn btn-primary', function () { i++; show(); }));
        });
        wrap.appendChild(b);
      });
      box.appendChild(wrap); box.appendChild(fb);
    })();
  }

  function sample(objects, n) {
    var out = [], pool = [];
    while (out.length < n) { if (!pool.length) pool = shuffle(objects); out.push(pool.pop()); }
    return out;
  }

  // ───────────────────────── dialogs ─────────────────────────
  var dialogs = { class: 'modal-ms-class', science: 'modal-ms-science', revise: 'modal-ms-revise', ar: 'modal-ms-ar' };
  function body(name) { return document.getElementById('ms-body-' + name); }
  function openDialog(name) {
    var d = document.getElementById(dialogs[name]);
    if (d && !d.open) d.showModal();
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-ms]'), function (b) {
    b.addEventListener('click', function () {
      var n = b.getAttribute('data-ms');
      ({ class: viewClass, science: viewScience, revise: viewRevise, ar: viewAR })[n]();
      openDialog(n);
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('dialog.ss-modal'), function (d) {
    d.addEventListener('close', function () { if (d.id === 'modal-ms-ar') stopAR(); });
  });

  // ═════════════════════════ 1. CLASSROOM ═════════════════════════
  var assignment = load('assignment', null);

  // A student opens ".../index.html?class=<code>" (the query string survives the login redirect)
  (function readAssignmentFromUrl() {
    var code = new URLSearchParams(location.search).get('class');
    if (!code) return;
    try {
      var a = b64d(code);
      if (a && Array.isArray(a.t) && a.t.length) {
        assignment = { id: String(a.id || ''), name: String(a.n || 'Class').slice(0, 40), topics: a.t.filter(function (id) { return byId(id); }), count: Math.min(20, Math.max(3, +a.q || 5)) };
        save('assignment', assignment);
        history.replaceState(null, '', location.pathname);
        setTimeout(function () { viewClass('student'); openDialog('class'); }, 600);
      }
    } catch (e) { /* ignore bad link */ }
  })();

  function viewClass(tab) {
    tab = tab || 'teacher';
    var box = body('class'); clear(box);
    box.appendChild(el('h3', '', T('cl.title', 'Classroom Mode')));
    var tabs = el('div', 'ms-tabs');
    [['teacher', T('cl.teacher', 'Teacher')], ['student', T('cl.student', 'Student')]].forEach(function (t) {
      tabs.appendChild(button(t[1], 'ms-tab' + (t[0] === tab ? ' on' : ''), function () { viewClass(t[0]); }));
    });
    box.appendChild(tabs);
    var pane = el('div', 'ms-body'); box.appendChild(pane);
    (tab === 'teacher' ? teacherPane : studentPane)(pane);
    box.appendChild(el('p', 'ms-note', T('cl.note', 'Prototype: works without a server. Students send their own report codes, so results are not verified.')));
  }

  function teacherPane(pane) {
    var name = el('input', 'ms-input'); name.value = 'My Class'; name.maxLength = 40;
    var count = el('select');
    [5, 10, 15].forEach(function (n) { var o = el('option', '', String(n)); o.value = n; count.appendChild(o); });
    var row = el('div', 'ms-row');
    var l1 = el('label'); l1.appendChild(el('span', '', T('cl.name', 'Class name'))); l1.appendChild(name);
    var l2 = el('label'); l2.appendChild(el('span', '', T('cl.count', 'Questions per student'))); l2.appendChild(count);
    row.appendChild(l1); row.appendChild(l2); pane.appendChild(row);

    pane.appendChild(el('h4', '', T('cl.topics', 'Choose topics')));
    var topics = el('div', 'ms-topics'), boxes = [];
    uniq(OBJ.map(function (o) { return o.category; })).forEach(function (cat) {
      var g = el('div', 'ms-topic-group'); g.appendChild(el('strong', '', cat));
      OBJ.filter(function (o) { return o.category === cat; }).forEach(function (o) {
        var chip = el('label', 'ms-chip'), cb = el('input'); cb.type = 'checkbox'; cb.value = o.id; cb.checked = true;
        boxes.push(cb); chip.appendChild(cb); chip.appendChild(el('span', '', o.name)); g.appendChild(chip);
      });
      topics.appendChild(g);
    });
    pane.appendChild(topics);

    var out = el('div', 'ms-body');
    pane.appendChild(button(T('cl.create', 'Create assignment link'), 'btn btn-primary', function () {
      var ids = boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
      if (!ids.length) return;
      var a = { id: Math.random().toString(36).slice(2, 7).toUpperCase(), n: name.value.trim() || 'Class', t: ids, q: +count.value };
      var classes = load('classes', {}); classes[a.id] = a.n; save('classes', classes);
      var link = location.origin + location.pathname + '?class=' + b64e(a);
      clear(out);
      out.appendChild(el('p', '', T('cl.link', 'Send this link to your students') + '  (' + T('cl.class', 'Class') + ' ' + a.id + ')'));
      out.appendChild(el('div', 'ms-code', link));
      var cp = button(T('cl.copy', 'Copy'), 'btn btn-secondary', function () { copyText(link, cp); });
      out.appendChild(cp);
    }));
    pane.appendChild(out);

    // collect reports
    pane.appendChild(el('h4', '', T('cl.collect', 'Collect student reports')));
    var ta = el('textarea'); ta.placeholder = T('cl.paste', 'Paste report codes, one per line');
    pane.appendChild(ta);
    var result = el('div', 'ms-wrap');
    var show = button(T('cl.show', 'Show class report'), 'btn btn-secondary', function () { renderReports(ta.value, result); });
    pane.appendChild(show); pane.appendChild(result);
  }

  function renderReports(text, box) {
    clear(box);
    var rows = [];
    String(text).split(/\s+/).forEach(function (line) {
      line = line.trim().replace(/^SSR1\./, '');
      if (!line) return;
      try { var r = b64d(line); if (r && typeof r.s === 'string' && +r.n > 0) rows.push(r); } catch (e) { /* skip */ }
    });
    if (!rows.length) { box.appendChild(el('p', '', T('cl.noreports', 'No valid reports found.'))); return; }
    // keep the latest report per student per class
    var seen = {}; rows = rows.filter(function (r) { var k = r.c + '|' + r.s; if (seen[k]) return false; seen[k] = 1; return true; });

    var total = 0, max = 0, miss = {};
    rows.forEach(function (r) { total += r.sc; max += r.n; (r.w || []).forEach(function (id) { miss[id] = (miss[id] || 0) + 1; }); });
    var worst = Object.keys(miss).sort(function (a, b) { return miss[b] - miss[a]; })[0];
    box.appendChild(el('p', '', T('cl.avg', 'Class average') + ': ' + Math.round(100 * total / max) + '%  ·  ' + rows.length + ' ' + T('cl.col.student', 'Student').toLowerCase() + (worst && byId(worst) ? '  ·  ' + T('cl.hard', 'Most-missed topic') + ': ' + byId(worst).name : '')));

    var table = el('table', 'ms-table'), head = el('tr');
    [T('cl.col.student', 'Student'), T('cl.col.score', 'Score'), T('cl.col.weak', 'Needs revision')].forEach(function (h) { head.appendChild(el('th', '', h)); });
    table.appendChild(head);
    rows.sort(function (a, b) { return b.sc / b.n - a.sc / a.n; }).forEach(function (r) {
      var tr = el('tr');
      tr.appendChild(el('td', '', r.s));
      tr.appendChild(el('td', '', r.sc + '/' + r.n + ' (' + Math.round(100 * r.sc / r.n) + '%)'));
      tr.appendChild(el('td', '', (r.w || []).map(function (id) { return byId(id) ? byId(id).name : id; }).join(', ') || '–'));
      table.appendChild(tr);
    });
    box.appendChild(table);
    box.appendChild(button(T('cl.csv', 'Export CSV'), 'btn btn-secondary', function () {
      var lines = [['class', 'student', 'score', 'out_of', 'percent', 'needs_revision'].join(',')];
      rows.forEach(function (r) { lines.push([r.cn || r.c, r.s, r.sc, r.n, Math.round(100 * r.sc / r.n), (r.w || []).map(function (id) { return byId(id) ? byId(id).name : id; }).join('; ')].map(csvCell).join(',')); });
      download('sami_class_report.csv', lines.join('\n'));
    }));
  }

  function studentPane(pane) {
    if (!assignment) { pane.appendChild(el('p', '', T('cl.none', 'No assignment yet. Ask your teacher for a link.'))); return; }
    pane.appendChild(el('h4', '', T('cl.class', 'Class') + ': ' + assignment.name));
    pane.appendChild(el('p', '', assignment.count + ' ' + T('cl.questions', 'questions') + ' · ' + assignment.topics.map(function (id) { return byId(id).name; }).join(', ')));
    var area = el('div', 'ms-body'); pane.appendChild(area);
    var start = button(T('cl.start', 'Start assignment'), 'btn btn-primary', function () {
      start.remove();
      var objs = sample(assignment.topics.map(byId), assignment.count);
      runQuiz(area, objs, function (score, results) {
        clear(area);
        var weak = uniq(results.filter(function (r) { return !r.ok; }).map(function (r) { return r.id; }));
        area.appendChild(el('h3', '', T('q.score', 'Your score') + ': ' + score + '/' + results.length));
        var report = 'SSR1.' + b64e({ c: assignment.id, cn: assignment.name, s: (user && user.name) || 'Student', sc: score, n: results.length, w: weak, d: new Date().toISOString().slice(0, 10) });
        area.appendChild(el('p', '', T('cl.report', 'Your report code. Send it to your teacher.')));
        area.appendChild(el('div', 'ms-code', report));
        var cp = button(T('cl.copy', 'Copy'), 'btn btn-secondary', function () { copyText(report, cp); });
        area.appendChild(cp);
      });
    });
    pane.insertBefore(start, area);
  }

  // ═════════════════════════ 3. ADAPTIVE REVISION ═════════════════════════
  function viewRevise() {
    var box = body('revise'); clear(box);
    box.appendChild(el('h3', '', T('rv.title', 'Adaptive Revision')));
    box.appendChild(el('p', '', T('rv.sub', 'Topics you miss more often come up more often.')));
    var st = load('adaptive', {});
    var seen = OBJ.filter(function (o) { return st[o.id] && st[o.id].s > 0; });
    if (!seen.length) box.appendChild(el('p', 'ms-note', T('rv.none', 'No history yet. Take a mixed quiz first.')));
    else {
      box.appendChild(el('h4', '', T('rv.weak', 'Your weakest topics')));
      var list = el('div', 'ms-weak');
      seen.sort(function (a, b) { return st[a.id].c / st[a.id].s - st[b.id].c / st[b.id].s; }).slice(0, 6).forEach(function (o) {
        var pct = Math.round(100 * st[o.id].c / st[o.id].s);
        var row = el('div', 'ms-weak-row'), bar = el('div', 'ms-bar'), fill = el('i'); fill.style.width = pct + '%'; bar.appendChild(fill);
        row.appendChild(el('span', '', o.name)); row.appendChild(bar); row.appendChild(el('span', '', pct + '%'));
        list.appendChild(row);
      });
      box.appendChild(list);
    }
    var area = el('div', 'ms-body');
    var go = button(seen.length ? T('rv.start', 'Start revision round') : T('rv.mixed', 'Start mixed quiz'), 'btn btn-primary', function () {
      go.hidden = true;
      var weights = [];
      OBJ.forEach(function (o) {
        var r = st[o.id], w = !r ? 2 : Math.round(1 + 4 * (1 - r.c / r.s));  // unseen = 2, always-right = 1, always-wrong = 5
        for (var i = 0; i < w; i++) weights.push(o);
      });
      var chosen = [], guard = 0;
      while (chosen.length < 8 && guard++ < 200) { var o = pick(weights); if (chosen.filter(function (x) { return x === o; }).length < 2) chosen.push(o); }
      runQuiz(area, chosen, function (score, results) {
        clear(area);
        area.appendChild(el('h3', '', T('q.score', 'Your score') + ': ' + score + '/' + results.length));
        area.appendChild(button(T('rv.again', 'Another round'), 'btn btn-primary', viewRevise));
      });
    });
    box.appendChild(go); box.appendChild(area);
    if (seen.length) box.appendChild(button(T('rv.reset', 'Clear my history'), 'ms-tab', function () { save('adaptive', {}); viewRevise(); }));
  }

  // ═════════════════════════ 2. CITIZEN SCIENCE ═════════════════════════
  var TASKS = [
    { id: 'galaxy', title: 'Galaxy shapes', k: 'sc.t.galaxy', q: 'galaxy hubble', question: 'What shape is the main galaxy?', qk: 'sc.t.galaxy.q',
      options: ['Spiral', 'Elliptical', 'Irregular', 'Not a galaxy'], fallback: [['/assets/img/andromeda.jpg', 'Andromeda Galaxy'], ['/assets/img/milky-way.jpg', 'Milky Way']] },
    { id: 'crater', title: 'Moon craters', k: 'sc.t.crater', q: 'moon surface craters', question: 'About how many craters can you see?', qk: 'sc.t.crater.q',
      options: ['None', '1–5', '6–20', 'More than 20'], fallback: [['/assets/img/moon.jpg', 'The Moon'], ['/assets/img/mercury.jpg', 'Mercury']] }
  ];
  var imageCache = {};

  function fetchImages(task) {
    if (imageCache[task.id]) return Promise.resolve(imageCache[task.id]);
    var url = 'https://images-api.nasa.gov/search?media_type=image&page_size=60&q=' + encodeURIComponent(task.q);
    var timeout = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(9000) : undefined;
    return fetch(url, { signal: timeout }).then(function (r) { if (!r.ok) throw new Error('HTTP'); return r.json(); }).then(function (d) {
      var items = ((d.collection || {}).items || []).map(function (it) {
        var meta = (it.data || [])[0] || {}, thumb = (it.links || [])[0];
        return thumb && meta.nasa_id ? { id: meta.nasa_id, title: meta.title || 'NASA image', src: thumb.href, credit: 'NASA' + (meta.center ? ' / ' + meta.center : ''), link: 'https://images.nasa.gov/details/' + encodeURIComponent(meta.nasa_id) } : null;
      }).filter(Boolean);
      if (!items.length) throw new Error('empty');
      imageCache[task.id] = items; return items;
    }).catch(function () {
      imageCache[task.id] = task.fallback.map(function (f, i) { return { id: 'local-' + task.id + '-' + i, title: f[1], src: f[0], credit: 'NASA', link: 'https://www.nasa.gov/images/' }; });
      return imageCache[task.id];
    });
  }

  function viewScience(taskId) {
    var task = TASKS.filter(function (t) { return t.id === taskId; })[0] || TASKS[0];
    var box = body('science'); clear(box);
    box.appendChild(el('h3', '', T('sc.title', 'Citizen Science Mission')));
    var tabs = el('div', 'ms-tabs');
    TASKS.forEach(function (t) { tabs.appendChild(button(T(t.k, t.title), 'ms-tab' + (t === task ? ' on' : ''), function () { viewScience(t.id); })); });
    box.appendChild(tabs);
    var stage = el('div', 'ms-body'); box.appendChild(stage);
    var done = load('science', []);
    var counter = el('p', '', T('sc.count', 'Images you classified') + ': ' + done.length);
    box.appendChild(counter);
    box.appendChild(button(T('sc.export', 'Export my classifications (CSV)'), 'btn btn-secondary', function () {
      var lines = [['task', 'nasa_id', 'title', 'answer', 'date', 'link'].join(',')];
      done.forEach(function (r) { lines.push([r.task, r.id, r.title, r.answer, r.ts, r.link].map(csvCell).join(',')); });
      download('sami_citizen_science.csv', lines.join('\n'));
    }));
    box.appendChild(el('p', 'ms-note', T('sc.note', 'Prototype: results are saved on your device only and are not sent to Zooniverse. For real research projects visit zooniverse.org.')));

    stage.appendChild(el('p', '', T('sc.loading', 'Loading NASA images…')));
    fetchImages(task).then(function (items) {
      var current = pick(items);
      (function render(item) {
        clear(stage);
        var img = el('img', 'sci-img'); img.src = item.src; img.alt = item.title;
        img.addEventListener('error', function () { render(pick(items)); }, { once: true });
        stage.appendChild(img);
        var cr = el('p', 'sci-credit', T('sc.credit', 'Image') + ': ' + item.title + ' · ' + item.credit + ' · ');
        var a = el('a', 'live-src', T('sc.source', 'View on NASA Image Library ↗')); a.href = item.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; cr.appendChild(a);
        stage.appendChild(cr);
        stage.appendChild(el('h4', '', T(task.qk, task.question)));
        var wrap = el('div', 'q-options');
        task.options.concat([T('sc.unsure', 'Not sure')]).forEach(function (opt) {
          wrap.appendChild(button(opt, 'q-opt', function () {
            done.push({ task: task.id, id: item.id, title: item.title, answer: opt, ts: new Date().toISOString(), link: item.link });
            save('science', done);
            counter.textContent = T('sc.count', 'Images you classified') + ': ' + done.length;
            render(pick(items));
          }));
        });
        stage.appendChild(wrap);
        stage.appendChild(button(T('sc.skip', 'Skip'), 'ms-tab', function () { render(pick(items)); }));
      })(current);
    });
  }

  // ═════════════════════════ 4. AR SKY ═════════════════════════
  var BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'];
  var BODY_COLOR = { Sun: '#ffd166', Moon: '#e8e8f0', Mercury: '#b7b2a8', Venus: '#ffe3a1', Mars: '#ff7a5c', Jupiter: '#f1c8a0', Saturn: '#e6d29a', Uranus: '#9be7ee', Neptune: '#7aa2ff' };
  var AR = { lat: 23.8103, lon: 90.4125, usedDefault: true, heading: 0, pitch: 0, sensor: false, stream: null, raf: 0, timer: 0, listeners: [], sky: [] };
  var DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  var wrap180 = function (d) { d = ((d + 180) % 360 + 360) % 360 - 180; return d; };
  var dirName = function (az) { return DIRS[Math.round(az / 45) % 8]; };

  function loadAstronomy() {
    return new Promise(function (resolve, reject) {
      if (window.Astronomy) return resolve();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/astronomy-engine@2.1.19/astronomy.browser.min.js';
      s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }

  function computeSky() {
    var now = new Date(), obs = new window.Astronomy.Observer(AR.lat, AR.lon, 0);
    AR.sky = BODIES.map(function (n) {
      var eq = window.Astronomy.Equator(n, now, obs, true, true);
      var h = window.Astronomy.Horizon(now, obs, eq.ra, eq.dec, 'normal');
      return { name: n, alt: h.altitude, az: h.azimuth };
    });
  }

  function stopAR() {
    cancelAnimationFrame(AR.raf); clearInterval(AR.timer);
    if (AR.stream) AR.stream.getTracks().forEach(function (t) { t.stop(); });
    AR.stream = null;
    AR.listeners.forEach(function (l) { window.removeEventListener(l[0], l[1]); });
    AR.listeners = [];
  }

  function viewAR() {
    stopAR();
    var box = body('ar'); clear(box);
    box.appendChild(el('h3', '', T('ar.title', 'AR Sky Mode')));
    var status = el('p', 'ms-note', T('ar.warn', 'Never look directly at the Sun.'));
    box.appendChild(status);
    var stage = el('div', 'ar-stage'), video = el('video'), canvas = el('canvas');
    video.setAttribute('playsinline', ''); video.muted = true;
    stage.appendChild(video); stage.appendChild(canvas); box.appendChild(stage);
    var list = el('div', 'ms-wrap'); box.appendChild(list);
    box.appendChild(el('p', 'ms-note', T('ar.note', 'Positions come from a real ephemeris. Phone compasses can be a few degrees off.')));

    var go = button(T('ar.start', 'Start camera sky view'), 'btn btn-primary', function () { go.hidden = true; start(); });
    box.insertBefore(go, stage);

    function start() {
      status.textContent = T('ar.loading', 'Loading the sky calculator…');
      // 1. permissions that need a tap (iOS motion), then location, camera
      var motionPerm = (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function')
        ? DeviceOrientationEvent.requestPermission().catch(function () { return 'denied'; }) : Promise.resolve('granted');
      var geo = new Promise(function (res) {
        if (!navigator.geolocation) return res(false);
        navigator.geolocation.getCurrentPosition(function (p) { AR.lat = p.coords.latitude; AR.lon = p.coords.longitude; AR.usedDefault = false; res(true); }, function () { res(false); }, { timeout: 8000, maximumAge: 600000 });
      });
      Promise.all([motionPerm, geo, loadAstronomy().then(function () { return true; }, function () { return false; })]).then(function (r) {
        if (!r[2]) { status.textContent = T('ar.fail', 'Could not load the sky library. Check your internet.'); go.hidden = false; return; }
        computeSky();
        listenSensors(r[0] === 'granted');
        return cameraOn().then(function () { loop(); });
      });
    }

    function cameraOn() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { status.textContent = T('ar.nocam', 'No camera found. Drag the picture to look around.'); return Promise.resolve(); }
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }).then(function (s) {
        AR.stream = s; video.srcObject = s; return video.play();
      }).catch(function () { status.textContent = T('ar.nocam', 'No camera found. Drag the picture to look around.'); });
    }

    function listenSensors(allowed) {
      var onOrient = function (e) {
        if (e.alpha == null && e.webkitCompassHeading == null) return;
        var a = (e.alpha || 0) * Math.PI / 180, b = (e.beta || 0) * Math.PI / 180, g = (e.gamma || 0) * Math.PI / 180;
        // direction the back camera points to, in east / north / up
        var E = -(Math.sin(g) * Math.cos(a) + Math.cos(g) * Math.sin(b) * Math.sin(a));
        var N = -(Math.sin(g) * Math.sin(a) - Math.cos(g) * Math.sin(b) * Math.cos(a));
        var U = -Math.cos(g) * Math.cos(b);
        AR.pitch = Math.asin(Math.max(-1, Math.min(1, U))) * 180 / Math.PI;
        if (e.webkitCompassHeading != null) AR.heading = e.webkitCompassHeading;      // iOS
        else if (e.absolute || e.type === 'deviceorientationabsolute') AR.heading = (Math.atan2(E, N) * 180 / Math.PI + 360) % 360;  // Android
        else return;
        AR.sensor = true;
      };
      if (allowed) {
        var evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
        window.addEventListener(evt, onOrient); AR.listeners.push([evt, onOrient]);
      }
      // desktop / no sensors: drag to look around
      var drag = null;
      canvas.addEventListener('pointerdown', function (e) { drag = [e.clientX, e.clientY]; canvas.setPointerCapture(e.pointerId); });
      canvas.addEventListener('pointerup', function () { drag = null; });
      canvas.addEventListener('pointermove', function (e) {
        if (!drag || AR.sensor) return;
        AR.heading = (AR.heading - (e.clientX - drag[0]) * 0.25 + 360) % 360;
        AR.pitch = Math.max(-80, Math.min(89, AR.pitch + (e.clientY - drag[1]) * 0.25));
        drag = [e.clientX, e.clientY];
      });
    }

    function loop() {
      var ctx = canvas.getContext('2d');
      AR.timer = setInterval(function () { computeSky(); table(); }, 5000);
      table();
      (function frame() {
        var r = stage.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
        if (canvas.width !== Math.round(r.width * dpr)) { canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr); }
        var W = canvas.width, H = canvas.height, hfov = 62, vfov = hfov * H / W;
        ctx.clearRect(0, 0, W, H);
        if (!AR.stream) { // no camera: draw a simple night sky
          var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050816'); g.addColorStop(1, '#14204a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        var fs = Math.max(12, W / 38) ;
        ctx.font = '600 ' + fs + 'px system-ui, sans-serif'; ctx.textBaseline = 'middle';
        // horizon line
        var yH = H / 2 + AR.pitch / vfov * H;
        ctx.strokeStyle = 'rgba(120,220,160,.7)'; ctx.setLineDash([10, 8]); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, yH); ctx.lineTo(W, yH); ctx.stroke(); ctx.setLineDash([]);
        for (var c = 0; c < 360; c += 45) {
          var cx = W / 2 + wrap180(c - AR.heading) / hfov * W;
          if (cx > 0 && cx < W) { ctx.fillStyle = 'rgba(120,220,160,.95)'; ctx.fillText(DIRS[c / 45], cx - fs / 3, yH - fs); }
        }
        var edge = []; // off-screen markers already placed, so labels do not overlap
        AR.sky.forEach(function (b) {
          var dx = wrap180(b.az - AR.heading), dy = b.alt - AR.pitch;
          var x = W / 2 + dx / hfov * W, y = H / 2 - dy / vfov * H;
          var label = T('b.' + b.name, b.name) + '  ' + Math.round(b.alt) + '°';
          if (b.alt < 0) return;
          var on = x > 0 && x < W && y > 0 && y < H;
          ctx.fillStyle = BODY_COLOR[b.name];
          if (on) {
            ctx.beginPath(); ctx.arc(x, y, fs * 0.6, 0, 7); ctx.fill();
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, fs * 1.1, 0, 7); ctx.stroke();
            ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 6; ctx.fillText(label, x + fs * 1.4, y); ctx.shadowBlur = 0;
          } else { // arrow at the edge, pointing to where it is
            var ex = Math.max(fs, Math.min(W - fs, x)), ey = Math.max(fs, Math.min(H - fs, y));
            for (var g2 = 0; g2 < 12; g2++) {
              var clash = edge.filter(function (p) { return Math.abs(p[0] - ex) < W * 0.45 && Math.abs(p[1] - ey) < fs * 1.5; })[0];
              if (!clash) break;
              ey = clash[1] + fs * 1.6;
            }
            ey = Math.min(ey, H - fs); edge.push([ex, ey]);
            ctx.fillStyle = BODY_COLOR[b.name]; ctx.globalAlpha = 0.85;
            ctx.beginPath(); ctx.arc(ex, ey, fs * 0.45, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
            ctx.fillStyle = '#fff'; ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
            var tx = ex < W / 2 ? ex + fs * 0.8 : ex - fs * 0.8 - ctx.measureText(label).width; ctx.fillText(label, tx, ey); ctx.shadowBlur = 0;
          }
        });
        AR.raf = requestAnimationFrame(frame);
      })();
    }

    function table() {
      clear(list);
      var sun = AR.sky.filter(function (b) { return b.name === 'Sun'; })[0];
      var msg = [];
      msg.push(T('ar.loc', 'Location') + ': ' + AR.lat.toFixed(2) + '°, ' + AR.lon.toFixed(2) + '°' + (AR.usedDefault ? ' (' + T('ar.dhaka', 'location permission not given, using Dhaka') + ')' : ''));
      if (sun) msg.push(sun.alt < -6 ? T('ar.dark', 'The Sun is below the horizon: a good time to look for planets.') : T('ar.light', 'The Sun is up: planets are hard to see in daylight.'));
      if (!AR.sensor) msg.push(T('ar.drag', 'Drag the picture to look around.'));
      status.textContent = msg.join('  ·  ');
      var t = el('table', 'ms-table'), head = el('tr');
      [T('ar.name', 'Object'), T('ar.alt', 'Altitude'), T('ar.dir', 'Direction'), ''].forEach(function (h) { head.appendChild(el('th', '', h)); });
      t.appendChild(head);
      AR.sky.forEach(function (b) {
        var tr = el('tr');
        tr.appendChild(el('td', '', T('b.' + b.name, b.name)));
        tr.appendChild(el('td', '', Math.round(b.alt) + '°'));
        tr.appendChild(el('td', '', dirName(b.az) + ' (' + Math.round(b.az) + '°)'));
        tr.appendChild(el('td', '', b.alt > 0 ? '✅ ' + T('ar.above', 'above horizon') : '⬇ ' + T('ar.below', 'below horizon')));
        t.appendChild(tr);
      });
      list.appendChild(t);
    }
  }
})();
