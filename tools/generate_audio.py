"""Incrementally generate Russian and Kazakh game narration with OpenAI TTS.

Audio filenames are hashes of the exact text, language, model, voice and delivery
instructions. Unchanged lines are reused; changed lines receive new files.
Only finished MP3 files are included in the browser's voice map.
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
from http.client import IncompleteRead
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

try:
    from .build_content import ROOT, build_content
except ImportError:  # direct `python tools/generate_audio.py`
    from build_content import ROOT, build_content

API_URL = "https://api.openai.com/v1/audio/speech"
OUTPUT = ROOT / "dist" / "assets" / "voice"
VOICE_MAP = ROOT / "dist" / "voice-map.js"
DEFAULT_MODEL = "gpt-4o-mini-tts"
DEFAULT_VOICES = {"female": "marin", "male": "cedar"}


def read_env() -> dict[str, str]:
    values: dict[str, str] = {}
    for path in (ROOT / ".env",):
        if not path.is_file():
            continue
        for raw in path.read_text(encoding="utf-8-sig").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def settings() -> tuple[str, str, dict[str, str]]:
    env = read_env()
    key = os.environ.get("OPENAI_API_KEY") or env.get("OPENAI_API_KEY") or env.get("openai_token") or ""
    model = os.environ.get("OPENAI_TTS_MODEL") or env.get("OPENAI_TTS_MODEL") or DEFAULT_MODEL
    voices = {
        "female": os.environ.get("OPENAI_TTS_FEMALE_VOICE") or env.get("OPENAI_TTS_FEMALE_VOICE") or DEFAULT_VOICES["female"],
        "male": os.environ.get("OPENAI_TTS_MALE_VOICE") or env.get("OPENAI_TTS_MALE_VOICE") or DEFAULT_VOICES["male"],
    }
    return key, model, voices


def instructions(locale: str, role: str) -> str:
    language = "Russian" if locale == "ru" else "Kazakh"
    person = "woman" if role == "female" else "man"
    return (
        f"Speak only in natural, fluent {language}, as a warm, calm {person} preschool teacher. "
        "Use a friendly, reassuring tone, clear pronunciation and a gentle pace. "
        "Express praise with soft delight and warnings without alarm. "
        "Read the supplied words exactly. Do not add words, music or sound effects."
    )


def collect_lines(content: dict) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {}
    for locale, body in content.items():
        lines: set[str] = set()
        lines.update(body["speech"].values())
        for level in body["levels"]:
            lines.add(body["ui"]["finished"].replace("{n}", str(level["id"])))
            lines.add(level["ending"])
        for adventure in body["adventures"]:
            lines.update((adventure["voice"], adventure["praise"]))
            for answer in adventure["answers"]:
                lines.add(answer["voice"])
                if answer.get("why"):
                    lines.add(answer["why"])
        for habitat in body["habitats"]:
            lines.update((habitat["name"], habitat["homeName"], habitat["why"], habitat["praise"]))
        for growth in body["growth"]:
            lines.update((growth["name"], growth["praise"]))
        for count in body["counting"]:
            lines.update((count["prompt"], count["praise"], count["wrong"]))
        lines.update(body["numberWords"])
        lines.update(pair["name"] for pair in body["memoryPairs"])
        for animal in body["forestAnimals"]:
            lines.add(animal["name"])
            lines.add(animal.get("praise") or animal["why"])
        lines.update(bin_item["name"] for bin_item in body["recyclingBins"])
        for item in body["recyclingItems"]:
            lines.update((item["name"], item["praise"], item["why"]))
        result[locale] = sorted(line for line in lines if line.strip())
    return result


def filename(locale: str, role: str, text: str, model: str, voice: str) -> Path:
    version = {"locale": locale, "role": role, "text": text, "model": model, "voice": voice,
               "instructions": instructions(locale, role), "format": "mp3", "speed": 0.95}
    digest = hashlib.sha256(json.dumps(version, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()[:28]
    return OUTPUT / locale / role / f"{digest}.mp3"


def valid_audio(path: Path) -> bool:
    return path.is_file() and path.stat().st_size > 1000


def make_tasks(content: dict, locales: list[str], roles: list[str], model: str, voices: dict[str, str]) -> list[tuple[str, str, str, Path]]:
    corpus = collect_lines(content)
    return [(locale, role, text, filename(locale, role, text, model, voices[role]))
            for locale in locales for role in roles for text in corpus[locale]]


def request_audio(key: str, model: str, voice: str, locale: str, role: str, text: str, target: Path) -> None:
    payload = json.dumps({
        "model": model, "voice": voice, "input": text,
        "instructions": instructions(locale, role),
        "response_format": "mp3", "speed": 0.95,
    }, ensure_ascii=False).encode("utf-8")
    request = Request(API_URL, data=payload, method="POST", headers={
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    })
    for attempt in range(5):
        try:
            with urlopen(request, timeout=120) as response:
                audio = response.read()
            if len(audio) < 1000:
                raise RuntimeError("Speech API returned an empty audio file")
            target.parent.mkdir(parents=True, exist_ok=True)
            temporary = target.with_suffix(".tmp")
            temporary.write_bytes(audio)
            temporary.replace(target)
            return
        except HTTPError as error:
            if error.code not in (429, 500, 502, 503, 504) or attempt == 4:
                raise RuntimeError(f"Speech API HTTP {error.code}; check API access and quota") from error
            time.sleep(min(20, 2 ** attempt + 1))
        except (URLError, IncompleteRead, TimeoutError, ConnectionResetError) as error:
            if attempt == 4:
                raise RuntimeError("Could not reach the OpenAI Speech API") from error
            time.sleep(min(20, 2 ** attempt + 1))


def write_voice_map(content: dict, model: str, voices: dict[str, str]) -> None:
    corpus = collect_lines(content)
    mapping: dict[str, dict[str, dict[str, str]]] = {}
    for locale in ("ru", "kk"):
        mapping[locale] = {}
        for role in ("female", "male"):
            clips = {}
            for text in corpus[locale]:
                path = filename(locale, role, text, model, voices[role])
                if valid_audio(path):
                    clips[text] = path.relative_to(ROOT / "dist").as_posix()
            if clips:
                mapping[locale][role] = clips
    VOICE_MAP.write_text("window.VOICE_ASSETS = " + json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")


def generate(*, selected_locales: list[str] | None = None, selected_roles: list[str] | None = None,
             limit: int | None = None, workers: int = 3, check_only: bool = False,
             progress=None) -> dict[str, int]:
    content = build_content()
    key, model, voices = settings()
    locales = selected_locales or ["ru", "kk"]
    roles = selected_roles or ["female", "male"]
    tasks = make_tasks(content, locales, roles, model, voices)
    missing = [task for task in tasks if not valid_audio(task[3])]
    summary = {"total": len(tasks), "cached": len(tasks) - len(missing), "missing": len(missing), "generated": 0}
    if check_only:
        write_voice_map(content, model, voices)
        return summary
    if missing and not key:
        raise RuntimeError("OPENAI_API_KEY is missing. Save it in .env or the launcher settings.")
    pending = missing[:limit] if limit is not None else missing
    errors = []
    with ThreadPoolExecutor(max_workers=max(1, min(workers, 6))) as pool:
        futures = {pool.submit(request_audio, key, model, voices[role], locale, role, text, path): (locale, role, path)
                   for locale, role, text, path in pending}
        for future in as_completed(futures):
            try:
                future.result()
                summary["generated"] += 1
                if progress:
                    progress(summary["generated"], len(pending))
            except Exception as error:
                errors.append(str(error))
    write_voice_map(content, model, voices)
    if errors:
        raise RuntimeError(f"{len(errors)} audio clips failed. First error: {errors[0]}")
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Incrementally generate all Russian and Kazakh game narration.")
    parser.add_argument("--check", action="store_true", help="Report missing clips without calling the API")
    parser.add_argument("--limit", type=int, help="Generate only this many missing clips for a trial run")
    parser.add_argument("--locale", choices=["ru", "kk"], help="Generate one language")
    parser.add_argument("--voice", choices=["female", "male"], help="Generate one voice")
    parser.add_argument("--workers", type=int, default=3)
    args = parser.parse_args()
    summary = generate(
        selected_locales=[args.locale] if args.locale else None,
        selected_roles=[args.voice] if args.voice else None,
        limit=args.limit, workers=args.workers, check_only=args.check,
        progress=lambda done,total: print(f"Generated {done}/{total}", flush=True) if done==total or done%10==0 else None,
    )
    print(json.dumps(summary, ensure_ascii=False))


if __name__ == "__main__":
    main()
