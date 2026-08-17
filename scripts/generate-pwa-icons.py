from PIL import Image
from pathlib import Path

source = Image.open(Path("public/favicon.png")).convert("RGBA")
for size in (192, 512):
    target = source.resize((size, size), Image.Resampling.LANCZOS)
    target.save(Path(f"public/pwa-icon-{size}.png"), optimize=True)
