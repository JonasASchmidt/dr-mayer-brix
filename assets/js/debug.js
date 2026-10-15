// assets/js/debug.js
//
// Diagnosis on a phone without developer tools: open any page with ?debug
// (e.g. index.html?debug) and a box at the bottom lists what the site's
// scripts did — whether main.js started, which step failed, script errors,
// whether the 321med widget and the browser storage are available.
// Without ?debug this script does nothing.
(function () {
  if (!/[?&]debug\b/.test(location.search)) return;
  var errors = [];
  window.addEventListener('error', function (e) {
    errors.push((e.message || 'Fehler beim Laden') + (e.filename ? ' @ ' + e.filename.split('/').pop() + ':' + e.lineno : (e.target && e.target.src ? ' @ ' + e.target.src : '')));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    errors.push('Promise: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)));
  });
  function storageOk() {
    try { window.localStorage.getItem('x'); return 'ok'; } catch (e) { return 'blockiert (' + e.name + ')'; }
  }
  function render() {
    var s = window.__pmb;
    var banner = document.getElementById('site-banner');
    var lines = [
      'Browser: ' + navigator.userAgent,
      'main.js: ' + (s ? (s.booted ? 'gestartet' : 'geladen, nicht gestartet') : 'NICHT GELADEN'),
      'Fehlgeschlagene Schritte: ' + (s && s.failed.length ? s.failed.join(' | ') : 'keine'),
      '321med-Widget: ' + (typeof window.open_321med === 'function' ? 'da' : 'nicht da'),
      'Speicher: ' + storageOk(),
      'Mitteilung: ' + (banner ? (banner.hidden ? 'versteckt' : 'sichtbar') : 'fehlt'),
      'Fehler: ' + (errors.length ? errors.join(' | ') : 'keine'),
    ];
    var box = document.getElementById('pmb-debug') || document.createElement('pre');
    box.id = 'pmb-debug';
    // pointer-events:none: the box must never block a tap on the page itself
    box.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;margin:0;padding:8px;max-height:50vh;overflow:hidden;pointer-events:none;opacity:0.92;'
      + 'background:#111;color:#0f0;font:12px/1.4 monospace;white-space:pre-wrap;word-break:break-all';
    box.textContent = lines.join('\n');
    if (!box.parentNode) document.body.appendChild(box);
  }
  window.addEventListener('load', function () { render(); setTimeout(render, 3000); });
})();
