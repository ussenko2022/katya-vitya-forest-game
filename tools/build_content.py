"""Bundle editable locale JSON into a script that also works from file:// URLs."""

from __future__ import annotations

import json
import os
from pathlib import Path

ROOT = Path(os.environ.get("FOREST_GAME_ROOT", Path(__file__).resolve().parents[1])).resolve()
LOCALES = ("ru", "kk")


def load_content() -> dict:
    content = {}
    for locale in LOCALES:
        path = ROOT / "locales" / f"{locale}.json"
        content[locale] = json.loads(path.read_text(encoding="utf-8"))
    return content


def build_content() -> dict:
    content = load_content()
    target = ROOT / "dist" / "content.js"
    target.write_text(
        "window.GAME_CONTENT = " + json.dumps(content, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    return content


if __name__ == "__main__":
    built = build_content()
    print("Built content.js for " + ", ".join(built))
