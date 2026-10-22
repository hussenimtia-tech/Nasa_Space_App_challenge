/*
 * SpaceSkribble – auth flow
 * Flow: login.html -> (no account?) register.html -> auto login -> index.html
 * Works with auto-server.js (POST /register, POST /login on port 3001).
 * Token is saved in localStorage under "spaceSkribbleUser" (same key app.js / profile.js read).
 */
(() => {
  'use strict';

  // ---- settings -------------------------------------------------------
  const REQUIRE_LOGIN = true; // false = guests may open index.html without logging in
  const KEY = 'spaceSkribbleUser';
  const API =
    window.SS_API ||
    (location.protocol === 'file:'
      ? 'http://localhost:3001'
      : `${location.protocol}//${location.hostname}:3001`);

  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLoginPage = file === 'login.html';
  const isRegisterPage = file === 'register.html';
  const isAuthPage = isLoginPage || isRegisterPage;
  const isHome = file === 'index.html' || file === '';
  const isProfile = file === 'profile.html';
  const $ = (id) => document.getElementById(id);

  // ---- storage helpers --------------------------------------------------
  function decodeJwt(token) {
    try {
      const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b + '='.repeat((4 - (b.length % 4)) % 4)));
    } catch {
      return null;
    }
  }

  function clearUser() {
    try { localStorage.removeItem(KEY); } catch {}
    try { sessionStorage.removeItem(KEY); } catch {}
  }

  function getUser() {
    for (const store of [localStorage, sessionStorage]) {
      try {
        const u = JSON.parse(store.getItem(KEY) || 'null');
        if (!u || typeof u.token !== 'string' || !u.token) continue;
        const p = decodeJwt(u.token);
        if (p && p.exp && p.exp * 1000 < Date.now()) { clearUser(); return null; } // expired
        return u;
      } catch {}
    }
    return null;
  }

  function saveUser(token, user) {
    const data = { token, id: user.id, name: user.name, email: user.email, user };
    localStorage.setItem(KEY, JSON.stringify(data));
    try {
      localStorage.setItem('ss-name', user.name);
    } catch {}
  }

  function logout() {
    clearUser();
    location.href = './login.html';
  }

  // ---- redirect helpers ---------------------------------------------------
  function safeNext() {
    const n = new URLSearchParams(location.search).get('next') || '';
    // only same-site relative paths like "index.html?room=ABCDE"
    return /^[a-z0-9_\-./?=&%]+$/i.test(n) && !n.includes('//') && !n.includes(':') ? './' + n.replace(/^\.?\//, '') : './index.html';
  }

  function goLogin() {
    const here = (location.pathname.split('/').pop() || 'index.html') + location.search;
    location.replace('./login.html?next=' + encodeURIComponent(here));
  }

  const user = getUser();

  // ---- guards ---------------------------------------------------------------
  if (isAuthPage && user) {
    location.replace(safeNext());
    return;
  }
  if ((isHome && REQUIRE_LOGIN || isProfile) && !user) {
    goLogin();
    return;
  }

  // ---- UI: navbar on home page -------------------------------------------------
  function updateNav() {
    const l = $('login-link'), r = $('register-link'), p = $('profile-link');
    const on = !!user;
    if (l) l.hidden = on;
    if (r) r.hidden = on;
    if (p) p.hidden = !on;
    if (on && p) p.title = user.name || 'My Profile';
    const nameInput = $('name-input');
    if (on && nameInput && !nameInput.value && user.name) nameInput.value = String(user.name).slice(0, 16);
  }

  // ---- UI: messages ---------------------------------------------------------------
  const msgEl = $('auth-message');
  function say(text, ok = false) {
    if (!msgEl) return;
    msgEl.textContent = text;
    msgEl.style.color = ok ? '#06d6a0' : '#ff8a9b';
  }
  function busy(form, b, label) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    btn.disabled = b;
    if (label) btn.textContent = label;
  }

  async function api(path, body) {
    let res;
    try {
      res = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('Cannot reach the server. Start it with: node auto-server.js (port 3001).');
    }
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      const err = new Error(data.message || 'Something went wrong. Please try again.');
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ---- login page --------------------------------------------------------------------
  const loginForm = $('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('login-email').value.trim();
      const password = $('login-password').value;
      if (!email || !password) return say('Enter your email and password.');
      busy(loginForm, true, 'Logging in…');
      say('Checking your account…', true);
      try {
        const data = await api('/login', { email, password });
        saveUser(data.token, data.user);
        say('Welcome back, ' + data.user.name + '! Opening SpaceSkribble…', true);
        setTimeout(() => location.replace(safeNext()), 700);
      } catch (err) {
        if (err.status === 401) {
          say('Wrong email or password. No account yet? Use "Create an account" below.');
        } else say(err.message);
        busy(loginForm, false, 'Login to SpaceSkribble');
      }
    });
  }

  // ---- register page ---------------------------------------------------------------------
  const regForm = $('register-form');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('reg-name').value.trim();
      const email = $('reg-email').value.trim();
      const password = $('reg-password').value;
      const question = $('security-question').value;
      const answer = $('security-answer').value.trim();
      if (!name || !email || !password || !question || !answer) return say('Fill in all fields.');
      if (password.length < 6) return say('Password must be at least 6 characters.');
      busy(regForm, true, 'Creating account…');
      say('Creating your account…', true);
      try {
        await api('/register', { name, email, password, question, answer });
        say('Account created! Logging you in…', true);
        try {
          const data = await api('/login', { email, password });
          saveUser(data.token, data.user);
          say('All set, ' + data.user.name + '! Opening SpaceSkribble…', true);
          setTimeout(() => location.replace(safeNext()), 800);
        } catch {
          say('Account created. Please log in.', true);
          setTimeout(() => location.replace('./login.html'), 1000);
        }
      } catch (err) {
        say(err.status === 409 ? 'This email is already registered. Try logging in instead.' : err.message);
        busy(regForm, false, 'Create Account');
      }
    });
  }

  // ---- common --------------------------------------------------------------------------------
  const logoutBtn = $('logout-button');
  if (logoutBtn) logoutBtn.addEventListener('click', logout);

  const start = () => { if (isHome) updateNav(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.SSAuth = { getUser, logout, saveUser };
})();
