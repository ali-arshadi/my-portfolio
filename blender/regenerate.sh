#!/usr/bin/env bash
# Rebuild every Blender asset, validate it, and write public/models/*.glb + src/config/scene.generated.ts.
#
#   blender/regenerate.sh             export only
#   blender/regenerate.sh --compare   also render the opening frame and compare it with the reference
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

"$PY" -I blender/scripts/export_all.py
if [[ "${1:-}" == "--compare" ]]; then
  "$PY" -I blender/scripts/compare.py --out docs/reference/latest
fi
