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


  /* ---------- relief: the real photo wrapped on its own outline (no 3D model) ----------
     Each row of the photo is treated as a slice of a round flacon: turning by an angle
     slides the label around the glass and moves a highlight, like a bottle turned in the hand. */
  var VS = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var FS = 'precision highp float;varying vec2 v;uniform sampler2D T,Pf;uniform float th,lt,N;' +
    'vec2 dec(vec4 a){return vec2(a.r*65280.+a.g*255.,a.b*65280.+a.a*255.)/65535.;}' +
    'vec2 prof(float y){float fy=y*(N-1.);float i=floor(fy);float f=fy-i;' +
    'return mix(dec(texture2D(Pf,vec2(.5,(i+.5)/N))),dec(texture2D(Pf,vec2(.5,(min(i+1.,N-1.)+.5)/N))),f);}' +
    'void main(){vec4 o=texture2D(T,v);vec2 lr=prof(1.-v.y);float c=(lr.x+lr.y)*.5;float hw=max((lr.y-lr.x)*.5,.0005);' +
    'float u=(v.x-c)/hw;vec3 col=o.rgb;' +
    'if(abs(u)<1.){float uu=clamp(u,-.999,.999);float u2=sin(clamp(asin(uu)-th,-1.45,1.45));' +
    'vec4 s=texture2D(T,vec2(c+u2*hw,v.y));float k=smoothstep(1.,.8,abs(u))*step(.6,s.a);col=mix(o.rgb,s.rgb,k);' +
    'float nz=sqrt(1.-uu*uu);float sp=pow(max(0.,uu*sin(lt)+nz*cos(lt)),30.)*.34;float rim=pow(1.-nz,3.)*.22;' +
    'col=col*(1.-rim)+sp*vec3(1.,.97,.9);}' +
    'gl_FragColor=vec4(col*o.a,o.a);}';
  function makeRelief(holder, asset) {
    if (!asset || reduce) return null;
    var cv = document.createElement('canvas'); cv.width = asset.w; cv.height = asset.h;
    var gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return null;
    function sh(t, src) { var o = gl.createShader(t); gl.shaderSource(o, src); gl.compileShader(o); return o; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return null;
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    function tex(unit) { var t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; }
    var n = asset.prof.length / 2, data = new Uint8Array(n * 4);
    for (var i = 0; i < n; i++) { var l = asset.prof[2 * i], r = asset.prof[2 * i + 1]; data[4 * i] = l >> 8; data[4 * i + 1] = l & 255; data[4 * i + 2] = r >> 8; data[4 * i + 3] = r & 255; }
    tex(1); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.uniform1i(gl.getUniformLocation(pr, 'T'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'Pf'), 1); gl.uniform1f(gl.getUniformLocation(pr, 'N'), n);
    var uTh = gl.getUniformLocation(pr, 'th'), uLt = gl.getUniformLocation(pr, 'lt');
    var R = { ready: false, draw: function (th, lt) { if (!R.ready) return; gl.uniform1f(uTh, th); gl.uniform1f(uLt, lt); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); } };
    var im = new Image();
    im.onload = function () {
      try {
        tex(0); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0);
        R.ready = true; R.draw(0, .5); holder.appendChild(cv); holder.classList.add('gl');
      } catch (e) { /* keep the plain photo */ }
    };
    im.src = asset.src;
    cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); R.ready = false; holder.classList.remove('gl'); });
    return R;
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

    var relief = makeRelief($('.float', sec), (window.ASSETS || {})[p.key]);
    return { p: p, sec: sec, vids: vids, img: img, lineBtn: b, tile: t, tick: tk, idx: 0, vis: false, live: -1, relief: relief, spin: 0, th: 0 };
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

    var ptr = 0;
    // pointer tilt
    if (!reduce && window.matchMedia('(pointer:fine)').matches) {
      window.addEventListener('pointermove', function (e) {
        ptr = e.clientX / innerWidth * 2 - 1;
        document.documentElement.style.setProperty('--mx', ptr.toFixed(3));
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
          .to(c, { spin: -1, duration: .7 }, .35)
          .to(sl, { opacity: 1, duration: .4 }, .55)
          .fromTo(beats[0], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, .68)
        // beat 1 -> beat 2 (bottle crosses to the left)
          .to(beats[0], { autoAlpha: 0, y: -70, duration: .3 }, 1.38)
          .to(sl, { opacity: 0, duration: .4 }, 1.4)
          .to(bottle, { x: W(-.21), rotate: -4, scale: sc(.96, .82), duration: .6 }, 1.4)
          .to(c, { spin: 1, duration: .8 }, 1.3)
          .to(sr, { opacity: 1, duration: .4 }, 1.55)
          .fromTo(beats[1], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, 1.7)
        // beat 2 -> beat 3
          .to(beats[1], { autoAlpha: 0, y: -70, duration: .3 }, 2.38)
          .to(sr, { opacity: 0, duration: .4 }, 2.4)
          .to(bottle, { x: W(.21), rotate: 4, scale: sc(.9, .82), duration: .6 }, 2.4)
          .to(c, { spin: -1, duration: .8 }, 2.3)
          .to(sl, { opacity: 1, duration: .4 }, 2.55)
          .fromTo(beats[2], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, 2.7)
        // beat 3 -> product card (bottle comes forward, left)
          .to(beats[2], { autoAlpha: 0, y: -70, duration: .3 }, 3.33)
          .to(sl, { opacity: 0, duration: .4 }, 3.35)
          .to(bottle, { x: W(-.19), rotate: 0, scale: sc(1.08, .86), duration: .6 }, 3.35)
          .to(c, { spin: .35, duration: .8 }, 3.25)
          .to(sr, { opacity: 1, duration: .4 }, 3.5)
          .fromTo(beats[3], { autoAlpha: 0, y: 70 }, { autoAlpha: 1, y: 0, duration: .35 }, 3.65)
          .to({}, { duration: .3 }, 4);
        return function () { c.spin = 0; gsap.set([bottle, opener, big, sl, sr].concat(beats), { clearProps: 'all' }); };
      });
    });


    // relief render loop: only the chapter on screen is drawn
    gsap.ticker.add(function (t) {
      for (var i = 0; i < chapters.length; i++) {
        var c = chapters[i]; if (!c.relief || !c.vis) continue;
        var rot = c.p.rot || .4;
        var aim = Math.max(-1, Math.min(1, c.spin * .75 + ptr * .55 + Math.sin(t * .55 + i) * .16)) * rot * .6;
        c.th += (aim - c.th) * .08;
        c.relief.draw(c.th, .55 - c.th * 2.4 + ptr * .5);
      }
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
