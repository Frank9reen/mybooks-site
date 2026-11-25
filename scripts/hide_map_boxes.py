# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-dark.svg")
t = p.read_text(encoding="utf-8")
t = t.replace(
    'id="title_group" style="opacity:1"',
    'id="title_group" style="opacity:0;display:none"',
)
t = t.replace(
    'transform="translate(970,10)" id="monorail_minimap"',
    'transform="translate(970,10)" id="monorail_minimap" style="opacity:0;display:none"',
)
t = t.replace(
    'id="linebox_group" transform="translate(40,1350)" style="opacity:1"',
    'id="linebox_group" transform="translate(40,1350)" style="opacity:0;display:none"',
)
p.write_text(t, encoding="utf-8")
print("ok", p.stat().st_size)
