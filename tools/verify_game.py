"""Check both game languages, all narration, and the public Pages artifact."""

from __future__ import annotations

import json
from pathlib import Path

from build_content import ROOT, load_content
from build_public_site import ANIMALS, BINS, LITTER
from generate_audio import collect_lines, filename, settings, valid_audio


def verify() -> None:
    content = load_content()
    ru, kk = content["ru"], content["kk"]
    assert set(ru) == set(kk), "Locale sections differ"
    assert len(ru["levels"]) == len(kk["levels"]) == 8
    assert [level["id"] for level in ru["levels"]] == list(range(1, 9))
    assert [level["id"] for level in kk["levels"]] == list(range(1, 9))
    assert len(ru["adventures"]) == len(kk["adventures"]) == 7
    for source, target in zip(ru["adventures"], kk["adventures"]):
        assert len(source["answers"]) == len(target["answers"]) == 3
        assert sum(bool(answer.get("correct")) for answer in source["answers"]) == 1
        assert [answer.get("correct", False) for answer in source["answers"]] == [answer.get("correct", False) for answer in target["answers"]]
        assert all(answer.get("why") for answer in source["answers"] if not answer.get("correct"))
        assert all(answer.get("why") for answer in target["answers"] if not answer.get("correct"))
    for section in ("habitats", "growth", "counting", "memoryPairs"):
        assert len(ru[section]) == len(kk[section]), f"Different {section} length"
    assert len(ru["forestAnimals"]) == len(kk["forestAnimals"]) == 16
    assert len(ANIMALS) == len(ru["forestAnimals"])
    assert [animal["forest"] for animal in ru["forestAnimals"]] == [animal["forest"] for animal in kk["forestAnimals"]]
    assert len(ru["forestStages"]) == len(kk["forestStages"]) == 3
    for source, target in zip(ru["forestStages"], kk["forestStages"]):
        assert source["animalIds"] == target["animalIds"]
        assert source["background"] == target["background"]
        assert len(source["animalIds"]) == 9
        assert all(0 <= item < len(ru["forestAnimals"]) for item in source["animalIds"])
        assert sum(ru["forestAnimals"][item]["forest"] for item in source["animalIds"]) == 5
    assert len(ru["recyclingItems"]) == len(kk["recyclingItems"]) == 12
    assert len(LITTER) == len(ru["recyclingItems"])
    assert [bin_item["id"] for bin_item in ru["recyclingBins"]] == [bin_item["id"] for bin_item in kk["recyclingBins"]] == ["paper", "plastic", "organic", "metal"]
    assert [item["bin"] for item in ru["recyclingItems"]] == [item["bin"] for item in kk["recyclingItems"]]
    assert all(item["bin"] in {"paper", "plastic", "organic", "metal", "nature"} for item in ru["recyclingItems"])
    for source, target in zip(ru["recyclingItems"], kk["recyclingItems"]):
        if source["bin"] != "nature":
            assert source.get("sortPraise") and target.get("sortPraise")
    assert len(ru["recyclingStages"]) == len(kk["recyclingStages"]) == 3
    assert [stage["background"] for stage in ru["recyclingStages"]] == ["forest.png", "riverbank.png", "shallows.png"]
    for source, target in zip(ru["recyclingStages"], kk["recyclingStages"]):
        assert source["itemIds"] == target["itemIds"]
        assert source["binIds"] == target["binIds"]
        assert source["manualIntro"] and target["manualIntro"]
        assert len(source["itemIds"]) == 6
        assert all(0 <= item < len(ru["recyclingItems"]) for item in source["itemIds"])
        assert all(ru["recyclingItems"][item]["bin"] in source["binIds"] + ["nature"] for item in source["itemIds"])
    assert sum(ru["recyclingItems"][item]["bin"] == "nature" for item in ru["recyclingStages"][2]["itemIds"]) == 2
    for stage in ru["forestStages"] + ru["recyclingStages"]:
        assert (ROOT / "dist" / "assets" / stage["background"]).is_file()
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
    page = (ROOT / "dist" / "index.html").read_text(encoding="utf-8")
    assert 'id="stageKatya" aria-hidden="true"><img src="assets/katya-stage.png"' in page
    assert 'id="stageVitya" aria-hidden="true"><img src="assets/vitya-stage.png"' in page
    assert not (public / ".env").exists()
    assert not any(path.name.startswith(".env") for path in public.rglob("*"))
    for name in ("index.html", "style.css", "game.js", "content.js", "voice-map.js"):
        assert (ROOT / "dist" / name).read_bytes() == (public / name).read_bytes(), f"Public {name} is stale"
    for name in ("forest.png", "riverbank.png", "shallows.png", "twilight-forest.png", "katya-stage.png", "vitya-stage.png"):
        assert (ROOT / "dist" / "assets" / name).read_bytes() == (public / "assets" / name).read_bytes(), f"Public asset {name} is stale"
    for folder, names in (("animals", ANIMALS), ("bins", BINS), ("litter", LITTER)):
        for name in names:
            asset = Path("assets") / folder / f"{name}.png"
            assert (ROOT / "dist" / asset).read_bytes() == (public / asset).read_bytes(), f"Public asset {asset} is stale"
    assert not (public / "assets" / "heroes-stage.png").exists(), "Obsolete shared character sprite remains public"
    print(f"Verified 8 levels, 2 locales, 32 visual sprites, {count} voice clips and public docs/ without .env.")


if __name__ == "__main__":
    verify()
