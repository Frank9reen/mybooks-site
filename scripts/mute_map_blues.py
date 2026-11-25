"""Remove blue/cyan pictograms and bright blue labels; keep darker blue metro lines."""
from collections import deque
from pathlib import Path

from PIL import Image

src = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.jpg")
backup = src.with_name("moscow-metro-hq-dark-web.bak.jpg")

base = backup if backup.exists() else src
im = Image.open(base).convert("RGB")
if not backup.exists():
    im.copy().save(backup, quality=92)

w, h = im.size
pix = im.load()


def is_target_blue(r, g, b):
    """Bright icon/label blues and cyans, not dark line cores."""
    if max(r, g, b) < 70:
        return False
    # classic pictogram blue
    if b >= 100 and b > r + 25 and b > g + 15 and r < 160 and g < 170:
        if r + g < 45 and b < 120:
            return False
        return True
    # cyan / light-blue station callouts
    if b >= 140 and g >= 90 and r < 140 and b >= g and (b - r) >= 40:
        return True
    # mid blue icon fill
    if 70 <= b <= 220 and b > r + 30 and b > g + 20 and r < 120 and g < 140:
        return True
    return False


mask = [[is_target_blue(*pix[x, y]) for x in range(w)] for y in range(h)]
visited = [[False] * w for _ in range(h)]
removed = 0

for y0 in range(h):
    for x0 in range(w):
        if not mask[y0][x0] or visited[y0][x0]:
            continue
        q = deque([(x0, y0)])
        visited[y0][x0] = True
        cells = []
        minx = maxx = x0
        miny = maxy = y0
        while q:
            x, y = q.popleft()
            cells.append((x, y))
            minx = min(minx, x)
            maxx = max(maxx, x)
            miny = min(miny, y)
            maxy = max(maxy, y)
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1),
                           (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1), (x + 1, y + 1)):
                if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not visited[ny][nx]:
                    visited[ny][nx] = True
                    q.append((nx, ny))

        bw = maxx - minx + 1
        bh = maxy - miny + 1
        n = len(cells)
        aspect = bw / max(bh, 1)
        long_thin = (bw > 110 or bh > 110) and min(bw, bh) < 22
        # Keep continuous metro line strokes
        if long_thin and n > 400:
            continue
        if n > 3500 and (aspect > 4 or aspect < 0.25):
            continue
        if n < 6:
            continue
        # Compact icons and short label glyphs
        for x, y in cells:
            pix[x, y] = (9, 11, 13)
            removed += 1

im.save(src, quality=92)
print(f"removed {removed} pixels from {base.name} -> {src.name}")
