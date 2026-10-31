(function () {
  'use strict';

  /* after a reload, always start from the first screen (links with #section still work) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  var isHome = !!document.getElementById('hero');
  var navType = '';
  try { navType = (performance.getEntriesByType('navigation')[0] || {}).type || ''; } catch (e) {}
  var returnY = null;
  if (isHome) { try { returnY = sessionStorage.getItem('ak-return'); sessionStorage.removeItem('ak-return'); } catch (e) {} }
  function jump(y) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
  if (isHome && returnY !== null && navType !== 'reload') {
    /* came back from a case page: open where the visitor clicked "Read the case" */
    var y = parseInt(returnY, 10) || 0;
    jump(y);
    requestAnimationFrame(function () { jump(y); });
    window.addEventListener('load', function () { jump(y); });
  } else if (!location.hash) {
    jump(0);
  }
  if (isHome) {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href$="parkovkin.html"], a[href$="vibrate-higher.html"]');
      if (a) { try { sessionStorage.setItem('ak-return', String(Math.round(window.scrollY))); } catch (err) {} }
    });
  }

  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= NO HANGING SHORT WORDS =================
     glues short words (a, the, of, into...) to the next word,
     so they never stay alone at the end of a line */
  (function () {
    var re = /(^|[\s(«"“])(a|an|the|and|or|nor|but|of|in|on|at|to|by|for|with|from|into|onto|as|is|are|was|my|our|its|no|via|I)\s+/gi;
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p || p.closest('script, style, .crowd, .mono')) return NodeFilter.FILTER_REJECT;
        return /\S/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (t) {
      var v = t.nodeValue, prev;
      do { prev = v; v = v.replace(re, '$1$2\u00A0'); } while (v !== prev);
      t.nodeValue = v;
    });
  })();

  /* ================= CROWD ================= */
  var phrases = [
    'parking map nobody knew about','charity posters','first clients','small studios',
    'startups with no name yet','handmade zines','neighborhood bakery','street musicians',
    'indie film crew','second-hand bookshop','poetry open mic','cat shelter','repair café',
    'youth coding club','mural painters','tiny gallery','street library','wildlife rescue',
    'open-source tools','community choir','seed library','rooftop cinema','free pantry',
    'teenage astronomer','night bus map',"ceramicist's pop-up",'podcast about silence',
    'language exchange club','zero-waste blog','local history archive','bike co-op',
    'sustainable fashion label','independent radio','after-school tutors','community fridge',
    'family workshop','unsigned bands','first exhibition','app with ten users','self-published book'
  ];
  var highlights = ['Parkovkin','Vibrate Higher','Brief Builder','Silence of Nature','Nochlezhka'];

  var hero = document.getElementById('hero');
  var back = document.getElementById('crowdBack');
  var front = document.getElementById('crowdFront');
  var content = document.getElementById('heroContent');
  var hint = document.getElementById('heroHint');

  var bag = [];
  function rand(a) {
    /* shuffled deck: no phrase repeats until all were used */
    if (!bag.length) {
      bag = a.slice();
      for (var i = bag.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)); var t = bag[i]; bag[i] = bag[k]; bag[k] = t; }
    }
    return bag.pop();
  }

  function buildCrowd() {
    if (!hero || !back || !front) return;
    back.innerHTML = '';
    var limit = hero.clientHeight;
    var guard = 0;
    /* add phrases until the whole screen is filled */
    while (back.scrollHeight <= limit + 20 && guard < 1500) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < 25; i++) {
        var s = document.createElement('span');
        s.textContent = rand(phrases);
        frag.appendChild(s);
        frag.appendChild(document.createTextNode(' '));
      }
      back.appendChild(frag);
      guard += 25;
    }

    /* put highlights only where they are visible: below the hint, above the content block */
    var top = 110;
    var bottom = (content ? content.offsetTop : limit) - 30;
    var spans = Array.prototype.filter.call(back.querySelectorAll('span'), function (s) {
      return s.offsetTop > top && s.offsetTop < bottom;
    });
    var picked = [];
    var step = Math.max(1, Math.floor(spans.length / highlights.length));
    for (var h = 0; h < highlights.length && spans.length; h++) {
      var from = h * step;
      var idx = Math.min(spans.length - 1, from + Math.floor(Math.random() * step));
      picked.push(spans[idx]);
    }
    picked.forEach(function (s, k) { s.textContent = highlights[k]; s.className = 'hl'; });

    front.innerHTML = back.innerHTML;
  }

  function setSpot(x, y) {
    hero.style.setProperty('--x', x + 'px');
    hero.style.setProperty('--y', y + 'px');
  }

  if (hero) {
    if (hint && !fine) hint.textContent = 'Tap the crowd: five of these ideas are mine';
    buildCrowd();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildCrowd);

    var lastW = window.innerWidth, rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (Math.abs(window.innerWidth - lastW) > 40) { lastW = window.innerWidth; buildCrowd(); }
      }, 250);
    });

    /* spotlight: follows the cursor over the crowd; otherwise it keeps wandering */
    var mobile = window.matchMedia('(max-width: 600px)').matches || !fine;
    var speed = mobile ? 0.012 : 0.006;   /* faster on phones */
    var ease = mobile ? 0.05 : 0.03;
    var cx = null, cy = null, t = 0, followUntil = 0;
    function overCrowd(target) {
      return target && target.closest && target.closest('#hero') && !target.closest('#heroContent, .topbar, .hero__hint');
    }
    document.addEventListener('mousemove', function (e) {
      if (!overCrowd(e.target)) { followUntil = 0; return; }
      var r = hero.getBoundingClientRect();
      cx = e.clientX - r.left; cy = e.clientY - r.top;
      setSpot(cx, cy);
      followUntil = Infinity;   /* follow while the cursor is over the crowd */
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { followUntil = 0; });
    window.addEventListener('scroll', function () { followUntil = 0; }, { passive: true });
    hero.addEventListener('touchstart', function (e) {
      var r = hero.getBoundingClientRect();
      cx = e.touches[0].clientX - r.left; cy = e.touches[0].clientY - r.top;
      setSpot(cx, cy);
      followUntil = Date.now() + 2500;
    }, { passive: true });

    if (!reduced) {
      (function loop() {
        if (Date.now() > followUntil) {
          var r = hero.getBoundingClientRect();
          if (r.bottom > 0) {
            t += speed;
            var areaH = (content ? content.offsetTop : r.height);
            var gx = r.width * (0.5 + 0.38 * Math.sin(t * 1.3));
            var gy = 80 + (areaH - 120) * (0.5 + 0.45 * Math.sin(t * 2.1));
            if (cx === null) { cx = gx; cy = gy; }
            cx += (gx - cx) * ease; cy += (gy - cy) * ease;   /* glides from wherever the cursor left it */
            setSpot(cx, cy);
          }
        }
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ================= CURSOR ================= */
  var cursor = document.getElementById('cursor');
  if (cursor && fine) {
    document.documentElement.classList.add('has-cursor');
    document.addEventListener('mousemove', function (e) {
      cursor.style.opacity = '1';
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      var link = e.target.closest('a, button');
      var inCrowd = !link && e.target.closest('#hero') && !e.target.closest('#heroContent, .topbar');
      cursor.classList.toggle('is-link', !!link);
      cursor.classList.toggle('is-hero', !!inCrowd);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', function () { cursor.style.opacity = '1'; });
  }

  /* ================= CLOCK ================= */
  var clock = document.getElementById('clock');
  if (clock) {
    var tick = function () {
      clock.textContent = 'Moscow ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' });
    };
    tick(); setInterval(tick, 30000);
  }

  /* ================= MEDIA =================
     Each slot has data-src="img/name" without an extension.
     The script tries .webp .jpg .jpeg .png .gif, then .mp4 .webm,
     and shows the first file that exists. */
  var imgExt = ['webp', 'jpg', 'jpeg', 'png', 'gif'];
  var vidExt = ['mp4', 'webm'];

  /* exts: list of extensions to try; a slot with data-ext="webp" (or "mp4")
     only ever loads that one format, so other uploaded copies are ignored */
  function tryVideo(box, base, i, exts) {
    exts = exts || vidExt;
    if (i >= exts.length) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.preload = 'auto';
    v.onloadeddata = function () { box.appendChild(v); box.classList.add('loaded'); v.play().catch(function () {}); };
    v.onerror = function () { tryVideo(box, base, i + 1, exts); };
    v.src = base + '.' + exts[i];
  }

  function tryImage(box, base, i, exts, videoAfter) {
    exts = exts || imgExt;
    if (i >= exts.length) { if (videoAfter !== false) tryVideo(box, base, 0); return; }
    var img = new Image();
    img.alt = box.getAttribute('data-alt') || '';
    img.decoding = 'async';
    img.onload = function () { box.appendChild(img); box.classList.add('loaded'); };
    img.onerror = function () { tryImage(box, base, i + 1, exts, videoAfter); };
    img.src = base + '.' + exts[i];
  }

  function loadSlot(s) {
    var base = s.getAttribute('data-src'), ext = s.getAttribute('data-ext');
    if (!ext) { tryImage(s, base, 0); return; }
    if (ext === 'mp4' || ext === 'webm') { tryVideo(s, base, 0, [ext]); return; }
    tryImage(s, base, 0, [ext], false);
  }
  var slots = Array.prototype.filter.call(document.querySelectorAll('.media[data-src]'), function (s) { return !s.closest('.slider'); });
  var sliders = document.querySelectorAll('.slider');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        if (en.target.classList.contains('slider')) en.target.querySelectorAll('.media[data-src]').forEach(loadSlot);
        else loadSlot(en.target);
      });
    }, { rootMargin: '400px' });
    slots.forEach(function (s) { io.observe(s); });
    sliders.forEach(function (s) { io.observe(s); });
  } else {
    slots.forEach(loadSlot);
    sliders.forEach(function (s) { s.querySelectorAll('.media[data-src]').forEach(loadSlot); });
  }

  /* ================= SLIDERS ================= */
  sliders.forEach(function (sl) {
    var track = sl.querySelector('.slider__track');
    var count = sl.querySelector('.slider__count');
    var total = track.children.length;
    var i = 0;
    function go(n) {
      i = (n + total) % total;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      count.textContent = (i + 1) + ' / ' + total;
    }
    sl.querySelectorAll('.slider__btn').forEach(function (b) {
      b.addEventListener('click', function () { go(i + parseInt(b.getAttribute('data-dir'), 10)); });
    });
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  });
  /* ================= DIPLOMA LIGHTBOX ================= */
  var dipLinks = document.querySelectorAll('.dip-grid a, .art-grid a');
  if (dipLinks.length) {
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Diploma');
    lb.innerHTML = '<button class="lightbox__close" aria-label="Close">×</button><figure class="lightbox__fig"><img alt=""><figcaption class="mono"></figcaption></figure>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), lbClose = lb.querySelector('.lightbox__close');
    var lastFocus = null;
    function openLb(a) {
      lastFocus = a;
      var shown = a.querySelector('img');
      lbImg.src = shown ? (shown.currentSrc || shown.src) : a.getAttribute('href');
      var m = a.querySelector('.media'); lbImg.alt = m ? (m.getAttribute('data-alt') || '') : '';
      var cap = a.parentNode.querySelector('figcaption'); lbCap.textContent = cap ? cap.textContent : '';
      lb.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      lbClose.focus();
    }
    function closeLb() {
      lb.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    dipLinks.forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); openLb(a); });
    });
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLb(); });
  }
  /* ================= TRIGLINKI LAYOUT =================
     Columns are sized from the real proportions of the photos,
     so the top-right photo is always shown whole and the left photo
     ends exactly where the right column ends. */
  var trig = document.querySelector('.trig');
  if (trig) {
    var relayout = function () {
      var ratio = function (cls) {
        var im = trig.querySelector('.' + cls + ' img');
        return im && im.naturalWidth ? im.naturalWidth / im.naturalHeight : null;
      };
      var ra = ratio('trig-a') || 0.75, rb = ratio('trig-b') || 4 / 3;
      var rc = ratio('trig-c') || 0.75, rd = ratio('trig-d') || 0.75, rcd = (rc + rd) / 2;
      ['trig-b', 'trig-c', 'trig-d'].forEach(function (c, k) {
        var r = [rb, rcd, rcd][k];
        trig.querySelector('.' + c).style.aspectRatio = r.toFixed(4);
      });
      var left = ra * (1 / rb + 1 / (2 * rcd));
      trig.style.gridTemplateColumns = left.toFixed(4) + 'fr .5fr .5fr';
    };
    relayout();
    new MutationObserver(relayout).observe(trig, { childList: true, subtree: true });
  }
})();
