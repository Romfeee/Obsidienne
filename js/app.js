/* =====================================================================
   OBSIDIENNE — film de défilement, sans 3D.
   Vraies photos de bouteilles (img/<key>.webp) + vraies vidéos en fond.
   ===================================================================== */
(function () {
  'use strict';
  var P = window.PRODUCTS || [];
  var MIX = 'https://assets.mixkit.co/videos/';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  /* *mot* -> <em>mot</em>, each word wrapped for the rise-in animation */
  function rich(s, wrap) {
    var html = String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    var parts = html.split(/(\*[^*]+\*)/).filter(Boolean), out = [], n = 0;
    parts.forEach(function (part) {
      var em = part.charAt(0) === '*';
      var txt = em ? part.slice(1, -1) : part;
      if (!wrap) { out.push(em ? '<em>' + txt + '</em>' : txt); return; }
      txt.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { out.push(' '); return; }
        out.push('<span class="w"><span style="transition-delay:' + (n++ * 70) + 'ms">' + (em ? '<em>' + w + '</em>' : w) + '</span></span>');
      });
    });
    return out.join('');
  }
  function statHTML(st) {
    if (!st) return '';
    var num = st.t != null ? st.t : (st.pre || '') + '<span class="cnt" data-n="' + st.n + '">' + st.n + '</span>' + (st.suf || '');
    return '<div class="stat"><div class="num">' + num + '</div><small>' + st.l + '</small></div>';
  }

  /* ---------- video: local file first, then online clip in decreasing quality ---------- */
  function makeVideo(id, local) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
    v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true');
    v.dataset.id = id; v.dataset.local = local;
    return v;
  }
  function arm(v) {
    if (v.dataset.armed) return; v.dataset.armed = '1';
    var id = v.dataset.id, list = [v.dataset.local];
    if (id) {
      if (window.innerWidth > 900) list.push(MIX + id + '/' + id + '-1080.mp4');
      list.push(MIX + id + '/' + id + '-720.mp4', MIX + id + '/' + id + '-360.mp4');
    }
    var i = 0;
    function next() {
      if (i >= list.length) { v.removeAttribute('src'); return; }
      v.src = list[i++]; v.preload = 'auto'; v.load();
      if (v.classList.contains('on') && v._vis) v.play().catch(function () {});
    }
    v.addEventListener('error', next);
    v.addEventListener('playing', function () { v.classList.add('ready'); });
    next();
  }
  function showVideo(vids, idx, visible) {
    vids.forEach(function (v, j) {
      var on = j === idx; v._vis = visible;
      v.classList.toggle('on', on);
      if (on && visible) { arm(v); if (v.paused) v.play().catch(function () {}); }
      else if (!on || !visible) { clearTimeout(v._t); v._t = setTimeout(function () { if (!v.classList.contains('on') || !v._vis) v.pause(); }, 1400); }
    });
  }

  /* ---------- build ---------- */
  var chaptersEl = $('#chapters'), lineup = $('#lineup'), grid = $('#grid'), ticks = $('#ticks');
  $('#ht').textContent = pad(P.length);
  var mail = 'mailto:' + (window.CONTACT || '');
  $('#contact').href = mail; $('#contact2').href = mail;

  var chapters = P.map(function (p, i) {
    var plain = p.name.replace(/\*/g, '');
    var sec = document.createElement('section');
    sec.className = 'chapter'; sec.id = p.key; sec.style.setProperty('--c', p.c); sec.style.setProperty('--s', 1);
    var beats = p.beats.map(function (b, j) {
      var side = j % 2 === 0 ? 'L' : 'R';
      return '<article class="beat ' + side + '">' +
        '<div class="bk"><b>' + pad(j + 1) + '</b><i></i>' + b.k + '</div>' +
        '<h3>' + rich(b.h, true) + '</h3>' +
        (b.p ? '<p>' + rich(b.p) + '</p>' : '') +
        (b.notes ? '<ul class="notes">' + b.notes.map(function (n, k) { return '<li style="transition-delay:' + (250 + k * 90) + 'ms">' + n + '</li>'; }).join('') + '</ul>' : '') +
        (b.serve ? '<div class="serve">' + b.serve + '</div>' : '') +
        statHTML(b.stat) + '</article>';
    }).join('');
    sec.innerHTML =
      '<div class="pin">' +
        '<div class="vids"></div>' +
        '<div class="scrim"><i class="sl"></i><i class="sr"></i></div>' +
        '<div class="bigword">' + (p.word || p.cat) + ' — ' + p.origin + ' — ' + (p.word || p.cat) + '</div>' +
        '<div class="stage"><div class="bottle"><div class="tilt"><div class="drop">' +
          '<div class="glow"></div><div class="float"><img src="img/' + p.key + '.webp" alt="' + plain + '"><div class="sheen"></div></div><div class="floor"></div>' +
        '</div></div></div></div>' +
        '<div class="opener"><div class="top"><div class="num">' + pad(i + 1) + '</div>' +
          '<div class="meta"><b>' + p.cat + '</b><br>' + p.origin + '<br>' + p.deg + ' · ' + p.vol + '</div></div>' +
          '<div><h2>' + rich(p.name, true) + '</h2><div class="sub">' + p.brand + ' — ' + p.origin + '</div></div></div>' +
        beats +
        '<article class="beat R card"><div class="bk"><b>' + pad(p.beats.length + 1) + '</b><i></i>La bouteille</div>' +
          '<h3>' + rich(p.name, true) + '</h3>' +
          '<dl><div><dt>Catégorie</dt><dd>' + p.cat + '</dd></div><div><dt>Origine</dt><dd>' + p.origin + '</dd></div>' +
          '<div><dt>Degré</dt><dd>' + p.deg + '</dd></div><div><dt>Contenance</dt><dd>' + p.vol + '</dd></div></dl>' +
          '<div class="buy"><a class="pill c" href="' + mail + '?subject=' + encodeURIComponent(plain) + '">Se renseigner</a>' +
          (i < P.length - 1 ? '<a class="pill" href="#' + P[i + 1].key + '">Suivante →</a>' : '<a class="pill" href="#collection">La collection →</a>') + '</div></article>' +
      '</div>';
    chaptersEl.appendChild(sec);

    var vwrap = $('.vids', sec);
    var vids = (p.videos || []).map(function (id, j) { var v = makeVideo(id, 'media/' + p.key + '-' + (j + 1) + '.mp4'); vwrap.appendChild(v); return v; });
    var img = $('.float img', sec), sheen = $('.sheen', sec);
    var m = 'url("img/' + p.key + '.webp") center / 100% 100% no-repeat';
    sheen.style.webkitMask = m; sheen.style.mask = m;

    // hero line-up + collection tile + HUD tick
    var b = document.createElement('button'); b.type = 'button'; b.title = plain;
    b.style.transitionDelay = (200 + i * 90) + 'ms,' + (200 + i * 90) + 'ms,0ms';
    b.innerHTML = '<img src="img/' + p.key + '.webp" alt="">'; lineup.appendChild(b);
    var t = document.createElement('a'); t.className = 'tile'; t.href = '#' + p.key; t.style.setProperty('--c', p.c);
    t.innerHTML = '<span class="n">' + pad(i + 1) + '</span><img src="img/' + p.key + '.webp" alt="' + plain + '" loading="lazy">' +
      '<span class="cap"><b>' + plain + '</b><span>' + p.cat + '</span></span>';
    grid.appendChild(t);
    var tk = document.createElement('span'); tk.style.setProperty('--c', p.c); tk.innerHTML = '<em>' + plain + '</em>'; ticks.appendChild(tk);

    return { p: p, sec: sec, vids: vids, img: img, lineBtn: b, tile: t, tick: tk, idx: 0, vis: false, live: -1 };
  });

  // decorative videos for hero + outro
  var heroV = makeVideo(window.HERO_VIDEO, 'media/hero-1.mp4'); $('#hero .vids').appendChild(heroV);
  var outroId = P.length ? (P[P.length - 1].videos || [])[2] : null;
  var outroV = makeVideo(outroId || window.HERO_VIDEO, 'media/outro-1.mp4'); $('#outro .vids').appendChild(outroV);

  /* ---------- loader: wait for the bottle photos, keep real proportions ---------- */
  var imgs = chapters.map(function (c) { return c.img; }), done = 0, bar = $('#loader .lb i');
  function one() { done++; bar.style.transform = 'scaleX(' + done / imgs.length + ')'; if (done >= imgs.length) start(); }
  imgs.forEach(function (im) { if (im.complete) one(); else { im.addEventListener('load', one); im.addEventListener('error', one); } });
  if (!imgs.length) start();

  function start() {
    var maxH = Math.max.apply(null, chapters.map(function (c) { return c.img.naturalHeight || 1; }));
    chapters.forEach(function (c) {
      var s = Math.max(.7, (c.img.naturalHeight || maxH) / maxH);
      [c.sec, c.lineBtn, c.tile].forEach(function (el) { el.style.setProperty('--s', s.toFixed(3)); });
    });
    document.body.classList.remove('loading'); $('#loader').classList.add('off');
    requestAnimationFrame(function () { document.body.classList.add('ready'); $('#hero').classList.add('live'); });
    init();
  }

  /* ---------- scroll engine ---------- */
  function init() {
    gsap.registerPlugin(ScrollTrigger);
    var lenis = null;
    if (window.Lenis && !reduce) {
      lenis = new Lenis({ lerp: .09, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    }
    function go(target) {
      var el = typeof target === 'string' ? $(target) : target; if (!el) return;
      if (lenis) lenis.scrollTo(el, { duration: 1.6 }); else el.scrollIntoView({ behavior: 'smooth' });
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a || a.getAttribute('href') === '#') return;
      e.preventDefault(); go(a.getAttribute('href'));
    });
    chapters.forEach(function (c) {
      c.lineBtn.addEventListener('click', function () { go(c.sec); });
      c.tick.addEventListener('click', function () { go(c.sec); });
    });

    // pointer tilt
    if (!reduce && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        document.documentElement.style.setProperty('--mx', (e.clientX / innerWidth * 2 - 1).toFixed(3));
        document.documentElement.style.setProperty('--my', (e.clientY / innerHeight * 2 - 1).toFixed(3));
      }, { passive: true });
    }

    // hero + outro videos
    [[heroV, '#hero'], [outroV, '#outro']].forEach(function (pair) {
      ScrollTrigger.create({ trigger: pair[1], start: 'top bottom', end: 'bottom top',
        onToggle: function (st) { showVideo([pair[0]], 0, st.isActive); } });
    });
    gsap.to('#lineup', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 35%', scrub: true } });
    gsap.to('#hero .txt', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom 45%', scrub: true } });

    var hud = $('#hud'), hn = $('#hn'), hl = $('#hl'), hbar = $('#hbar');
    ScrollTrigger.create({ trigger: '#chapters', start: 'top 60%', end: 'bottom 40%',
      onToggle: function (st) { hud.classList.toggle('on', st.isActive); },
      onUpdate: function (st) { hbar.style.transform = 'scaleX(' + st.progress.toFixed(4) + ')'; } });
    chapters.forEach(function (c, i) { c.tick.style.left = (i / chapters.length * 100) + '%'; });

    function countUp(beat) {
      $$('.cnt', beat).forEach(function (el) {
        var n = +el.dataset.n, o = { v: n > 400 ? n - 120 : 0 };
        gsap.to(o, { v: n, duration: 1.6, ease: 'power3.out', onUpdate: function () { el.textContent = Math.round(o.v); } });
      });
    }

    var mm = gsap.matchMedia();
    chapters.forEach(function (c, i) {
      var sec = c.sec, bottle = $('.bottle', sec), opener = $('.opener', sec), big = $('.bigword', sec);
      var beats = $$('.beat', sec), sl = $('.sl', sec), sr = $('.sr', sec);
      var CUT = [1.5, 2.5, 3.45];           // timeline times where the scene changes

      function setLive(k) {
        if (c.live === k) return; c.live = k;
        beats.forEach(function (b, j) { var on = j === k; if (on && !b.classList.contains('live')) countUp(b); b.classList.toggle('live', on); });
      }
      function update(time) {
        var idx = time < CUT[0] ? 0 : time < CUT[1] ? 1 : time < CUT[2] ? 2 : 0;
        if (idx !== c.idx) { c.idx = idx; showVideo(c.vids, idx, c.vis); }
        setLive(time < .62 ? -1 : time < CUT[0] ? 0 : time < CUT[1] ? 1 : time < CUT[2] ? 2 : 3);
      }

      // enter / leave: intro animation, video loading, HUD
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 45%',
        onToggle: function (st) {
          sec.classList.toggle('in', st.isActive || st.progress > 0);
          if (st.isActive) { hn.textContent = pad(i + 1); hl.textContent = c.p.name.replace(/\*/g, ''); chapters.forEach(function (o) { o.tick.classList.toggle('on', o === c); }); }
        } });
      ScrollTrigger.create({ trigger: sec, start: 'top 200%', end: 'bottom -100%', onEnter: preload, onEnterBack: preload });
      function preload() { c.vids.forEach(arm); }
      ScrollTrigger.create({ trigger: sec, start: 'top bottom', end: 'bottom top',
        onToggle: function (st) { c.vis = st.isActive; showVideo(c.vids, c.idx, c.vis); } });

      mm.add({ desk: '(min-width:821px)', mob: '(max-width:820px)' }, function (ctx) {
        var desk = ctx.conditions.desk;
        var W = function (f) { return function () { return desk ? window.innerWidth * f : 0; }; };
        var Y = function (f) { return function () { return desk ? 0 : -window.innerHeight * f; }; };
        var sc = function (d, m) { return desk ? d : m; };
        var tl = gsap.timeline({ defaults: { ease: 'power2.inOut' },
          onUpdate: function () { update(this.time()); },
          scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: reduce ? true : .7, invalidateOnRefresh: true } });
        gsap.set(beats, { autoAlpha: 0 });
        tl.fromTo(big, { xPercent: 6 }, { xPercent: -52, duration: 4.3, ease: 'none' }, 0);
        // opener -> beat 1 (bottle goes right)
        tl.to(opener, { autoAlpha: 0, y: -70, duration: .35 }, .42)
          .to(bottle, { x: W(.21), y: Y(.02), scale: sc(.9, .82), rotate: 4, duration: .55 }, .42)
          .to(sl, { opacity: 1, duration: .4 }, .55)
          .fromTo(beats[0], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, .68)
        // beat 1 -> beat 2 (bottle crosses to the left)
          .to(beats[0], { autoAlpha: 0, y: -70, duration: .3 }, 1.38)
          .to(sl, { opacity: 0, duration: .4 }, 1.4)
          .to(bottle, { x: W(-.21), rotate: -4, scale: sc(.96, .82), duration: .6 }, 1.4)
          .to(sr, { opacity: 1, duration: .4 }, 1.55)
          .fromTo(beats[1], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, 1.7)
        // beat 2 -> beat 3
          .to(beats[1], { autoAlpha: 0, y: -70, duration: .3 }, 2.38)
          .to(sr, { opacity: 0, duration: .4 }, 2.4)
          .to(bottle, { x: W(.21), rotate: 4, scale: sc(.9, .82), duration: .6 }, 2.4)
          .to(sl, { opacity: 1, duration: .4 }, 2.55)
          .fromTo(beats[2], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, 2.7)
        // beat 3 -> product card (bottle comes forward, left)
          .to(beats[2], { autoAlpha: 0, y: -70, duration: .3 }, 3.33)
          .to(sl, { opacity: 0, duration: .4 }, 3.35)
          .to(bottle, { x: W(-.19), rotate: 0, scale: sc(1.08, .86), duration: .6 }, 3.35)
          .to(sr, { opacity: 1, duration: .4 }, 3.5)
          .fromTo(beats[3], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, 3.65)
          .to({}, { duration: .3 }, 4);
        return function () { gsap.set([bottle, opener, big, sl, sr].concat(beats), { clearProps: 'all' }); };
      });
    });

    // collection tiles
    gsap.from('#grid .tile', { y: 80, opacity: 0, duration: 1, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: '#grid', start: 'top 82%' } });

    // keyboard: ← → previous / next bottle
    window.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var cur = -1; chapters.forEach(function (c, i) { if (c.sec.getBoundingClientRect().top <= innerHeight * .5) cur = i; });
      var n = Math.max(0, Math.min(chapters.length - 1, cur + (e.key === 'ArrowRight' ? 1 : -1)));
      go(chapters[n].sec);
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
