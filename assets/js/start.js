// assets/js/start.js
//
// Classic (non-module) script, first of the two scripts at the end of every
// page. It starts the site's own code (main.js) right away, instead of the
// former <script type="module">, which the browser holds back until the
// whole page is parsed — and the page is not parsed until the synchronous
// 321med widget scripts after this one have been fetched. On a slow mobile
// connection (or when a content blocker stalls the vendor request) that
// meant: no tap on the video, the Online-Rezeption links or the map worked,
// because main.js had not run yet. Now everything above this tag is already
// in the DOM and main.js runs independently of the vendor scripts.
(function () {
  var src = document.currentScript && document.currentScript.src;
  if (!src) return;
  import(new URL('main.js', src).href)
    .then(function (m) { m.boot(); })
    .catch(function (err) { console.error('[pmb] main.js failed to start', err); });
})();
