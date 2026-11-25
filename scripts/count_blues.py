from collections import Counter
from pathlib import Path
from PIL import Image

im = Image.open(Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.jpg")).convert("RGB")
px = im.load()
w, h = im.size
c = Counter()
n = 0
for y in range(0, h, 2):
    for x in range(0, w, 2):
        r, g, b = px[x, y]
        if b > 100 and b > r + 25 and b > g + 10 and r < 160:
            c[(r // 10 * 10, g // 10 * 10, b // 10 * 10)] += 1
            n += 1
print("approx bright blue samples", n)
for k, v in c.most_common(15):
    print(v, k)
