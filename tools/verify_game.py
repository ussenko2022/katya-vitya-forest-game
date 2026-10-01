"""Check both game languages, all narration, and the public Pages artifact."""

from __future__ import annotations

import json
from pathlib import Path

from build_content import ROOT, load_content
from generate_audio import collect_lines, filename, settings, valid_audio


def verify() -> None:
    content = load_content()
    ru, kk = content["ru"], content["kk"]
    assert set(ru) == set(kk), "Locale sections differ"
    assert len(ru["levels"]) == len(kk["levels"]) == 5
    assert len(ru["adventures"]) == len(kk["adventures"]) == 7
    for source, target in zip(ru["adventures"], kk["adventures"]):
        assert len(source["answers"]) == len(target["answers"]) == 3
        assert sum(bool(answer.get("correct")) for answer in source["answers"]) == 1
        assert [answer.get("correct", False) for answer in source["answers"]] == [answer.get("correct", False) for answer in target["answers"]]
        assert all(answer.get("why") for answer in source["answers"] if not answer.get("correct"))
        assert all(answer.get("why") for answer in target["answers"] if not answer.get("correct"))
    for section in ("habitats", "growth", "counting", "memoryPairs"):
        assert len(ru[section]) == len(kk[section]), f"Different {section} length"
    assert set(ru["ui"]) == set(kk["ui"])
    assert set(ru["speech"]) == set(kk["speech"])

    _, model, voices = settings()
    corpus = collect_lines(content)
    voice_text = (ROOT / "dist" / "voice-map.js").read_text(encoding="utf-8")
    prefix = "window.VOICE_ASSETS = "
    assert voice_text.startswith(prefix)
    mapping = json.loads(voice_text[len(prefix):].strip().removesuffix(";"))
    count = 0
    for locale in ("ru", "kk"):
        for role in ("female", "male"):
            clips = mapping[locale][role]
            for text in corpus[locale]:
                expected = filename(locale, role, text, model, voices[role])
                assert clips[text] == expected.relative_to(ROOT / "dist").as_posix()
                assert valid_audio(expected), f"Missing audio for {locale}/{role}"
                count += 1

    public = ROOT / "docs"
    assert (public / "index.html").is_file()
    assert not (public / ".env").exists()
    assert not any(path.name.startswith(".env") for path in public.rglob("*"))
    for name in ("index.html", "style.css", "game.js", "content.js", "voice-map.js"):
        assert (ROOT / "dist" / name).read_bytes() == (public / name).read_bytes(), f"Public {name} is stale"
    print(f"Verified 5 levels, 2 locales, {count} voice clips and public docs/ without .env.")


if __name__ == "__main__":
    verify()
