/* Shared scripts for every page */

/* ---------- Theme toggle ---------- */
(function () {
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');
  if (!btn) return;
  var mq = window.matchMedia('(prefers-color-scheme: dark)');
  function current() { return root.getAttribute('data-theme') || (mq.matches ? 'dark' : 'light'); }
  function sync() {
    var t = current();
    root.setAttribute('data-theme', t);
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  btn.addEventListener('click', function () {
    var next = current() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
  sync();
})();

/* ---------- Hamburger menu ---------- */
(function () {
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (!btn || !nav) return;
  var mq = window.matchMedia('(max-width: 720px)');
  function setOpen(open, returnFocus) {
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav.hidden = !open;
    if (!open && returnFocus) btn.focus();
  }
  function applyMode() {
    if (mq.matches) { setOpen(false); } else { nav.hidden = false; btn.setAttribute('aria-expanded', 'false'); }
  }
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') !== 'true';
    setOpen(open);
    if (open) { var first = nav.querySelector('a'); if (first) first.focus(); }
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a') && mq.matches) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mq.matches && btn.getAttribute('aria-expanded') === 'true') setOpen(false, true);
  });
  document.addEventListener('click', function (e) {
    if (mq.matches && btn.getAttribute('aria-expanded') === 'true' && !e.target.closest('.site-header')) setOpen(false);
  });
  mq.addEventListener('change', applyMode);
  applyMode();
  nav.setAttribute('data-ready', '');
})();

/* ---------- Expandable quotes ---------- */
document.querySelectorAll('.more-toggle').forEach(function (btn) {
  var targets = document.querySelectorAll('[data-more="' + btn.getAttribute('aria-controls') + '"]');
  var label = btn.querySelector('.more-label');
  targets.forEach(function (t) { t.hidden = true; });
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    targets.forEach(function (t) { t.hidden = !open; });
    label.textContent = open ? 'Show less' : 'Read more';
  });
});

/* ---------- Click to load YouTube ---------- */
document.querySelectorAll('.video').forEach(function (box) {
  var btn = box.querySelector('.video-play');
  btn.addEventListener('click', function () {
    var id = (box.getAttribute('data-youtube-id') || '').trim();
    if (!id) return;
    var frame = document.createElement('iframe');
    frame.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0' + (location.protocol.indexOf('http') === 0 ? '&origin=' + encodeURIComponent(location.origin) : '');
    frame.title = (box.getAttribute('data-title') || 'Film') + ', YouTube video player';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    // YouTube needs to see where the video is embedded, or it shows error 153
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    box.replaceChild(frame, btn);
    frame.focus();
  });
});

