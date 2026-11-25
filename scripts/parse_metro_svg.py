# -*- coding: utf-8 -*-
import re
from pathlib import Path

p = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-ru.svg")
text = p.read_text(encoding="utf-8")

vb = re.search(r'viewBox="([^"]+)"', text)
wh = re.search(r'width="([^"]+)".*?height="([^"]+)"', text, re.S)
print("viewBox", vb.group(1) if vb else None)
print("wh", wh.groups() if wh else None)

# Text nodes with x,y attributes (possibly on parent tspan)
pattern = re.compile(
    r'<text[^>]*?\bx="([0-9.]+)"[^>]*?\by="([0-9.]+)"[^>]*>(.*?)</text>',
    re.S,
)
wanted = [
    "Сокол",
    "Щукинская",
    "Петровско-Разумовская",
    "Савёловская",
    "Театральная",
    "Марьина Роща",
    "Кузнецкий Мост",
    "Водный стадион",
    "Речной вокзал",
    "Полежаевская",
    "Мнёвники",
]

found = []
for m in pattern.finditer(text):
    x, y, inner = m.group(1), m.group(2), re.sub(r"<[^>]+>", "", m.group(3))
    inner = " ".join(inner.split())
    for w in wanted:
        if w in inner or inner in w:
            found.append((inner, float(x), float(y)))
            break

# Also tspan-based texts: <text ...><tspan x y>
pattern2 = re.compile(
    r'<text[^>]*>(.*?)</text>',
    re.S,
)
for m in pattern2.finditer(text):
    block = m.group(0)
    inner = re.sub(r"<[^>]+>", "", m.group(1))
    inner = " ".join(inner.split())
    for w in wanted:
        if w == inner or (len(inner) > 3 and inner.startswith(w[:6])):
            ts = re.search(r'<tspan[^>]*\bx="([0-9.]+)"[^>]*\by="([0-9.]+)"', block)
            tx = re.search(r'\bx="([0-9.]+)"', block)
            ty = re.search(r'\by="([0-9.]+)"', block)
            if ts:
                found.append((inner, float(ts.group(1)), float(ts.group(2))))
            elif tx and ty:
                found.append((inner, float(tx.group(1)), float(ty.group(2))))
            break

# dedupe
uniq = {}
for name, x, y in found:
    uniq[name] = (x, y)

for name, (x, y) in sorted(uniq.items(), key=lambda i: i[1][1]):
    print(f"{name:30} x={x:7.1f} y={y:7.1f}")

# Mnevniki may be missing (map from 2016 before BCL west). Search raw.
for term in ["Мнёв", "Мнев", "Терехов", "Народное", "Хорошёв"]:
    print(term, text.find(term))
