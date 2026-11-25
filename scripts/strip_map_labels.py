"""Strip station-name glyphs from dark metro map; keep lines and markers."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

src = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.png")
out_png = src
out_jpg = src.with_suffix(".jpg")
preview = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\_preview-dark-clean.jpg")

im = Image.open(src).convert("RGB")
arr = np.asarray(im).astype(np.float32)
r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
sat = mx - mn

bg = np.array([6.0, 8.0, 10.0], dtype=np.float32)

# Light/gray label ink (not saturated line paint)
label = (lum > 120) & (sat < 55)
# Also mid anti-alias of labels
label_soft = (lum > 55) & (lum <= 120) & (sat < 40)

# Protect vivid metro lines / markers
line = (sat > 45) & (mx > 70)
# Small saturated station rings often have high sat — keep them
protect = line

kill = (label | label_soft) & ~protect
# Expand a bit to catch leftover contour sludge
kill_u8 = (kill.astype(np.uint8) * 255)
kill = np.asarray(Image.fromarray(kill_u8).filter(ImageFilter.MaxFilter(3))) > 0
kill &= ~protect

out = arr.copy()
out[kill] = bg

# Second pass: any remaining low-sat light speckles
lum2 = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]
sat2 = out.max(axis=2) - out.min(axis=2)
mx2 = out.max(axis=2)
dust = (lum2 > 40) & (sat2 < 35) & (mx2 < 200)
# don't eat soft line edges: require not near strong line color
line2 = (sat2 > 50) & (mx2 > 80)
near_line = np.asarray(
    Image.fromarray(((line2).astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(3))
) > 0
out[dust & ~near_line] = bg

result = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
result.save(out_png, optimize=True)
result.save(out_jpg, quality=95, subsampling=0)
result.resize((900, 961), Image.Resampling.LANCZOS).save(preview, quality=90)
result.crop((350, 150, 750, 450)).resize((900, 675), Image.Resampling.BICUBIC).save(
    Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\_zoom-north.png")
)
print("stripped labels ->", out_png.name)