/* ---------- Quiz ---------- */
(function () {
  var card = document.getElementById('quiz-card');
  if (!card) return;
  var questions = [
    { q: 'Where did I study film?',
      options: ['University of Kent', 'University of Leeds', 'Goldsmiths'], answer: 0,
      right: 'Correct, I studied Film Studies at the University of Kent, with modules in Script Writing and Documentary Filmmaking.' },
    { q: 'At ChilliPharm, what were the video services team genuinely called in the system?',
      options: ['Power Editors', 'Video Admins', 'Super Duper Users'], answer: 2,
      right: 'Correct. I am not joking, they really were called Super Duper Users.' },
    { q: 'How many questions are in the hand curated Quizzy McQuizface question bank?',
      options: ['313', '3,130', '31,300'], answer: 1,
      right: 'Correct, there are 3,130 questions across 13 categories, so most rounds need no AI at all.' }
  ];
  var i = 0, score = 0;

  function render() {
    var item = questions[i];
    var html = '<p class="label quiz-progress" id="quiz-progress" tabindex="-1">Question ' + (i + 1) + ' of ' + questions.length + '</p>' +
      '<fieldset><legend>' + item.q + '</legend><div class="options">';
    item.options.forEach(function (opt, n) {
      html += '<label class="option"><input type="radio" name="q' + i + '" value="' + n + '"><span>' + opt + '</span></label>';
    });
    html += '</div></fieldset><p class="quiz-feedback" id="quiz-feedback" aria-live="polite"></p>' +
      '<div class="quiz-actions"><button class="btn btn-filled" type="button" id="quiz-check">Check answer</button></div>';
    card.innerHTML = html;
    document.getElementById('quiz-check').addEventListener('click', check);
  }

  function check() {
    var item = questions[i];
    var picked = card.querySelector('input[name="q' + i + '"]:checked');
    var fb = document.getElementById('quiz-feedback');
    if (!picked) { fb.textContent = 'Choose an answer first, then check it.'; return; }
    var inputs = card.querySelectorAll('input[type="radio"]');
    inputs.forEach(function (inp) { inp.disabled = true; });
    inputs[item.answer].closest('.option').classList.add('is-correct');
    if (Number(picked.value) === item.answer) { score++; fb.textContent = item.right; }
    else { fb.textContent = 'Not quite. The answer is ' + item.options[item.answer] + '.'; }
    var last = i === questions.length - 1;
    card.querySelector('.quiz-actions').innerHTML = '<button class="btn btn-filled" type="button" id="quiz-next">' + (last ? 'See your score' : 'Next question') + '</button>';
    var next = document.getElementById('quiz-next');
    next.addEventListener('click', function () {
      if (last) { result(); } else { i++; render(); document.getElementById('quiz-progress').focus(); }
    });
    next.focus();
  }

  function result() {
    var msg = score === questions.length ? 'A perfect score. We should probably be friends.'
            : score === 0 ? 'Not a single one, but now you know three new things about me.'
            : 'Not bad at all. Have a look around and you will get full marks next time.';
    card.innerHTML = '<div class="quiz-result"><p class="headline" id="quiz-score" tabindex="-1">You scored ' + score + ' out of ' + questions.length + '</p>' +
      '<p class="body-lg">' + msg + '</p><div class="quiz-actions"><button class="btn btn-tonal" type="button" id="quiz-again">Play again</button></div></div>';
    document.getElementById('quiz-score').focus();
    document.getElementById('quiz-again').addEventListener('click', function () {
      i = 0; score = 0; render(); document.getElementById('quiz-progress').focus();
    });
  }
  render();
})();

/* ---------- Case study: section nav highlights where you are ---------- */
(function () {
  var links = document.querySelectorAll('.section-nav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var map = {};
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  var visible = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
    var current = null;
    Object.keys(map).forEach(function (id) { if (!current && visible[id]) current = id; });
    if (!current) return;
    links.forEach(function (a) { a.removeAttribute('aria-current'); });
    map[current].setAttribute('aria-current', 'true');
    var nav = map[current].closest('ul');
    var l = map[current];
    if (nav && (l.offsetLeft < nav.scrollLeft || l.offsetLeft + l.offsetWidth > nav.scrollLeft + nav.clientWidth)) {
      nav.scrollTo({ left: l.offsetLeft - 16, behavior: 'smooth' });
    }
  }, { rootMargin: '-35% 0px -60% 0px' });
  Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) io.observe(el); });
})();

/* ---------- Case study: click to load Figma prototype ---------- */
document.querySelectorAll('.proto').forEach(function (box) {
  var btn = box.querySelector('.proto-play');
  if (!btn) return;
  btn.addEventListener('click', function () {
    var url = box.getAttribute('data-figma-url');
    var local = box.getAttribute('data-src');
    var frame = document.createElement('iframe');
    frame.src = local ? local : 'https://www.figma.com/embed?embed_host=cameronhasan&url=' + encodeURIComponent(url);
    frame.title = box.getAttribute('data-title') || 'Interactive Figma prototype';
    frame.allowFullscreen = true;
    box.replaceChild(frame, btn);
    frame.focus();
  });
});

