#!/usr/bin/env bash
# Assembles the static site into ./_site and sanity-checks it.
# Used by the GitHub Actions workflow and runnable locally:  bash scripts/build.sh
set -euo pipefail
cd "$(dirname "$0")/.."

OUT="${1:-_site}"
rm -rf "$OUT"
mkdir -p "$OUT"
cp index.html 404.html "$OUT"/
cp -r assets "$OUT"/
touch "$OUT/.nojekyll"

fail=0

# 1) No root-absolute URLs: they would resolve to https://user.github.io/... instead of /move-ai/...
if grep -nE '(href|src|action)="/[^/"]' "$OUT/index.html" "$OUT/404.html"; then
  echo "ERROR: root-absolute URL found above. Use relative paths such as ./assets/..." >&2
  fail=1
fi

# 2) Every ./local reference in index.html must exist in the build output.
while IFS= read -r ref; do
  path="${ref#./}"
  path="${path%%[?#]*}"
  if [ ! -f "$OUT/$path" ]; then
    echo "ERROR: index.html references missing file: $ref" >&2
    fail=1
  fi
done < <(grep -oE '(href|src)="\./[^"]+"' "$OUT/index.html" | sed -E 's/^(href|src)="//; s/"$//')

# 3) JavaScript must parse (catches the kind of syntax error a static host would hide).
if command -v node >/dev/null 2>&1; then
  node --check "$OUT/assets/js/app.js" || fail=1
fi

if [ "$fail" -ne 0 ]; then exit 1; fi
echo "Build OK -> $OUT/"
find "$OUT" -type f | sort | sed 's/^/  /'
