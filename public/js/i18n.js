/*
 * English / বাংলা switcher.
 *
 *   <span data-i18n="key">English text</span>          -> text
 *   <h1 data-i18n-html="key">English <em>html</em></h1> -> trusted HTML from this file
 *   <input data-i18n-ph="key" placeholder="...">        -> placeholder
 *
 * Add a new string: put it in DICT below (both languages) and tag the element.
 */
(function () {
  'use strict';

  var KEY = 'spaceSkribbleLang';

  var DICT = {
    bn: {
      // navigation
      'nav.objects': 'মহাজাগতিক বস্তু',
      'nav.gravity': 'গ্রাভিটি ল্যাব',
      'nav.distances': 'দূরত্ব',
      'nav.live': 'NASA লাইভ',
      'nav.missions': 'মিশন',
      'nav.howto': 'কীভাবে খেলবে',
      'nav.logout': 'লগ আউট',

      // hero + join card
      'hero.eyebrow': 'NASA স্কাই চ্যালেঞ্জ',
      'hero.title': 'আঁকো <em>মহাবিশ্ব</em>।<br />চিনে নাও আকাশ।',
      'hero.lede': 'মহাকাশ-অভিযাত্রীদের জন্য মাল্টিপ্লেয়ার ড্রয়িং গেম। শনি, ওরিয়ন নীহারিকা বা ISS আঁকো, বন্ধুরা অনুমান করবে। প্রতি রাউন্ডে মিলবে NASA-র আসল তথ্যকার্ড।',
      'hero.stat1': 'মহাজাগতিক বস্তু',
      'hero.stat2': 'প্রতি ছবিতে',
      'hero.stat3': 'পৃথিবীতে m/s²',
      'join.title': 'মিশন শুরু করো',
      'join.name': 'তোমার নভোচারী নাম',
      'join.avatar': 'অ্যাভাটার বেছে নাও',
      'join.create': 'রুম তৈরি করো',
      'join.or': 'অথবা কোড দিয়ে যোগ দাও',
      'join.join': 'রুমে যোগ দাও',
      'join.howto': 'কীভাবে খেলবে →',

      // live NASA section
      'live.eyebrow': 'NASA-র লাইভ ডেটা',
      'live.title': 'আজকের <em>আসল</em> মহাকাশ',
      'live.sub': 'নিচের সব তথ্য এই মুহূর্তে NASA-র সরকারি API থেকে আসছে।',
      'live.apod': 'আজকের মহাকাশ ছবি',
      'live.neo': 'পৃথিবীর কাছ দিয়ে যাওয়া গ্রহাণু',
      'live.exo': 'সর্বশেষ আবিষ্কৃত এক্সোপ্ল্যানেট',
      'live.loading': 'NASA থেকে ডেটা আনা হচ্ছে…',
      'live.error': 'এখন NASA-র সার্ভারে পৌঁছানো যাচ্ছে না। একটু পরে আবার চেষ্টা করো।',

      // login
      'login.eyebrow': 'স্বাগতম, অভিযাত্রী',
      'login.title': 'ফিরে আসার জন্য স্বাগতম',
      'login.desc': 'লগ ইন করে তোমার মহাজাগতিক অভিযান চালিয়ে যাও।',
      'reg.email': 'ইমেইল',
      'login.password': 'পাসওয়ার্ড',
      'login.passwordPh': 'তোমার পাসওয়ার্ড লেখো',
      'login.submit': 'SpaceSkribble-এ লগ ইন',
      'login.new': 'নতুন খেলোয়াড়?',
      'login.create': 'অ্যাকাউন্ট খোলো',

      // register
      'reg.eyebrow': 'মহাবিশ্বে যোগ দাও',
      'reg.title': 'অ্যাকাউন্ট খোলো',
      'reg.desc': 'তোমার মহাকাশ-অভিযান শুরু করো। আঁকো, অনুমান করো, আবিষ্কার করো!',
      'reg.name': 'খেলোয়াড়ের নাম',
      'reg.namePh': 'তোমার খেলোয়াড় নাম লেখো',
      'reg.passwordPh': 'কমপক্ষে ৬ অক্ষর',
      'reg.question': 'নিরাপত্তা প্রশ্ন',
      'reg.questionPh': 'একটি নিরাপত্তা প্রশ্ন বেছে নাও',
      'reg.answer': 'নিরাপত্তা প্রশ্নের উত্তর',
      'reg.answerPh': 'তোমার উত্তর লেখো',
      'reg.submit': 'অ্যাকাউন্ট খোলো',
      'reg.already': 'আগেই অ্যাকাউন্ট আছে?',
      'reg.login': 'এখানে লগ ইন করো',

      // missions section
      'ms.eyebrow': 'শেখো · খেলো · আবিষ্কার করো',
      'ms.title': 'আঁকার বাইরেও <em>মিশন</em>',
      'ms.sub': 'ক্লাসরুম, নাগরিক বিজ্ঞান, স্মার্ট রিভিশন আর আসল আকাশ দেখার জন্য।',
      'ms.class': 'ক্লাসরুম মোড',
      'ms.class.p': 'শিক্ষক টপিক বেছে অ্যাসাইনমেন্ট লিংক শেয়ার করেন। শিক্ষার্থীরা কুইজ দিয়ে রিপোর্ট কোড পাঠায়, শিক্ষক পুরো ক্লাসের ফল দেখেন।',
      'ms.sci': 'সিটিজেন সায়েন্স মিশন',
      'ms.sci.p': 'NASA-র আসল ছবি দেখে শ্রেণিবিন্যাস করো, যেমন গ্যালাক্সির আকার বা চাঁদের গর্ত।',
      'ms.rev': 'অ্যাডাপটিভ রিভিশন',
      'ms.rev.p': 'যে টপিকে ভুল হয় সেগুলো মনে রাখি, আর সেগুলো নিয়ে রিভিশন রাউন্ড বানাই।',
      'ms.ar': 'AR আকাশ মোড',
      'ms.ar.p': 'ফোনের ক্যামেরা আকাশের দিকে ধরো, এখন মাথার উপরে থাকা সূর্য, চাঁদ আর গ্রহের লেবেল দেখো।',
      'ms.open': 'খোলো',

      'auth.loggingIn': 'লগ ইন হচ্ছে…',
      'auth.creating': 'অ্যাকাউন্ট তৈরি হচ্ছে…',
      'auth.welcome': 'স্বাগতম',
      'auth.launching': 'মিশন শুরু হচ্ছে…'
    }
  };

  var lang = 'en';
  try { lang = localStorage.getItem(KEY) === 'bn' ? 'bn' : 'en'; } catch (e) {}

  // Remember the original English text so we can switch back.
  function remember(el, attr, value) {
    if (!el.hasAttribute('data-en-' + attr)) el.setAttribute('data-en-' + attr, value);
    return el.getAttribute('data-en-' + attr);
  }

  function apply() {
    document.documentElement.lang = lang;
    var bn = DICT.bn;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var en = remember(el, 'text', el.textContent);
      el.textContent = lang === 'bn' && bn[el.dataset.i18n] ? bn[el.dataset.i18n] : en;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var en = remember(el, 'html', el.innerHTML);
      el.innerHTML = lang === 'bn' && bn[el.dataset.i18nHtml] ? bn[el.dataset.i18nHtml] : en;
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var en = remember(el, 'ph', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', lang === 'bn' && bn[el.dataset.i18nPh] ? bn[el.dataset.i18nPh] : en);
    });

    var btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.textContent = lang === 'bn' ? 'English' : 'বাংলা';
      btn.setAttribute('aria-label', lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখো');
    }
    document.dispatchEvent(new CustomEvent('ss:lang', { detail: lang }));
  }

  function setLang(next) {
    lang = next === 'bn' ? 'bn' : 'en';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    apply();
  }

  function mountToggle() {
    if (document.getElementById('lang-toggle')) return;
    var btn = document.createElement('button');
    btn.id = 'lang-toggle';
    btn.type = 'button';
    btn.className = 'lang-toggle';
    btn.addEventListener('click', function () { setLang(lang === 'bn' ? 'en' : 'bn'); });
    var nav = document.querySelector('.topnav-links');
    if (nav) nav.appendChild(btn);
    else document.body.appendChild(btn); // login / register pages: floating pill
  }

  window.SSLang = {
    // other scripts add their own Bangla strings: SSLang.extend({ 'key': 'বাংলা' })
    extend: function (more) { Object.assign(DICT.bn, more); },
    refresh: apply,
    get: function () { return lang; },
    set: setLang,
    t: function (key, fallback) { return lang === 'bn' && DICT.bn[key] ? DICT.bn[key] : fallback; }
  };

  function init() { mountToggle(); apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
