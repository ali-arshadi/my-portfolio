#!/usr/bin/env bash
# Rebuild every Blender asset, validate it, bake its lighting, and write public/models/*.glb,
# public/lightmaps/*.png and src/config/scene.generated.ts.
#
#   blender/regenerate.sh               export and bake (about 7 minutes on 12 CPU threads)
#   blender/regenerate.sh --no-bake     export only; keeps the existing lightmaps
#   blender/regenerate.sh --compare     also render the opening frame and compare it with the reference
#
# BLENDER_PYTHON: any Python with bpy 5.x, Pillow and NumPy (default: .venv-blender/bin/python).
set -euo pipefail
cd "$(dirname "$0")/.."

PY="${BLENDER_PYTHON:-.venv-blender/bin/python}"
if [[ ! -x "$PY" ]]; then
  echo "No Blender Python at $PY. Create one with:" >&2
  echo "  uv venv --python 3.13 .venv-blender && uv pip install --python .venv-blender/bin/python bpy pillow numpy" >&2
  exit 1
fi

export_args=()
compare=0
for arg in "$@"; do
  case "$arg" in
    --compare) compare=1 ;;
    *) export_args+=("$arg") ;;
  esac
done

"$PY" -I blender/scripts/export_all.py "${export_args[@]}"
if [[ $compare == 1 ]]; then
  "$PY" -I blender/scripts/compare.py --out docs/reference/latest
fi
