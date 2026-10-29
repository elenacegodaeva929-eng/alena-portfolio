(function () {
  'use strict';

  /* after a reload, always start from the first screen (links with #section still work) */
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

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
  var highlights = ['Parkovkin','Vibrate Higher','Brief Builder','Silence of Nature','Yanissaari'];

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

    var inside = false;
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      inside = true;
      setSpot(e.clientX - r.left, e.clientY - r.top);
    });
    hero.addEventListener('mouseleave', function () { inside = false; });

    if (!reduced) {
      var t = 0, cx = null, cy = null, holdUntil = 0;
      hero.addEventListener('touchstart', function (e) {
        var r = hero.getBoundingClientRect();
        cx = e.touches[0].clientX - r.left;
        cy = e.touches[0].clientY - r.top;
        setSpot(cx, cy);
        holdUntil = Date.now() + 2500;
      }, { passive: true });

      (function loop() {
        if (!inside && Date.now() > holdUntil) {
          var r = hero.getBoundingClientRect();
          if (r.bottom > 0) {
            t += 0.006;
            var areaH = (content ? content.offsetTop : r.height);
            var gx = r.width * (0.5 + 0.38 * Math.sin(t * 1.3));
            var gy = 80 + (areaH - 120) * (0.5 + 0.45 * Math.sin(t * 2.1));
            if (cx === null) { cx = gx; cy = gy; }
            cx += (gx - cx) * 0.03; cy += (gy - cy) * 0.03;
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

  function tryVideo(box, base, i) {
    if (i >= vidExt.length) return;
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.preload = 'auto';
    v.onloadeddata = function () { box.appendChild(v); box.classList.add('loaded'); v.play().catch(function () {}); };
    v.onerror = function () { tryVideo(box, base, i + 1); };
    v.src = base + '.' + vidExt[i];
  }

  function tryImage(box, base, i) {
    if (i >= imgExt.length) { tryVideo(box, base, 0); return; }
    var img = new Image();
    img.alt = box.getAttribute('data-alt') || '';
    img.decoding = 'async';
    img.onload = function () { box.appendChild(img); box.classList.add('loaded'); };
    img.onerror = function () { tryImage(box, base, i + 1); };
    img.src = base + '.' + imgExt[i];
  }

  function loadSlot(s) { tryImage(s, s.getAttribute('data-src'), 0); }
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
    function current() { return Math.round(track.scrollLeft / track.clientWidth); }
    function update() { count.textContent = (current() + 1) + ' / ' + total; }
    sl.querySelectorAll('.slider__btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var dir = parseInt(b.getAttribute('data-dir'), 10);
        var next = (current() + dir + total) % total;
        track.scrollTo({ left: next * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
      });
    });
    var t; track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(update, 60); }, { passive: true });
  });
})();
