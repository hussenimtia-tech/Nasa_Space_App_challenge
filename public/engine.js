/*
 * SpaceSkribble – game engine
 * ---------------------------
 * The single source of truth for game rules: players, turns, timer, clues,
 * guessing, scoring and the Space Bots.
 *
 * The SAME file runs in two places:
 *   • server.js (Node + Socket.IO)  → real multiplayer across devices
 *   • app.js local host (browser)   → offline / same-browser multiplayer
 *
 * The engine never touches the network directly. It calls
 *   emit(to, event, payload)
 * where `to` is 'all', a player id, or { except: playerId }.
 * The host (server or browser tab) is responsible for delivering it and for
 * calling room.tick(ms) on a timer.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./data/spaceObjects.js'));
  else root.SpaceEngine = factory(root.SPACE_OBJECTS);
})(typeof self !== 'undefined' ? self : this, function (SPACE_OBJECTS) {
  // ───────────────────────────── settings ─────────────────────────────
  const CHOOSE_TIME = 12; // seconds the drawer has to pick an object
  const REVEAL_TIME = 12; // seconds the NASA card stays on screen
  const GUESS_COOLDOWN_MS = 900; // anti-spam: minimum gap between guesses
  const MAX_PLAYERS = 10;
  const BASE_POINTS = 50; // correct guess
  const SPEED_BONUS = 50; // max extra points for a fast guess
  const DRAWER_POINTS_PER_GUESS = 20;

  const AVATARS = ['🚀', '🪐', '👩‍🚀', '👨‍🚀', '🛰️', '🌙', '☄️', '👽', '🌟', '🔭', '🌍', '🌞'];
  const BOT_NAMES = ['Nova Bot', 'Comet Bot', 'Quasar Bot', 'Orbit Bot', 'Pulsar Bot', 'Rover Bot'];

  // ───────────────────────────── helpers ─────────────────────────────
  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/^the\s+/, '')
      .replace(/[^a-z0-9]/g, '');

  function levenshtein(a, b) {
    if (a === b) return 0;
    const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
        prev = tmp;
      }
    }
    return dp[b.length];
  }

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0));
  const r4 = (n) => Math.round(clamp01(n) * 10000) / 10000;

  function answersFor(obj) {
    return [obj.name, ...(obj.aliases || [])].map(normalize).filter(Boolean);
  }

  // "Saturn" → "______", revealing chosen indexes
  function maskName(name, revealed) {
    return Array.from(name)
      .map((ch, i) => (/[a-z0-9]/i.test(ch) ? (revealed.has(i) ? ch : '_') : ch))
      .join('');
  }

  // ───────────────────────────── bot sketches ─────────────────────────────
  // Produces simple strokes (normalized 0..1 coordinates) so Space Bots can draw.
  const Sketch = {
    circle(cx, cy, r, n = 40, ry = r, rot = 0, from = 0, to = Math.PI * 2) {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const t = from + ((to - from) * i) / n;
        const x = Math.cos(t) * r;
        const y = Math.sin(t) * ry;
        pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
      }
      return pts;
    },
    line(x1, y1, x2, y2, n = 8) {
      const pts = [];
      for (let i = 0; i <= n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
      return pts;
    },
    wobble(pts, amt = 0.004) {
      return pts.map(([x, y]) => [x + (Math.random() - 0.5) * amt, y + (Math.random() - 0.5) * amt]);
    },
    stars(list, c = '#ffffff', s = 9) {
      return list.map(([x, y]) => ({ c, s, pts: [[x, y]] }));
    },
    connect(list, order, c = '#7fb3ff', s = 3) {
      return order.map(([a, b]) => ({ c, s, pts: Sketch.line(list[a][0], list[a][1], list[b][0], list[b][1], 6) }));
    },
  };

  function planet(color, extras = []) {
    const base = [{ c: color, s: 6, pts: Sketch.circle(0.5, 0.5, 0.22) }];
    return base.concat(extras);
  }

  function buildSketch(obj) {
    const S = Sketch;
    switch (obj.sketch) {
      case 'mercury':
        return planet('#b7b2a8', [
          { c: '#8d877c', s: 5, pts: S.circle(0.44, 0.44, 0.04) },
          { c: '#8d877c', s: 5, pts: S.circle(0.58, 0.55, 0.05) },
          { c: '#8d877c', s: 4, pts: S.circle(0.47, 0.62, 0.025) },
        ]);
      case 'venus':
        return planet('#f2d29b', [
          { c: '#d9a066', s: 5, pts: S.circle(0.5, 0.5, 0.12, 30, 0.05, 0.2, 0, Math.PI * 1.5) },
          { c: '#d9a066', s: 5, pts: S.line(0.32, 0.4, 0.66, 0.38) },
        ]);
      case 'earth':
        return planet('#4d96ff', [
          { c: '#06d6a0', s: 10, pts: S.wobble(S.circle(0.44, 0.44, 0.07, 20, 0.05), 0.01) },
          { c: '#06d6a0', s: 10, pts: S.wobble(S.circle(0.58, 0.58, 0.05, 20, 0.08), 0.01) },
          { c: '#ffffff', s: 4, pts: S.line(0.36, 0.3, 0.52, 0.32) },
        ]);
      case 'mars':
        return planet('#e2603c', [
          { c: '#ffffff', s: 8, pts: S.circle(0.5, 0.31, 0.05, 20, 0.015) },
          { c: '#a63d24', s: 6, pts: S.line(0.36, 0.52, 0.62, 0.55) },
        ]);
      case 'jupiter':
        return planet('#d9a066', [
          { c: '#a66a36', s: 6, pts: S.line(0.3, 0.42, 0.7, 0.42) },
          { c: '#a66a36', s: 6, pts: S.line(0.29, 0.5, 0.71, 0.5) },
          { c: '#a66a36', s: 6, pts: S.line(0.31, 0.6, 0.69, 0.6) },
          { c: '#ef476f', s: 6, pts: S.circle(0.58, 0.55, 0.045, 20, 0.022) },
        ]);
      case 'saturn':
        return [
          { c: '#e8cf94', s: 6, pts: S.circle(0.5, 0.5, 0.17) },
          { c: '#d9b66a', s: 6, pts: S.circle(0.5, 0.5, 0.34, 50, 0.08, -0.25) },
          { c: '#bfa36a', s: 4, pts: S.circle(0.5, 0.5, 0.28, 50, 0.06, -0.25) },
          { c: '#c79a56', s: 5, pts: S.line(0.36, 0.44, 0.64, 0.42) },
        ];
      case 'uranus':
        return planet('#9fe3e8', [{ c: '#ffffff', s: 4, pts: S.circle(0.5, 0.5, 0.06, 40, 0.32, 0.1) }]);
      case 'neptune':
        return planet('#3d5afe', [
          { c: '#1a237e', s: 8, pts: S.circle(0.45, 0.5, 0.05, 20, 0.03) },
          { c: '#ffffff', s: 4, pts: S.line(0.4, 0.42, 0.56, 0.4) },
        ]);
      case 'moon': {
        const out = [{ c: '#d6d6d6', s: 6, pts: S.circle(0.5, 0.5, 0.22) }];
        [[0.43, 0.42, 0.04], [0.58, 0.47, 0.05], [0.47, 0.6, 0.03], [0.6, 0.62, 0.025]].forEach(([x, y, r]) =>
          out.push({ c: '#9aa5b1', s: 4, pts: S.circle(x, y, r, 18) })
        );
        return out;
      }
      case 'sun': {
        const out = [{ c: '#ffb703', s: 8, pts: S.circle(0.5, 0.5, 0.15) }];
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          out.push({ c: '#ff8a3d', s: 5, pts: S.line(0.5 + Math.cos(a) * 0.2, 0.5 + Math.sin(a) * 0.2, 0.5 + Math.cos(a) * 0.3, 0.5 + Math.sin(a) * 0.3, 4) });
        }
        return out;
      }
      case 'iss': {
        const out = [{ c: '#cfd8dc', s: 6, pts: S.line(0.15, 0.5, 0.85, 0.5, 14) }];
        [0.2, 0.32, 0.68, 0.8].forEach((x) => {
          out.push({ c: '#4d96ff', s: 4, pts: [[x - 0.04, 0.3], [x + 0.04, 0.3], [x + 0.04, 0.7], [x - 0.04, 0.7], [x - 0.04, 0.3]] });
        });
        out.push({ c: '#ffffff', s: 9, pts: S.line(0.44, 0.5, 0.56, 0.5, 4) });
        out.push({ c: '#ffffff', s: 6, pts: S.line(0.5, 0.42, 0.5, 0.6, 4) });
        return out;
      }
      case 'orion': {
        const st = [[0.36, 0.2], [0.64, 0.24], [0.45, 0.5], [0.5, 0.49], [0.55, 0.48], [0.38, 0.8], [0.66, 0.78]];
        return S.stars(st, '#ffffff', 11).concat(S.connect(st, [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]]));
      }
      case 'dipper': {
        const st = [[0.2, 0.35], [0.33, 0.38], [0.45, 0.45], [0.56, 0.5], [0.58, 0.68], [0.8, 0.7], [0.8, 0.5]];
        return S.stars(st, '#ffe08a', 11).concat(S.connect(st, [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]], '#ffe08a'));
      }
      case 'pleiades': {
        const st = [[0.42, 0.4], [0.5, 0.36], [0.57, 0.42], [0.6, 0.52], [0.5, 0.55], [0.44, 0.5], [0.52, 0.47]];
        const out = S.stars(st, '#8ecdff', 13);
        st.forEach(([x, y]) => {
          out.push({ c: '#ffffff', s: 2, pts: S.line(x - 0.02, y, x + 0.02, y, 2) });
          out.push({ c: '#ffffff', s: 2, pts: S.line(x, y - 0.025, x, y + 0.025, 2) });
        });
        return out;
      }
      case 'milkyway': {
        const out = [
          { c: '#e0c3fc', s: 26, pts: S.wobble(S.line(0.05, 0.75, 0.95, 0.25, 20), 0.02) },
          { c: '#ffffff', s: 8, pts: S.wobble(S.line(0.1, 0.72, 0.9, 0.28, 20), 0.03) },
        ];
        for (let i = 0; i < 18; i++) out.push({ c: '#ffffff', s: 4, pts: [[Math.random(), Math.random()]] });
        return out;
      }
      case 'andromeda': {
        const out = [{ c: '#ffffff', s: 12, pts: S.circle(0.5, 0.5, 0.05, 20, 0.025, -0.4) }];
        out.push({ c: '#c9b6ff', s: 6, pts: S.circle(0.5, 0.5, 0.2, 40, 0.08, -0.4) });
        out.push({ c: '#8b5cf6', s: 5, pts: S.circle(0.5, 0.5, 0.32, 50, 0.13, -0.4) });
        return out;
      }
      case 'nebula': {
        const out = [
          { c: '#ff7eb6', s: 18, pts: S.wobble(S.circle(0.45, 0.48, 0.18, 30, 0.12), 0.04) },
          { c: '#c77dff', s: 14, pts: S.wobble(S.circle(0.56, 0.55, 0.14, 30, 0.1), 0.04) },
        ];
        return out.concat(S.stars([[0.48, 0.5], [0.52, 0.49], [0.5, 0.53], [0.53, 0.53]], '#ffffff', 8));
      }
      case 'meteor': {
        const out = [];
        for (let i = 0; i < 6; i++) {
          const x = 0.2 + Math.random() * 0.6;
          const y = 0.15 + Math.random() * 0.5;
          out.push({ c: obj.color || '#ffd166', s: 5, pts: S.line(x, y, x - 0.16, y + 0.12, 6) });
          out.push({ c: '#ffffff', s: 10, pts: [[x, y]] });
        }
        return out;
      }
      default:
        return planet(obj.color || '#ffffff');
    }
  }

  // ───────────────────────────── the room ─────────────────────────────
  class Room {
    constructor({ code, emit, objects = SPACE_OBJECTS }) {
      this.code = code;
      this.emit = emit;
      this.objects = objects;
      this.players = new Map(); // id → player
      this.hostId = null;
      this.settings = { rounds: 1, drawTime: 60 };
      this.resetGame();
    }

    resetGame() {
      this.phase = 'lobby';
      this.order = [];
      this.turnIndex = 0;
      this.drawerId = null;
      this.msLeft = 0;
      this.lastSecond = null;
      this.round = null; // per-turn data
      this.used = new Set();
      this.choices = [];
      for (const p of this.players.values()) {
        Object.assign(p, { score: 0, correct: 0, drawings: 0, guessed: false, ready: p.isBot || p.id === this.hostId });
      }
    }

    // ── players ──
    join(id, { name, avatar, isBot = false } = {}) {
      if (this.players.size >= MAX_PLAYERS) return { error: 'This room is full (max ' + MAX_PLAYERS + ' players).' };
      const clean = String(name || '').trim().slice(0, 16) || 'Astronaut';
      let finalName = clean;
      let n = 2;
      const names = new Set([...this.players.values()].map((p) => p.name.toLowerCase()));
      while (names.has(finalName.toLowerCase())) finalName = clean + ' ' + n++;
      const p = {
        id,
        name: finalName,
        avatar: AVATARS.includes(avatar) || isBot ? avatar : pick(AVATARS),
        isBot,
        score: 0,
        correct: 0,
        drawings: 0,
        guessed: false,
        ready: isBot,
        lastGuessAt: 0,
        lastGuess: '',
        bot: null,
      };
      this.players.set(id, p);
      if (!this.hostId) {
        this.hostId = id;
        p.ready = true;
      }
      if (this.phase !== 'lobby' && this.phase !== 'over') {
        this.order.push(id); // late joiners still get a turn this game
      }
      this.system(`${p.avatar} ${p.name} joined the mission.`);
      this.emit(id, 'sync', { strokes: this.round ? this.round.strokes : [] });
      this.broadcastState();
      return { player: p };
    }

    leave(id) {
      const p = this.players.get(id);
      if (!p) return;
      this.players.delete(id);
      this.order = this.order.filter((x) => x !== id);
      this.system(`${p.name} left the mission.`);
      if (this.hostId === id) {
        const nextHuman = [...this.players.values()].find((x) => !x.isBot);
        this.hostId = nextHuman ? nextHuman.id : null;
        if (nextHuman) {
          nextHuman.ready = true;
          this.system(`${nextHuman.name} is now the host.`);
        }
      }
      const humans = [...this.players.values()].filter((x) => !x.isBot);
      if (!humans.length) {
        this.players.clear();
        return;
      }
      if (this.phase !== 'lobby' && this.phase !== 'over') {
        if (this.players.size < 2) {
          this.system('Not enough players – back to the lobby.');
          this.resetGame();
        } else if (id === this.drawerId && (this.phase === 'drawing' || this.phase === 'choosing')) {
          this.system('The drawer left – revealing the answer.');
          this.endRound();
        } else if (this.phase === 'drawing') {
          this.checkAllGuessed();
        }
      }
      this.broadcastState();
    }

    isEmpty() {
      return ![...this.players.values()].some((p) => !p.isBot);
    }

    addBot(byId) {
      if (byId !== this.hostId) return;
      const used = new Set([...this.players.values()].map((p) => p.name));
      const name = BOT_NAMES.find((n) => !used.has(n)) || 'Space Bot';
      const id = 'bot-' + Math.random().toString(36).slice(2, 8);
      this.join(id, { name, avatar: pick(['🤖', '🛰️', '👽', '☄️']), isBot: true });
    }

    kick(byId, targetId) {
      if (byId !== this.hostId || targetId === byId) return;
      const p = this.players.get(targetId);
      if (!p) return;
      if (!p.isBot) this.emit(targetId, 'kicked', {});
      this.leave(targetId);
    }

    setReady(id, ready) {
      const p = this.players.get(id);
      if (!p || this.phase !== 'lobby') return;
      p.ready = !!ready;
      this.broadcastState();
    }

    updateSettings(id, s = {}) {
      if (id !== this.hostId || this.phase !== 'lobby') return;
      if ([1, 2, 3].includes(Number(s.rounds))) this.settings.rounds = Number(s.rounds);
      if ([45, 60, 90].includes(Number(s.drawTime))) this.settings.drawTime = Number(s.drawTime);
      this.broadcastState();
    }

    // ── game flow ──
    start(id) {
      if (id !== this.hostId) return;
      if (this.phase !== 'lobby' && this.phase !== 'over') return;
      if (this.players.size < 2) return this.emit(id, 'toast', { text: 'You need at least 2 players. Invite a friend or add a Space Bot!' });
      const notReady = [...this.players.values()].filter((p) => !p.ready);
      if (notReady.length) return this.emit(id, 'toast', { text: `Waiting for ${notReady.map((p) => p.name).join(', ')} to be ready.` });
      this.resetGame();
      this.order = shuffle([...this.players.keys()]);
      this.turnIndex = 0;
      this.system('🚀 Mission started! Everyone will take a turn drawing.');
      this.startTurn();
    }

    playAgain(id) {
      if (id !== this.hostId) return;
      this.resetGame();
      this.system('Back in the lobby. Ready up for another mission!');
      this.broadcastState();
    }

    totalTurns() {
      return this.order.length * this.settings.rounds;
    }

    startTurn() {
      // skip players who left
      while (this.turnIndex < this.totalTurns() && !this.players.has(this.order[this.turnIndex % this.order.length])) this.turnIndex++;
      if (this.turnIndex >= this.totalTurns()) return this.finishGame();

      this.drawerId = this.order[this.turnIndex % this.order.length];
      for (const p of this.players.values()) p.guessed = false;
      let pool = this.objects.filter((o) => !this.used.has(o.id));
      if (pool.length < 3) {
        this.used.clear();
        pool = this.objects.slice();
      }
      this.choices = shuffle(pool).slice(0, 3);
      this.round = null;
      this.phase = 'choosing';
      this.msLeft = CHOOSE_TIME * 1000;
      this.emit('all', 'clear', {});
      const drawer = this.players.get(this.drawerId);
      this.system(`✏️ ${drawer.name} is choosing what to draw…`);
      this.emit(this.drawerId, 'choose', {
        choices: this.choices.map((o) => ({ id: o.id, name: o.name, category: o.category, difficulty: o.difficulty, image: o.images[0].src })),
      });
      if (drawer.isBot) setTimeout(() => this.choose(this.drawerId, pick(this.choices).id), 1200);
      this.broadcastState();
    }

    choose(id, objectId) {
      if (this.phase !== 'choosing' || id !== this.drawerId) return;
      const obj = this.choices.find((o) => o.id === objectId) || this.choices[0];
      this.used.add(obj.id);
      const image = pick(obj.images);
      this.round = {
        object: obj,
        image,
        answers: answersFor(obj),
        strokes: [],
        revealed: new Set(),
        clues: [{ type: 'text', label: 'Category', text: obj.category }],
        clueStage: 0,
        guessOrder: [],
        drawerPoints: 0,
        botQueue: [],
        botTimer: 0,
      };
      this.phase = 'drawing';
      this.msLeft = this.settings.drawTime * 1000;
      const drawer = this.players.get(id);
      this.emit(id, 'secret', { object: obj, image });
      this.system(`🎨 ${drawer.name} is drawing! Guess the space object.`);
      this.setupBots();
      this.broadcastState();
    }

    setupBots() {
      const T = this.settings.drawTime;
      const drawer = this.players.get(this.drawerId);
      if (drawer.isBot) {
        // queue drawing ops: each stroke = begin + point chunks
        const q = [];
        buildSketch(this.round.object).forEach((st, i) => {
          const sid = 'b' + i + Math.random().toString(36).slice(2, 6);
          q.push({ k: 'b', id: sid, c: st.c, s: st.s, e: false, x: st.pts[0][0], y: st.pts[0][1] });
          for (let j = 1; j < st.pts.length; j += 3) q.push({ k: 'p', id: sid, pts: st.pts.slice(j, j + 3) });
        });
        this.round.botQueue = q;
      }
      const diff = { easy: 0.35, medium: 0.5, hard: 0.65 }[this.round.object.difficulty] || 0.5;
      for (const p of this.players.values()) {
        if (!p.isBot || p.id === this.drawerId) continue;
        const willGuess = Math.random() < 0.85;
        p.bot = {
          guessAt: willGuess ? T * (diff * 0.6 + Math.random() * 0.45) : Infinity,
          nextWrong: 6 + Math.random() * 10,
        };
      }
    }

    // ── drawing ──
    draw(id, op) {
      if (this.phase !== 'drawing' || id !== this.drawerId || !op || !this.round) return;
      const strokes = this.round.strokes;
      let out = null;
      if (op.k === 'b') {
        const st = { id: String(op.id).slice(0, 20), c: /^#[0-9a-f]{6}$/i.test(op.c) ? op.c : '#ffffff', s: Math.max(1, Math.min(60, Number(op.s) || 6)), e: !!op.e, pts: [[r4(op.x), r4(op.y)]] };
        if (strokes.length > 4000) return;
        strokes.push(st);
        out = { k: 'b', id: st.id, c: st.c, s: st.s, e: st.e, x: st.pts[0][0], y: st.pts[0][1] };
      } else if (op.k === 'p') {
        const st = strokes[strokes.length - 1];
        if (!st || st.id !== op.id || !Array.isArray(op.pts)) return;
        const pts = op.pts.slice(0, 64).map(([x, y]) => [r4(x), r4(y)]);
        if (st.pts.length + pts.length > 3000) return;
        st.pts.push(...pts);
        out = { k: 'p', id: st.id, pts };
      } else if (op.k === 'u') {
        strokes.pop();
        out = { k: 'u' };
      } else if (op.k === 'c') {
        strokes.length = 0;
        out = { k: 'c' };
      }
      if (out) this.emit({ except: id }, 'draw', out);
    }

    // ── chat / guessing ──
    guess(id, rawText) {
      const p = this.players.get(id);
      if (!p) return;
      const text = String(rawText || '').trim().slice(0, 80);
      if (!text) return;
      const now = Date.now();

      if (!p.isBot) {
        if (now - p.lastGuessAt < GUESS_COOLDOWN_MS) return this.emit(id, 'chat', { type: 'warn', text: '⏳ Slow down, cadet! Wait a moment between guesses.' });
        if (normalize(text) === p.lastGuess && this.phase === 'drawing') return this.emit(id, 'chat', { type: 'warn', text: 'You already tried that one.' });
      }
      p.lastGuessAt = now;
      p.lastGuess = normalize(text);

      const msg = { type: 'msg', name: p.name, avatar: p.avatar, text };
      if (this.phase !== 'drawing' || !this.round) return this.emit('all', 'chat', msg);

      const isDrawer = id === this.drawerId;
      const n = normalize(text);
      const hit = this.round.answers.some((a) => a === n || (a.length > 5 && n.length > 5 && n.includes(a)));

      if (isDrawer || p.guessed) {
        // drawer / players who already know the answer must not leak it
        if (hit || this.round.answers.some((a) => n.includes(a))) return this.emit(id, 'chat', { type: 'warn', text: '🤫 No spoilers! Keep the answer secret.' });
        const knowers = [...this.players.values()].filter((x) => x.guessed || x.id === this.drawerId);
        return knowers.forEach((k) => this.emit(k.id, 'chat', { ...msg, type: 'secret' }));
      }

      if (hit) return this.correctGuess(p);

      const close = this.round.answers.some((a) => a.length > 3 && levenshtein(a, n) <= (a.length > 7 ? 2 : 1));
      this.emit('all', 'chat', msg);
      if (close) this.emit(id, 'chat', { type: 'close', text: `🔭 “${text}” is very close!` });
    }

    correctGuess(p) {
      const secLeft = this.msLeft / 1000;
      const points = BASE_POINTS + Math.round(SPEED_BONUS * (secLeft / this.settings.drawTime));
      p.score += points;
      p.correct += 1;
      // Save learning progress through the server callback
if (typeof this.onCorrectGuess === 'function') {
  try {
    this.onCorrectGuess(p, {
      roomCode: this.code,
      turnIndex: this.turnIndex,
      points: points
    });
  } catch (error) {
    console.error('Learning progress save failed:', error);
  }
}
      p.guessed = true;
      this.round.guessOrder.push({ id: p.id, name: p.name, avatar: p.avatar, points });
      const drawer = this.players.get(this.drawerId);
      if (drawer) {
        drawer.score += DRAWER_POINTS_PER_GUESS;
        this.round.drawerPoints += DRAWER_POINTS_PER_GUESS;
      }
      this.emit('all', 'chat', { type: 'correct', text: `✅ ${p.avatar} ${p.name} guessed it! +${points}` });
      this.emit('all', 'score', { id: p.id, points, drawerId: this.drawerId, drawerPoints: DRAWER_POINTS_PER_GUESS });
      // shorten the clock once someone gets it (like classic sketch games)
      const remainingGuessers = this.guessers().filter((x) => !x.guessed).length;
      if (this.round.guessOrder.length === 1 && remainingGuessers > 0 && this.msLeft > 25000) this.msLeft = 25000;
      this.checkAllGuessed();
      this.broadcastState();
    }

    guessers() {
      return [...this.players.values()].filter((p) => p.id !== this.drawerId);
    }

    checkAllGuessed() {
      const g = this.guessers();
      if (g.length && g.every((p) => p.guessed)) {
        this.system('🌟 Everyone guessed it!');
        this.endRound();
      }
    }

    endRound() {
      if (!this.round) {
        // drawer never picked
        const obj = this.choices[0];
        this.round = { object: obj, image: obj.images[0], strokes: [], guessOrder: [], drawerPoints: 0, revealed: new Set(), clues: [] };
      }
      const drawer = this.players.get(this.drawerId);
      if (drawer) drawer.drawings += 1;
      this.phase = 'reveal';
      this.msLeft = REVEAL_TIME * 1000;
      const obj = this.round.object;
      this.system(`🪐 The answer was: ${obj.name}`);
      this.emit('all', 'reveal', {
        object: obj,
        image: this.round.image,
        results: this.round.guessOrder,
        drawer: drawer ? { id: drawer.id, name: drawer.name, avatar: drawer.avatar, points: this.round.drawerPoints } : null,
        isLast: this.turnIndex + 1 >= this.totalTurns(),
      });
      this.broadcastState();
    }

    nextTurn() {
      this.turnIndex += 1;
      this.startTurn();
    }

    finishGame() {
      this.phase = 'over';
      this.drawerId = null;
      this.round = null;
      const board = this.leaderboard();
      this.emit('all', 'over', { leaderboard: board });
      if (board[0]) this.system(`🏆 ${board[0].name} wins the NASA Sky Challenge!`);
      this.broadcastState();
    }

    leaderboard() {
      return [...this.players.values()]
        .map(({ id, name, avatar, score, correct, drawings, isBot }) => ({ id, name, avatar, score, correct, drawings, isBot }))
        .sort((a, b) => b.score - a.score);
    }

    // ── clues (the "image clue" + facts like 9.8 m/s² gravity) ──
    updateClues() {
      const r = this.round;
      const T = this.settings.drawTime;
      const elapsed = T - this.msLeft / 1000;
      const obj = r.object;
      const add = (stage, clue) => {
        if (r.clueStage < stage) {
          r.clueStage = stage;
          r.clues.push(clue);
          this.emit('all', 'chat', { type: 'clue', text: clue.type === 'image' ? '🖼️ Image clue unlocked!' : `💡 Clue: ${clue.text}` });
          return true;
        }
        return false;
      };
      let changed = false;
      if (elapsed >= T * 0.18) changed = add(1, { type: 'text', label: 'Space fact', text: obj.clues[0] }) || changed;
      if (elapsed >= T * 0.35) changed = add(2, { type: 'text', label: 'Clue', text: obj.clues[1] }) || changed;
      if (elapsed >= T * 0.5) changed = add(3, { type: 'image', label: 'Image clue', src: r.image.src }) || changed;
      if (elapsed >= T * 0.68) changed = add(4, { type: 'text', label: 'Big clue', text: obj.clues[2] }) || changed;

      // reveal letters
      const letters = Array.from(obj.name)
        .map((c, i) => (/[a-z0-9]/i.test(c) ? i : -1))
        .filter((i) => i >= 0);
      const want = elapsed >= T * 0.8 ? Math.min(Math.ceil(letters.length * 0.35), letters.length - 1) : elapsed >= T * 0.55 ? Math.min(Math.ceil(letters.length * 0.15), letters.length - 1) : 0;
      while (r.revealed.size < want) {
        const hidden = letters.filter((i) => !r.revealed.has(i));
        r.revealed.add(pick(hidden));
        changed = true;
      }
      return changed;
    }

    // ── bots acting each tick ──
    runBots(dt) {
      const r = this.round;
      const drawer = this.players.get(this.drawerId);
      if (drawer && drawer.isBot && r.botQueue.length) {
        const opsPerSec = Math.max(8, r.botQueue.length / (this.settings.drawTime * 0.4));
        r.botTimer += (dt / 1000) * opsPerSec;
        while (r.botTimer >= 1 && r.botQueue.length) {
          r.botTimer -= 1;
          this.draw(this.drawerId, r.botQueue.shift());
        }
      }
      const elapsed = this.settings.drawTime - this.msLeft / 1000;
      for (const p of this.players.values()) {
        if (!p.isBot || p.guessed || p.id === this.drawerId || !p.bot || this.phase !== 'drawing') continue;
        if (elapsed >= p.bot.guessAt && r.strokes.length > 2) {
          this.guess(p.id, r.object.name);
        } else if (elapsed >= p.bot.nextWrong) {
          p.bot.nextWrong = elapsed + 7 + Math.random() * 10;
          const wrong = pick(this.objects.filter((o) => o.id !== r.object.id && o.category === r.object.category)) || pick(this.objects.filter((o) => o.id !== r.object.id));
          if (wrong) this.guess(p.id, Math.random() < 0.3 ? wrong.name.toLowerCase() + '?' : wrong.name);
        }
      }
    }

    // Host calls this regularly (e.g. every 250 ms).
    tick(dt) {
      if (this.phase === 'lobby' || this.phase === 'over') return;
      this.msLeft -= dt;
      let changed = false;
      if (this.phase === 'drawing' && this.round) {
        this.runBots(dt);
        if (this.phase !== 'drawing') return; // bots may have ended the round
        changed = this.updateClues();
      }
      if (this.msLeft <= 0) {
        if (this.phase === 'choosing') return this.choose(this.drawerId, this.choices[0].id);
        if (this.phase === 'drawing') {
          this.system('⏰ Time’s up!');
          return this.endRound();
        }
        if (this.phase === 'reveal') return this.nextTurn();
      }
      const sec = Math.ceil(this.msLeft / 1000);
      if (sec !== this.lastSecond || changed) {
        this.lastSecond = sec;
        this.broadcastState();
      }
    }

    // ── handle events from the multiplayer server ──
    handleEvent(id, event, payload) {
      try {
        switch (event) {
          case 'ready': {
            const ready = payload && typeof payload === 'object'
              ? payload.ready
              : payload;
            this.setReady(id, ready);
            break;
          }

          case 'addBot':
            this.addBot(id);
            break;

          case 'start':
            this.start(id);
            break;

          case 'playAgain':
          case 'again':
            this.playAgain(id);
            break;

          case 'settings':
          case 'updateSettings':
            this.updateSettings(id, payload || {});
            break;

          case 'choose': {
            const objectId =
              payload && typeof payload === 'object'
                ? (payload.objectId || payload.id)
                : payload;
            this.choose(id, objectId);
            break;
          }

          case 'draw':
            this.draw(id, payload);
            break;

          case 'guess':
            this.guess(
              id,
              payload && typeof payload === 'object'
                ? payload.text
                : payload
            );
            break;

          case 'chat':
            this.guess(
              id,
              payload && typeof payload === 'object'
                ? payload.text
                : payload
            );
            break;

          case 'kick': {
            const targetId =
              payload && typeof payload === 'object'
                ? (payload.targetId || payload.playerId || payload.id)
                : payload;
            this.kick(id, targetId);
            break;
          }

          default:
            this.emit(id, 'error', {
              message: 'Unknown game event: ' + event
            });
        }
      } catch (error) {
        console.error('Game event failed:', event, error);
        this.emit(id, 'error', {
          message: 'Could not process game event: ' + event
        });
      }
    }

    // ── outgoing state ──
    system(text) {
      this.emit('all', 'chat', { type: 'system', text });
    }

    publicState() {
      const r = this.round;
      return {
        code: this.code,
        phase: this.phase,
        hostId: this.hostId,
        drawerId: this.drawerId,
        settings: this.settings,
        timeLeft: Math.max(0, Math.ceil(this.msLeft / 1000)),
        phaseTime: this.phase === 'drawing' ? this.settings.drawTime : this.phase === 'choosing' ? CHOOSE_TIME : REVEAL_TIME,
        turn: Math.min(this.turnIndex + 1, Math.max(1, this.totalTurns())),
        totalTurns: this.totalTurns(),
        round: this.order.length ? Math.floor(this.turnIndex / this.order.length) + 1 : 1,
        totalRounds: this.settings.rounds,
        hint: r && this.phase === 'drawing' ? maskName(r.object.name, r.revealed) : null,
        clues: r && this.phase === 'drawing' ? r.clues : [],
        players: [...this.players.values()].map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isBot: p.isBot,
          score: p.score,
          correct: p.correct,
          drawings: p.drawings,
          guessed: p.guessed,
          ready: p.ready,
        })),
      };
    }

    broadcastState() {
      this.emit('all', 'state', this.publicState());
    }
  }

  function makeRoomCode() {
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 5; i++) s += A[Math.floor(Math.random() * A.length)];
    return s;
  }

  return { Room, makeRoomCode, normalize, AVATARS, SPACE_OBJECTS };
});
