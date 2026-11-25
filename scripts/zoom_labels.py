from pathlib import Path
from PIL import Image

im = Image.open(Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.jpg"))
# central-ish labels area
crops = [
    ("center", (700, 850, 1100, 1150)),
    ("north", (350, 150, 750, 450)),
    ("west", (80, 700, 420, 1000)),
]
for name, box in crops:
    c = im.crop(box).resize((800, 600), Image.Resampling.NEAREST)
    p = Path(rf"d:\PYTHON\4-Sites\mybooks-site\assets\maps\_zoom-{name}.jpg")
    c.save(p, quality=92)
    print("saved", p.name)