/* ---------- Case study: enlarge images in an accessible dialog ---------- */
(function () {
  var buttons = document.querySelectorAll('.zoom-btn');
  if (!buttons.length) return;
  var dlg = document.createElement('dialog');
  dlg.className = 'lightbox';
  dlg.setAttribute('aria-labelledby', 'lightbox-title');
  dlg.innerHTML = '<div class="lightbox-inner"><div class="lightbox-bar"><p class="title-md" id="lightbox-title" style="margin:0"></p>' +
    '<button class="icon-btn lightbox-close" type="button" aria-label="Close enlarged image"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M6.4 19 5 17.6 10.6 12 5 6.4 6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19Z"/></svg></button></div>' +
    '<div class="lightbox-body"></div></div>';
  document.body.appendChild(dlg);
  var body = dlg.querySelector('.lightbox-body');
  /* Focusable so tall images can be scrolled with the keyboard */
  body.setAttribute('tabindex', '0');
  body.setAttribute('role', 'region');
  body.setAttribute('aria-label', 'Enlarged image');
  var lastBtn = null;
  dlg.querySelector('.lightbox-close').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', function () { body.innerHTML = ''; if (lastBtn) lastBtn.focus(); });
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      body.innerHTML = '';
      var full = b.getAttribute('data-full');
      if (full) {
        /* A button that opens a separate, full size image (the home portrait) */
        var img = document.createElement('img');
        img.src = full;
        img.alt = b.getAttribute('data-alt') || '';
        img.className = 'full-photo';
        dlg.querySelector('#lightbox-title').textContent = b.getAttribute('data-title') || 'Enlarged image';
        body.appendChild(img);
      } else {
        var fig = b.closest('figure');
        var media = fig.querySelector('img, .ph');
        var cap = fig.querySelector('figcaption');
        dlg.querySelector('#lightbox-title').textContent = cap ? cap.textContent : 'Enlarged image';
        var clone = media.cloneNode(true);
        clone.removeAttribute('id');
        body.appendChild(clone);
      }
      lastBtn = b;
      dlg.showModal();
    });
  });
})();

/* ---------- Quizzy: scoring slider ---------- */
document.querySelectorAll('.scorer').forEach(function (box) {
  var input = box.querySelector('input[type="range"]');
  var pts = box.querySelector('[data-points]');
  var timer = box.querySelector('.timer');
  var limit = Number(input.max) || 15;
  function update() {
    var t = Number(input.value);
    var points = Math.max(100, Math.round(500 - (t / limit) * 400));
    pts.textContent = points;
    var left = limit - t;
    timer.textContent = left + (left === 1 ? ' second' : ' seconds') + ' left on the clock';
    timer.classList.toggle('low', left <= 5);
    input.setAttribute('aria-valuetext', t + ' seconds, ' + points + ' points');
  }
  input.addEventListener('input', update);
  update();
});

/* ---------- Tabs (BA key screens) ----------
   Without JavaScript every panel shows, one after another. */
document.querySelectorAll('[data-tabs]').forEach(function (wrap) {
  var tabs = Array.prototype.slice.call(wrap.querySelectorAll('[role="tab"]'));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });
  select(tabs.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || tabs[0], false);
});

/* ---------- Hero highlight reel (Quizzy) ----------
   Silent, loops, plays on its own unless reduced motion is set.
   A visible button pauses and plays it (WCAG 2.2.2). */
document.querySelectorAll('.hero-reel').forEach(function (wrap) {
  var video = wrap.querySelector('video');
  var btn = wrap.querySelector('.reel-toggle');
  if (!video || !btn) return;
  function sync() {
    var playing = !video.paused;
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    btn.setAttribute('aria-label', playing ? 'Pause the highlight reel' : 'Play the highlight reel');
  }
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  btn.addEventListener('click', function () {
    if (video.paused) { video.play().catch(function () {}); } else { video.pause(); }
  });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) { video.play().catch(sync); }
  sync();
});

/* ---------- Case studies: sticky section nav matches the band beneath it ---------- */
(function () {
  var nav = document.querySelector('.section-nav');
  if (!nav) return;
  var bands = Array.prototype.slice.call(document.querySelectorAll('main > section.cs-section[id]'));
  var ticking = false;
  function update() {
    ticking = false;
    var y = nav.getBoundingClientRect().bottom;
    var over = null;
    bands.forEach(function (s) { var r = s.getBoundingClientRect(); if (r.top <= y && r.bottom > y) over = s; });
    nav.classList.toggle('on-band', !!(over && getComputedStyle(over).backgroundColor !== getComputedStyle(document.body).backgroundColor && over.matches(':nth-of-type(even)')));
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();
