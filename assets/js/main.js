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
  lb.innerHTML = '<div class="lb-card"><span class="lb-x">&times;</span><span class="lb-nav lb-prev">&#8249;</span><span class="lb-nav lb-next">&#8250;</span><img alt=""><div class="lb-cap"></div></div>';
  document.body.appendChild(lb);
  var lbImg = lb.querySelector('img');
  var lbCap = lb.querySelector('.lb-cap');
  var gImgs = null, gIdx = 0, gAlt = '';

  function lbShow() {
    lbImg.src = gImgs[gIdx];
    lbCap.textContent = gImgs.length > 1 ? gAlt + ' (' + (gIdx + 1) + '/' + gImgs.length + ')' : gAlt;
    lb.classList.toggle('has-nav', gImgs.length > 1);
  }
  document.querySelectorAll('.gallery-wide img, .gallery-grid img, .room-card img, .fullbleed img').forEach(function (img) {
    img.classList.add('zoomable');
    img.addEventListener('click', function () {
      try { gImgs = img.dataset.imgs ? JSON.parse(img.dataset.imgs) : null; } catch (err) { gImgs = null; }
      if (!gImgs) gImgs = [img.currentSrc || img.src];
      gIdx = 0;
      gAlt = img.alt || '';
      lbShow();
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
      track('photo_open', { photo: gAlt });
    });
  });
  lb.querySelector('.lb-prev').addEventListener('click', function (e) {
    e.stopPropagation();
    gIdx = (gIdx - 1 + gImgs.length) % gImgs.length;
    lbShow();
  });
  lb.querySelector('.lb-next').addEventListener('click', function (e) {
    e.stopPropagation();
    gIdx = (gIdx + 1) % gImgs.length;
    lbShow();
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

  /* 자료받기 폼 */
  var leadCfg = window.LEAD_CFG || {};
  var leadBtn = document.getElementById('leadBtn');
  if (leadBtn && !leadCfg.endpoint) leadBtn.style.display = 'none';
  if (leadBtn && leadCfg.endpoint) {
    var leadBox = document.getElementById('leadBox');
    var leadForm = document.getElementById('leadForm');
    if (leadCfg.sitekey) {
      var tw = document.getElementById('tsWidget');
      tw.className = 'cf-turnstile';
      tw.setAttribute('data-sitekey', leadCfg.sitekey);
      var tsc = document.createElement('script');
      tsc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      tsc.async = true;
      document.head.appendChild(tsc);
    }
    leadBtn.addEventListener('click', function () {
      leadBox.hidden = false;
      leadBtn.style.display = 'none';
      leadBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      track('lead_open', {});
    });
    var privacyLink = document.getElementById('privacyLink');
    if (privacyLink) {
      privacyLink.addEventListener('click', function () {
        var d = document.getElementById('privacyD');
        if (d) d.open = true;
      });
    }
    leadForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var btn = document.getElementById('leadSubmit');
      var name = leadForm.lname.value.trim();
      var phone = leadForm.lphone.value.replace(/[^0-9]/g, '');
      var email = leadForm.lemail.value.trim();
      if (!name) { alert('성함을 입력해 주세요.'); return; }
      if (!/^01[016789][0-9]{7,8}$/.test(phone)) { alert('휴대폰 번호를 확인해 주세요.'); return; }
      if (!leadForm.lagree.checked) { alert('개인정보 수집·이용에 동의해 주세요.'); return; }
      var token = '';
      if (leadCfg.sitekey && window.turnstile) token = window.turnstile.getResponse() || '';
      btn.disabled = true;
      btn.textContent = '전송 중...';
      fetch(leadCfg.endpoint, {
        method: 'POST',
        body: JSON.stringify({
          sp: body.dataset.spid || '',
          name: name, phone: phone, email: email,
          token: token,
          hp: leadForm.company ? leadForm.company.value : ''
        })
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (res.ok) {
          leadForm.hidden = true;
          var done = document.getElementById('leadDone');
          done.hidden = false;
          document.getElementById('leadPdf').href = atob(leadCfg.pdf);
          track('lead_submit', {});
        } else {
          alert(res.msg || '전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
          btn.disabled = false;
          btn.textContent = '제출하고 자료 받기';
        }
      }).catch(function () {
        alert('전송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
        btn.disabled = false;
        btn.textContent = '제출하고 자료 받기';
      });
    });
  }

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
