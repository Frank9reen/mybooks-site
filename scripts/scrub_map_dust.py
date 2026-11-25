from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

p = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.png")
arr = np.asarray(Image.open(p).convert("RGB")).astype(np.float32)
lum = 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]
sat = arr.max(axis=2) - arr.min(axis=2)
mx = arr.max(axis=2)
bg = np.array([5.0, 7.0, 9.0])

# Strong line / marker paint
line = (sat > 38) & (mx > 55)
near = np.asarray(Image.fromarray((line.astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(3))) > 0

# Anything not line-ish becomes pure bg
out = arr.copy()
out[~near] = bg

# Also kill cyan/teal leftover labels even if slightly saturated
cyan = (arr[..., 2] > 70) & (arr[..., 1] > 50) & (arr[..., 0] < 90) & (sat < 90) & (lum < 160)
out[cyan] = bg

# Tiny speck cleanup
lum2 = 0.2126 * out[..., 0] + 0.7152 * out[..., 1] + 0.0722 * out[..., 2]
sat2 = out.max(axis=2) - out.min(axis=2)
line2 = (sat2 > 38) & (out.max(axis=2) > 55)
near2 = np.asarray(Image.fromarray((line2.astype(np.uint8) * 255)).filter(ImageFilter.MaxFilter(3))) > 0
out[(lum2 > 12) & (sat2 < 25) & ~near2] = bg

res = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
res.save(p, optimize=True)
res.save(p.with_suffix(".jpg"), quality=95, subsampling=0)
res.resize((900, 961), Image.Resampling.LANCZOS).save(
    Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\_preview-dark-clean.jpg"), quality=90
)
res.crop((350, 150, 750, 450)).resize((900, 675), Image.Resampling.BICUBIC).save(
    Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\_zoom-north.png")
)
print("scrubbed")
