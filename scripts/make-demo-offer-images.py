"""Generate the demo offer visuals served from /demo/ (Vite public dir).

These are synthetic but real images: a flat fill, a soft vignette, a plate and a
label. They exist so the demo can be honest - an offer with no visual fails S-32's
`visuel` integrity check and cannot be published, so "make the demo real" starts by
giving the offers a real picture.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public" / "demo"
OUT.mkdir(parents=True, exist_ok=True)

W = 800
SPECS = [
    ("box-dejeuner", (222, 122, 58), "BOX DEJEUNER", "Togolais - pret a emporter"),
    ("jus-gingembre", (46, 139, 111), "JUS DE GINGEMBRE", "Frais - presse du jour"),
    ("panier-fruits", (196, 148, 44), "PANIER FRUITS", "Fruits de saison - Lome"),
]


def font(size):
    for candidate in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


def build(slug, rgb, title, subtitle):
    img = Image.new("RGB", (W, W), rgb)
    draw = ImageDraw.Draw(img, "RGBA")
    # Soft vignette so the tile does not read as a flat rectangle.
    for i in range(200):
        draw.rectangle([i, i, W - i, W - i], outline=(*rgb, 8))
    # A plate with a ring, suggesting a product shot.
    cx, cy, r = W // 2, int(W * 0.42), int(W * 0.26)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 230))
    draw.ellipse(
        [cx - r - 6, cy - r - 6, cx + r + 6, cy + r + 6],
        outline=(255, 255, 255, 150),
        width=4,
    )
    draw.ellipse(
        [cx - r // 2, cy - r // 2, cx + r // 2, cy + r // 2],
        fill=(*rgb, 60),
    )
    # Label band.
    band = int(W * 0.72)
    draw.rectangle([0, band, W, W], fill=(15, 15, 15, 235))
    draw.text((W // 2, band + int(W * 0.06)), title, font=font(52), fill=(255, 255, 255), anchor="mm")
    draw.text((W // 2, band + int(W * 0.15)), subtitle, font=font(28), fill=(220, 220, 218), anchor="mm")
    path = OUT / f"{slug}.png"
    img.save(path, "PNG", optimize=True)
    return path


if __name__ == "__main__":
    for slug, rgb, title, subtitle in SPECS:
        print("wrote", build(slug, rgb, title, subtitle))
