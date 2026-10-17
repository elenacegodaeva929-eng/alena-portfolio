(function () {
  'use strict';

  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= CROWD ================= */
  var phrases = [
    'a parking map nobody knew about','a charity poster',"a student's first client",'a small studio',
    'a startup with no name yet','a handmade zine','a neighborhood bakery','a street musician',
    'an indie film crew','a second-hand bookshop','a poetry open mic','a shelter for cats','a repair café',
    'a youth coding club','a mural painter','a tiny gallery','a street library','a wildlife rescue',
    'an open source tool','a community choir','a seed library','a rooftop cinema','a free pantry',
    'a teenage astronomer','a night bus map','a free store',"a ceramicist's popup",'a podcast about silence',
    'a language exchange club','a zero-waste blog','a local history archive','a bike co-op',
    'a sustainable fashion label','an independent radio','an after-school tutor','a community fridge'
  ];
  var highlights = ['Parkovkin','Vibrate Higher','Brief Builder','Silence of Nature','Nochlezhka'];

  var hero = document.getElementById('hero');
  var back = document.getElementById('crowdBack');
  var front = document.getElementById('crowdFront');
  var content = document.getElementById('heroContent');
  var hint = document.getElementById('heroHint');

  function rand(a) { return a[Math.floor(Math.random() * a.length)]; }

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
      }
      back.appendChild(frag);
      guard += 25;
    }

    /* put highlights only where they are visible: below the hint, above the content block */
    var top = 110;
    var bottom = (content ? content.offsetTop : limit) - 30;
    var spans = Array.prototype.filter.call(back.children, function (s) {
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
    v.setAttribute('playsinline', ''); v.preload = 'metadata';
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

  var slots = document.querySelectorAll('.media[data-src]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { io.unobserve(en.target); tryImage(en.target, en.target.getAttribute('data-src'), 0); }
      });
    }, { rootMargin: '400px' });
    slots.forEach(function (s) { io.observe(s); });
  } else {
    slots.forEach(function (s) { tryImage(s, s.getAttribute('data-src'), 0); });
  }
})();
