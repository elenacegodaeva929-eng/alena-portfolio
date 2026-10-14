(function () {
  'use strict';

  /* ---------- crowd ---------- */
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
  var highlights = ['Parkovkin','Vibrate Higher','Silence of Nature','Nochlezhka','MAYOU'];
  var total = 170, mobileMax = 58;

  var front = document.getElementById('crowdFront');
  var back = document.getElementById('crowdBack');
  var hero = document.getElementById('hero');

  if (front && back && hero) {
    var pos = {}, n = 0;
    while (n < highlights.length) {
      var p = Math.floor(Math.random() * mobileMax);
      if (!(p in pos)) pos[p] = highlights[n++];
    }
    var f = '', b = '';
    for (var i = 0; i < total; i++) {
      var isHl = i in pos;
      var t = isHl ? pos[i] : phrases[Math.floor(Math.random() * phrases.length)];
      f += '<span>' + t + '</span>';
      b += '<span' + (isHl ? ' class="hl"' : '') + '>' + t + '</span>';
    }
    front.innerHTML = f;
    back.innerHTML = b;

    var setSpot = function (x, y) {
      hero.style.setProperty('--x', x + 'px');
      hero.style.setProperty('--y', y + 'px');
    };

    var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var inside = false;

    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      inside = true;
      setSpot(e.clientX - r.left, e.clientY - r.top);
    });
    hero.addEventListener('mouseleave', function () { inside = false; });

    if (!reduced) {
      var t0 = 0, cx = null, cy = null, tx = 0, ty = 0;
      hero.addEventListener('touchstart', function (e) {
        var r = hero.getBoundingClientRect();
        tx = e.touches[0].clientX - r.left;
        ty = e.touches[0].clientY - r.top;
        cx = tx; cy = ty;
        t0 = -1;
      }, { passive: true });

      (function loop() {
        if (!inside) {
          var r = hero.getBoundingClientRect();
          if (r.bottom > 0) {
            if (t0 < 0) { t0 = 0; }
            t0 += 0.006;
            var gx = r.width * (0.5 + 0.34 * Math.sin(t0 * 1.3));
            var gy = r.height * (0.42 + 0.22 * Math.sin(t0 * 2.1));
            if (cx === null) { cx = gx; cy = gy; }
            cx += (gx - cx) * 0.03; cy += (gy - cy) * 0.03;
            setSpot(cx, cy);
          }
        } else { cx = null; }
        requestAnimationFrame(loop);
      })();
    }
  }

  /* ---------- custom cursor ---------- */
  var cursor = document.getElementById('cursor');
  if (cursor && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var label = cursor.querySelector('.cursor__label');
    document.addEventListener('mousemove', function (e) {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
      var open = e.target.closest('[data-cursor="open"], a');
      var inHero = e.target.closest('#hero') && !open;
      cursor.classList.toggle('is-open', !!open);
      cursor.classList.toggle('is-hero', !!inHero);
      label.textContent = open ? 'OPEN' : '';
    }, { passive: true });
  }

  /* ---------- clock ---------- */
  var clock = document.getElementById('clock');
  if (clock) {
    var tick = function () {
      clock.textContent = 'Moscow ' + new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/Moscow', hour: '2-digit', minute: '2-digit' });
    };
    tick(); setInterval(tick, 30000);
  }

  /* ---------- placeholders: load real photos if present in /img ---------- */
  document.querySelectorAll('.ph[data-img]').forEach(function (box) {
    var img = new Image();
    img.alt = box.getAttribute('data-alt') || '';
    img.loading = 'lazy';
    img.onload = function () { box.appendChild(img); box.classList.add('loaded'); };
    img.src = box.getAttribute('data-img');
  });
})();
