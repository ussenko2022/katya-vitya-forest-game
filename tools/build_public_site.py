"""Copy only approved static files to docs/ for public GitHub Pages."""

from __future__ import annotations

import json
from pathlib import Path
import shutil

from build_content import ROOT
from generate_audio import read_env

SOURCE = ROOT / "dist"
TARGET = ROOT / "docs"
STATIC_FILES = ("index.html", "style.css", "game.js", "content.js", "voice-map.js")
IMAGES = ("forest.png", "katya-vitya.png", "katya-stage.png", "vitya-stage.png", "riverbank.png", "shallows.png", "twilight-forest.png")
ANIMALS = ("bear", "cow", "fox", "giraffe", "squirrel", "dolphin", "hedgehog", "penguin", "rabbit", "deer", "frog", "duck", "camel", "owl", "bat", "rooster")
BINS = ("paper", "plastic", "organic", "metal")
LITTER = ("newspaper", "bottle", "box", "cup", "paper", "bag", "watermelon-rind", "melon-rind", "can", "shell-a", "shell-b", "banana-peel")


def build() -> tuple[int, int]:
    if TARGET.resolve().parent != ROOT.resolve():
        raise RuntimeError("Public output must stay inside this project")
    voice_text = (SOURCE / "voice-map.js").read_text(encoding="utf-8")
    prefix = "window.VOICE_ASSETS = "
    if not voice_text.startswith(prefix):
        raise RuntimeError("Invalid voice map")
    voice_map = json.loads(voice_text[len(prefix):].strip().removesuffix(";"))
    references = {file for language in voice_map.values() for mode in language.values() for file in mode.values()}
    if not all(file.startswith("assets/voice/") and file.endswith(".mp3") for file in references):
        raise RuntimeError("Voice map contains an unexpected file path")

    allowed = set(STATIC_FILES)
    allowed.update(f"assets/{name}" for name in IMAGES)
    allowed.update(f"assets/animals/{name}.png" for name in ANIMALS)
    allowed.update(f"assets/bins/{name}.png" for name in BINS)
    allowed.update(f"assets/litter/{name}.png" for name in LITTER)
    allowed.update(references)
    allowed.add(".nojekyll")
    TARGET.mkdir(exist_ok=True)
    for name in allowed - {".nojekyll"}:
        source = SOURCE / name
        if not source.is_file() or source.resolve().is_relative_to(SOURCE.resolve()) is False:
            raise RuntimeError(f"Missing or unsafe public file: {name}")
        destination = TARGET / name
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, destination)
    (TARGET / ".nojekyll").write_text("", encoding="utf-8")

    for existing in sorted(TARGET.rglob("*"), reverse=True):
        if existing.is_file() and existing.relative_to(TARGET).as_posix() not in allowed:
            existing.unlink()
        elif existing.is_dir() and not any(existing.iterdir()):
            existing.rmdir()

    forbidden_names = {".env", ".env.local", ".env.production"}
    if any(file.name in forbidden_names for file in TARGET.rglob("*")):
        raise RuntimeError("A secret file reached the public output")
    key = read_env().get("OPENAI_API_KEY") or read_env().get("openai_token")
    if key:
        for name in STATIC_FILES:
            if key in (TARGET / name).read_text(encoding="utf-8"):
                raise RuntimeError("API key appeared in public source")
    return len(allowed), len(references)


if __name__ == "__main__":
    files, clips = build()
    print(f"Built docs/ with {files} approved files, including {clips} voice clips. No .env files copied.")
