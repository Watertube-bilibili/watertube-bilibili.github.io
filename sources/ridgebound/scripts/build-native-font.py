"""Build the local Simplified Chinese UI font for native game releases.

Inputs are pinned to Noto Sans CJK 2.004 under the SIL Open Font License.
Only the interface glyphs ship. OS fonts can fill in custom map names.
"""
import shutil
import sys
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.request import urlretrieve

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont


PIN = "523d033d6cb47f4a80c58a35753646f5c3608a78"
ORIGIN = f"https://raw.githubusercontent.com/notofonts/noto-cjk/{PIN}"
FONT_SOURCE = "Sans/Variable/TTF/Subset/NotoSansSC-VF.ttf"
FONT_NAME = "ridgebound-ui.ttf"
NOTICE_NAME = "Ridgebound-UI-OFL.txt"


def interface_characters(project):
    characters = set(chr(code) for code in range(32, 127))
    for extension in ("*.gd", "*.tscn"):
        for path in project.rglob(extension):
            relative = path.relative_to(project)
            if any(part.startswith(".") or part == "tests" for part in relative.parts):
                continue
            text = path.read_text(encoding="utf-8")
            characters.update(char for char in text if ord(char) > 127 and char.isprintable())
    return characters


def rename_family(font):
    table = font["name"]
    names = {
        1: "Ridgebound UI",
        2: "Regular",
        3: "Ridgebound UI Regular 2.004",
        4: "Ridgebound UI Regular",
        6: "RidgeboundUI-Regular",
        16: "Ridgebound UI",
        17: "Regular",
        25: "RidgeboundUI",
    }
    table.names = [record for record in table.names if record.nameID not in names]
    for identifier, value in names.items():
        table.setName(value, identifier, 3, 1, 0x0409)
        table.setName(value, identifier, 1, 0, 0)


def build(project, notices):
    assets = project / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    characters = interface_characters(project)
    with TemporaryDirectory(prefix="ridgebound-font-") as scratch:
        source = Path(scratch) / "source.ttf"
        ofl = Path(scratch) / "LICENSE"
        urlretrieve(f"{ORIGIN}/{FONT_SOURCE}", source)
        urlretrieve(f"{ORIGIN}/LICENSE", ofl)
        font = TTFont(source, recalcTimestamp=False)
        original_notice = font["name"].getDebugName(0)
        options = subset.Options()
        options.name_IDs = ["*"]
        options.name_languages = ["*"]
        subsetter = subset.Subsetter(options=options)
        subsetter.populate(text="".join(sorted(characters)))
        subsetter.subset(font)
        font = instantiateVariableFont(font, {"wght": 400}, inplace=True)
        rename_family(font)
        destination = assets / FONT_NAME
        font.save(destination)
        with TTFont(destination) as sampled:
            cmap = sampled.getBestCmap()
            missing_han = sorted(char for char in characters if 0x3400 <= ord(char) <= 0x9FFF and ord(char) not in cmap)
            if missing_han:
                raise ValueError(f"UI font is missing Chinese glyphs: {''.join(missing_han)}")
            if "fvar" in sampled:
                raise ValueError("UI font unexpectedly kept variable axes")
            print(f"Native font: {len(cmap)} characters, {destination.stat().st_size} bytes")
        notice = assets / NOTICE_NAME
        license_text = ofl.read_text(encoding="utf-8")
        if not original_notice or "SIL OPEN FONT LICENSE" not in license_text.upper():
            raise ValueError("Upstream copyright or font license is missing")
        provenance = (
            f"{original_notice}\n"
            f"Derived from Noto Sans SC 2.004 ({PIN}). "
            "The game interface subset is renamed Ridgebound UI.\n\n"
        )
        notice.write_text(provenance + license_text, encoding="utf-8")
        if notices is not None:
            notices.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(notice, notices / notice.name)


if __name__ == "__main__":
    if len(sys.argv) not in (2, 3):
        raise SystemExit("usage: build-native-font.py GODOT_PROJECT [PACKAGE_LICENSE_DIRECTORY]")
    build(Path(sys.argv[1]), Path(sys.argv[2]) if len(sys.argv) == 3 else None)
