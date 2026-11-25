"""Build 2:3 book-cover images from square art — full bleed, no title plate."""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(r"d:\PYTHON\4-Sites\mybooks-site\assets\covers")
W, H = 900, 1350


def make(src_name: str, dest_name: str, trim_bottom: float = 0.0):
    src = Image.open(OUT / src_name).convert("RGB")
    m = int(src.width * 0.015)
    bottom = src.height - int(src.height * trim_bottom) if trim_bottom else src.height
    art = src.crop((m, 0, src.width - m, bottom))

    # Cover-fit into 2:3 (scale to fill, center crop)
    scale = max(W / art.width, H / art.height)
    nw, nh = int(art.width * scale), int(art.height * scale)
    art = art.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - W) // 2
    top = max(0, (nh - H) // 2 - int(H * 0.02))  # slight bias up for faces
    if top + H > nh:
        top = nh - H
    canvas = art.crop((left, top, left + W, top + H))

    draw = ImageDraw.Draw(canvas)
    draw.rectangle([0, 0, W - 1, H - 1], outline=(55, 48, 42))

    # subtle left laminate edge
    gloss = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(gloss)
    for i in range(14):
        gd.rectangle([i, 0, i, H], fill=(255, 255, 255, max(0, 16 - i)))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), gloss).convert("RGB")

    dest = OUT / dest_name
    canvas.save(dest, quality=93, optimize=True)
    print("ok", dest.name, canvas.size)


if __name__ == "__main__":
    make("part1.png", "part1-book.jpg")
    make("part2.jpg", "part2-book.jpg", trim_bottom=0.20)
    make("part1-alt.png", "part1-alt-book.jpg")
