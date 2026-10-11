#!/usr/bin/env bash
# Packs dist/ into a folder for hosting as a static preview. Usage: scripts/pack-preview.sh <out-dir>
set -euo pipefail
out="$1"
rm -rf "$out" && cp -r dist "$out"
cat > "$out/index.html" <<'HTML'
<title>Tessera</title>
<meta name="description" content="A discipleship and spiritual-formation platform: lessons, reflections, mentoring and growth in one connected journey.">
<link rel="stylesheet" href="assets/index.css">
<script>
  (function () {
    try {
      var p = JSON.parse(localStorage.getItem('tessera.prefs.v1') || '{}');
      var r = document.documentElement;
      if (p.theme === 'light' || p.theme === 'dark') r.setAttribute('data-theme', p.theme);
      if (p.motion === 'reduce') r.setAttribute('data-motion', 'reduce');
      var s = { s: '1', m: '1.12', l: '1.25', xl: '1.5' }[p.readingSize || 'm'];
      r.style.setProperty('--reading-scale', s);
      if (p.readingSpacing === 'relaxed') r.style.setProperty('--reading-leading', '1.9');
    } catch (e) {}
  })();
</script>
<div id="root"></div>
<script type="module" src="assets/app.js"></script>
HTML
(cd "$out" && find . -type f ! -name index.html | sed 's#^\./##' | sort | python3 -c "import sys,json; print(json.dumps([{'path':l.strip()} for l in sys.stdin]))" > "$out/../files.json")
