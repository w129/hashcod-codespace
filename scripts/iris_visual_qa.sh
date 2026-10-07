#!/usr/bin/env bash
set -euo pipefail

URL="${IRIS_URL:-http://127.0.0.1:8099/}"
OUT="${IRIS_OUT_DIR:-artifacts/iris-visual-qa}"
IRIS_BIN="${IRIS_BIN:-iris}"
CHROME_ARG=()

if ! command -v "$IRIS_BIN" >/dev/null 2>&1; then
  echo "error: Iris is not installed. See docs/IRIS_VISUAL_QA.md" >&2
  exit 127
fi

if [ -n "${IRIS_CHROME:-}" ]; then
  CHROME_ARG=(--chrome "$IRIS_CHROME")
fi

mkdir -p "$OUT"

echo "Iris: $("$IRIS_BIN" --version)"
echo "Target: $URL"
echo "Output: $OUT"

capture() {
  local name="$1"
  shift
  echo "::group::Iris capture — $name"
  "$IRIS_BIN" "${CHROME_ARG[@]}" --json "$@" "$URL"     2> >(tee "$OUT/$name.stderr.log" >&2)     | tee "$OUT/$name.json"
  echo "::endgroup::"
  test -s "$OUT/$name.json"
}

# Desktop: main first-paint / entrance experience.
capture desktop   --size desktop   --scale 1   --wait 900   -o "$OUT/desktop.png"

# Mobile preset: catches clipping, oversized controls, and horizontal overflow.
capture iphone   --size iphone   --scale 1   --wait 900   -o "$OUT/iphone.png"

# Full-page: exposes vertical overflow, detached overlays, and layout gaps.
capture full   --full   --scale 1   --wait 900   -o "$OUT/full.png"

# The current entry uses the branched menu; the retired .top-bar is absent.
capture topbar   --size desktop   --scale 1   --wait-for '#d5FirstBranchedMenuMount[data-react-mounted="true"]'   --selector '#d5FirstBranchedMenuStage'   --padding 12   --wait 350   -o "$OUT/topbar.png"

for image in "$OUT/desktop.png" "$OUT/iphone.png" "$OUT/full.png" "$OUT/topbar.png"; do
  test -s "$image" || { echo "error: missing visual QA artifact: $image" >&2; exit 1; }
done

printf '%s\n'   "Iris visual QA completed."   "desktop: $OUT/desktop.png"   "iphone:  $OUT/iphone.png"   "full:    $OUT/full.png"   "topbar:  $OUT/topbar.png"
