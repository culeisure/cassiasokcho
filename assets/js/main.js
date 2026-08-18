/* CASSIA SOKCHO landing 공용 스크립트
   리빌, 카운트업, 차트 애니메이션, 아코디언 추적, CTA 이벤트 */
(function () {
  var body = document.body;
  var SP = body.dataset.sp || '';        // 영업사원명
  var VER = body.dataset.version || '';  // personal | corporate

  function track(name, params) {
    if (typeof gtag !== 'function') return;
    var p = Object.assign({ salesperson: SP, version: VER }, params || {});
    gtag('event', name, p);
  }

  /* 리빌 + 차트 트리거 */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');

      e.target.querySelectorAll('[data-count]').forEach(countUp);
      e.target.querySelectorAll('.hbar .fill').forEach(function (f) {
        f.style.width = f.dataset.w + '%';
      });
      e.target.querySelectorAll('.trend .bar').forEach(function (b) {
        b.style.height = b.dataset.h + '%';
      });
      io.unobserve(e.target);
    });
  }, { threshold: 0.18 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  /* 카운트업 */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var target = parseFloat(el.dataset.count);
    var dur = 1200, t0 = null;
    var fmt = function (v) { return v.toLocaleString('ko-KR'); };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = fmt(target); return;
    }
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* 아코디언: 같은 그룹 내 단일 오픈 + faq_open 추적 */
  document.querySelectorAll('.acc').forEach(function (acc) {
    acc.querySelectorAll('details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        acc.querySelectorAll('details[open]').forEach(function (o) {
          if (o !== d) o.open = false;
        });
        var q = d.querySelector('summary');
        track('faq_open', { question: q ? q.textContent.trim().slice(0, 60) : '' });
      });
    });
  });

  /* CTA 클릭 추적 */
  document.querySelectorAll('[data-cta]').forEach(function (a) {
    a.addEventListener('click', function () {
      var kind = a.dataset.cta;           // call | sms
      var pos = a.dataset.pos || '';      // hero | mid | contact | sticky
      track(kind === 'call' ? 'cta_call' : 'cta_sms', { position: pos });
    });
  });

  /* 인트로 로고 */
  var intro = document.querySelector('.intro');
  if (intro) {
    var hide = function () {
      intro.classList.add('out');
      setTimeout(function () { intro.remove(); }, 600);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.remove();
    } else {
      setTimeout(hide, 1300);
      intro.addEventListener('click', hide);
    }
  }

  /* 사진 라이트박스 */
  var lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<div class="lb-card"><span class="lb-x">&times;</span><img alt=""><div class="lb-cap"></div></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('.lb-cap');
  document.querySelectorAll('.gallery-wide img, .gallery-grid img, .room-card img, .fullbleed img').forEach(function (img) {
    img.classList.add('zoomable');
    img.addEventListener('click', function () {
      lbImg.src = img.currentSrc || img.src;
      lbCap.textContent = img.alt || '';
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
      track('photo_open', { photo: img.alt || '' });
    });
  });
  var lbClose = function () {
    lb.classList.remove('on');
    document.body.style.overflow = '';
  };
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target.classList.contains('lb-x')) lbClose();
  });

  /* 기명/무기명 선택: 카드 클릭 시 패널 전환 */
  var modeCards = document.querySelectorAll('.card[data-mode]');
  modeCards.forEach(function (c) {
    c.addEventListener('click', function () {
      modeCards.forEach(function (o) { o.classList.remove('active'); });
      c.classList.add('active');
      document.querySelectorAll('.mode-panel').forEach(function (pn) { pn.classList.remove('on'); });
      var target = document.getElementById('panel-' + c.dataset.mode);
      if (target) target.classList.add('on');
      track('mode_select', { mode: c.dataset.mode });
    });
  });

  /* 하단 고정바: 히어로 지나면 표시 */
  var sticky = document.querySelector('.sticky-bar');
  var hero = document.querySelector('.hero');
  if (sticky && hero) {
    var sIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var show = !e.isIntersecting;
        sticky.classList.toggle('show', show);
        body.classList.toggle('has-sticky', show);
      });
    }, { threshold: 0.05 });
    sIo.observe(hero);
  }
})();
