// assets/js/rezeption-loader.js
//
// Classic (non-module) script, deliberately synchronous: emits the two 321med
// widget <script> tags during page parsing — exactly as the former static
// tags did, which the vendor script needs (injected after page load the
// widget doesn't show up). Always runs: the Online-Rezeption is the
// practice's main way to be reached and asks for its own consent to data
// processing inside the widget, so it is not behind the cookie bar.
//
// 321med Online-Rezeption widget, provided directly by the practice's vendor
// (321 MED GmbH) on 2026-09-04. No SRI hash: this is a vendor-hosted,
// server-rendered widget script expected to update without a version bump —
// pinning a hash would break it on the vendor's next legitimate update.
(function () {
  [
    'https://321med17.com/cdn/server/11cb0eefca4e16e350aca235e8bea2608a35c85f/321med.js',
    'https://321med-cdn.com/321med.js'
  ].forEach(function (src) {
    document.write('<script src="' + src + '"><\/script>');
  });
})();
