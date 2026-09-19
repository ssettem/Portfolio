// Shared motion layer: scroll-reveal + count-up for stat numbers.
// No dependencies. No-ops gracefully if prefers-reduced-motion is set.
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animateCount(el) {
    var raw = el.textContent.trim();
    var match = raw.match(/^([^\d]*)([\d,]+\.?\d*)(.*)$/);
    if (!match) return;
    var prefix = match[1], numStr = match[2].replace(/,/g, ''), suffix = match[3];
    var target = parseFloat(numStr);
    if (isNaN(target)) return;
    var decimals = (numStr.split('.')[1] || '').length;
    var duration = 900;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target * eased;
      el.textContent = prefix + value.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
      if (progress < 1) requestAnimationFrame(frame);
      else el.textContent = raw;
    }
    requestAnimationFrame(frame);
  }

  function init() {
    var revealEls = document.querySelectorAll('.reveal');
    var countEls = document.querySelectorAll('.kpi .n, .kpi-value');

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var counted = new WeakSet();

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        if (countEls.length && (entry.target.matches('.kpi, .kpi-row') || entry.target.querySelector('.n, .kpi-value'))) {
          entry.target.querySelectorAll('.n, .kpi-value').forEach(function (numEl) {
            if (!counted.has(numEl)) {
              counted.add(numEl);
              animateCount(numEl);
            }
          });
        }
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });

    // Numbers not wrapped in a .reveal ancestor still get counted on their own visibility.
    if (countEls.length) {
      var numIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          if (!counted.has(entry.target)) {
            counted.add(entry.target);
            animateCount(entry.target);
          }
          numIo.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      countEls.forEach(function (el) { numIo.observe(el); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
