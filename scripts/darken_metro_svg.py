# -*- coding: utf-8 -*-
"""Adapt Wikimedia Moscow metro SVG (CC BY-SA 3.0, Sameboat) for dark site theme."""
from pathlib import Path
import re

src = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-ru.svg")
dst = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-dark.svg")
text = src.read_text(encoding="utf-8")

# Background: add dark rect after opening svg tag
bg = '<rect id="site-bg" x="30" y="0" width="1270" height="1620" fill="#0a1014"/>'
text = text.replace("<title>Moscow Metro map in Russian</title>", "<title>Moscow Metro map in Russian</title>\n\t" + bg, 1)

# White strokes/fills used as halos -> dark charcoal
replacements = [
    (r"stroke:#fff\b", "stroke:#0a1014"),
    (r"fill:#fff\b", "fill:#0a1014"),
    (r"stroke:#ffffff\b", "stroke:#0a1014"),
    (r"fill:#ffffff\b", "fill:#0a1014"),
    (r"\.river \{fill:none;stroke:#eafaff\}", ".river {fill:none;stroke:#1a3a44}"),
    (r"\.rn \{fill:#55f\}", ".rn {fill:#3a6a88}"),
    (r"\.osi \{fill:#fff;stroke-width:1;stroke:#4af;cursor:help\}", ".osi {fill:#152028;stroke-width:1;stroke:#4af;cursor:help}"),
    (r"\.aerob \{fill:none;stroke-width:5;stroke:#ddd\}", ".aerob {fill:none;stroke-width:5;stroke:#334}"),
    (r"\.aeroo \{fill:none;stroke-width:4;stroke:#fff;stroke-dasharray:10\}", ".aeroo {fill:none;stroke-width:4;stroke:#0a1014;stroke-dasharray:10}"),
    (r"\.pmk \{stroke:#ffeaaa\}", ".pmk {stroke:#c8b070}"),
    (r"\.fmk \{fill:#ffeaaa\}", ".fmk {fill:#c8b070}"),
    (r"\.railway \{stroke-width:4px;stroke:#fff;stroke-dasharray:10\}", ".railway {stroke-width:4px;stroke:#0a1014;stroke-dasharray:10}"),
]
for a, b in replacements:
    text = re.sub(a, b, text)

# Soften default text color via style
text = text.replace(
    "text {font-family:Arimo,Liberation Sans,Arial,sans-serif}",
    "text {font-family:Arimo,Liberation Sans,Arial,sans-serif;fill:#c8d0cc}",
)

# Attribution note for site
note = (
    "\n<!-- Adapted for site theme. Base map: Sameboat / Wikimedia, CC BY-SA 3.0. "
    "Stations Мнёвники marked as lore overlay (opened after this schematic). -->\n"
)
text = text.replace("</svg>", note + "</svg>")

# Hide decorative boxes that clutter the interactive overlay
text = text.replace(
    'id="title_group" style="opacity:1"',
    'id="title_group" style="opacity:0;display:none"',
)
text = text.replace(
    'transform="translate(970,10)" id="monorail_minimap"',
    'transform="translate(970,10)" id="monorail_minimap" style="opacity:0;display:none"',
)
text = text.replace(
    'id="linebox_group" transform="translate(40,1350)" style="opacity:1"',
    'id="linebox_group" transform="translate(40,1350)" style="opacity:0;display:none"',
)

dst.write_text(text, encoding="utf-8")
print("wrote", dst, "bytes", dst.stat().st_size)
