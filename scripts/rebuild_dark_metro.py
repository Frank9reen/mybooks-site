"""Dark Lebedev map5 WITH station labels; grey lines boosted; paper/halos -> black."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

src = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\lebedev-map5.png")
out_png = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.png")
out_jpg = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\moscow-metro-hq-dark-web.jpg")
preview = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\maps\_preview-dark-clean.jpg")

im = Image.open(src).convert("RGB")
w0, h0 = im.size
im = im.crop((int(w0 * 0.03), int(h0 * 0.06), int(w0 * 0.97), int(h0 * 0.92)))
im = im.resize((1800, 1922), Image.Resampling.LANCZOS)
arr = np.asarray(im).astype(np.float32)

r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
mx = np.maximum(np.maximum(r, g), b)
mn = np.minimum(np.minimum(r, g), b)
sat = mx - mn

dark = arr.copy()
bg = np.array([6.0, 8.0, 10.0], dtype=np.float32)
ink = np.array([214.0, 218.0, 220.0], dtype=np.float32)

# 1) White paper + white text-stroke halos -> black (removes white contour rings)
paper = (lum > 205) | ((lum > 185) & (sat < 28))
suburb = (lum > 168) & (sat < 40) & (b >= g - 8) & (b > r)
halo = (lum > 175) & (sat < 38)
dark[paper | suburb | halo] = bg

# 2) Black / dark station labels -> light ink
text = (lum < 95) & (sat < 42)
# don't invert dark blue/brown line cores
text &= ~((sat > 35) & (mx > 55))
dark[text] = ink

# 3) Soft mid-gray leftover near glyphs -> bg (mud between paper and text)
mid = (lum >= 95) & (lum <= 170) & (sat < 28)
dark[mid] = bg

# Recompute after edits
r2, g2, b2 = dark[..., 0], dark[..., 1], dark[..., 2]
lum2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2
mx2 = np.maximum(np.maximum(r2, g2), b2)
mn2 = np.minimum(np.minimum(r2, g2), b2)
sat2 = mx2 - mn2

# 4) Boost grey metro lines (line 9 etc.) still visible as mid-grey from original
# After step1-3, grey line paint may still sit in restored color channels if it was
# mid-grey on light map and got painted bg by `mid` — recover from original
grey_src = (sat < 32) & (lum > 90) & (lum < 170)
# Only restore grey where we wiped it to bg and neighbors suggest a line
is_bg = (np.abs(dark - bg).sum(axis=2) < 8)
restore_grey = grey_src & is_bg
t = np.clip((lum[restore_grey] - 90) / 80.0, 0, 1)
silver = 170 + t * 50
dark[restore_grey, 0] = silver
dark[restore_grey, 1] = silver + 3
dark[restore_grey, 2] = silver + 6

# Also boost any remaining grey already present
grey_now = (sat2 < 38) & (lum2 > 70) & (lum2 < 200) & (np.abs(dark - bg).sum(axis=2) >= 8)
# exclude bright label ink
grey_now &= ~((lum2 > 190) & (sat2 < 40))
t2 = np.clip((lum2[grey_now] - 70) / 110.0, 0, 1)
silver2 = 165 + t2 * 55
dark[grey_now, 0] = silver2
dark[grey_now, 1] = silver2 + 3
dark[grey_now, 2] = silver2 + 6

# 5) Lift dim colored lines a bit
dim_color = (sat2 > 35) & (mx2 > 40) & (mx2 < 120)
dark[dim_color] = np.clip(dark[dim_color] * 1.25 + 12, 0, 255)

# 6) Mute flat blue pictogram icons (keep blue metro line)
icon = (b > 105) & (b > r + 28) & (b > g + 14) & (r < 145) & (sat > 40) & (lum > 75) & (lum < 195)
blue_line = (b > 90) & (b > r + 40) & (g < 120) & (sat > 55) & (lum < 160)
# icons on light map -> after convert may still be colorful; kill from original mask on dark
dark[icon & ~blue_line] = bg

result = Image.fromarray(np.clip(dark, 0, 255).astype(np.uint8))
result.save(out_png, optimize=True)
result.save(out_jpg, quality=94, subsampling=0)
result.resize((900, 961), Image.Resampling.LANCZOS).save(preview, quality=90)
print("labels restored:", out_png.name, out_jpg.name)
