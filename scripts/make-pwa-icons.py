"""Phase C (HO-OMNI-29) — génère les icônes PWA aux vraies tailles (stdlib only).

Constat mesuré : pwa-icon-192.png et pwa-icon-512.png faisaient 1254x1254,
et le manifest annonçait 192/512 pour des fichiers 512/1254. Ce script part de
public/omni-logo.png (1254, RGB) et écrit des fichiers aux dimensions annoncées.
Relançable : `python3 scripts/make-pwa-icons.py`.
"""
import struct
import zlib


def read_png(path):
    data = open(path, 'rb').read()
    assert data[:8] == b'\x89PNG\r\n\x1a\n', path
    pos, width, height, channels = 8, None, None, None
    raw = b''
    while pos < len(data):
        (length,) = struct.unpack('>I', data[pos:pos + 4])
        kind = data[pos + 4:pos + 8]
        chunk = data[pos + 8:pos + 8 + length]
        if kind == b'IHDR':
            width, height, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', chunk)
            assert depth == 8 and interlace == 0, (path, depth, interlace)
            channels = {2: 3, 6: 4}[ctype]
        elif kind == b'IDAT':
            raw += chunk
        pos += 12 + length
    stride = width * channels
    pixels = bytearray(width * height * channels)
    prev = bytearray(stride)
    stream = zlib.decompress(raw)
    p = 0
    for y in range(height):
        f = stream[p]
        p += 1
        line = bytearray(stream[p:p + stride])
        p += stride
        if f == 1:
            for i in range(channels, stride):
                line[i] = (line[i] + line[i - channels]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - channels] if i >= channels else 0
                b = prev[i]
                c = prev[i - channels] if i >= channels else 0
                v = a + b - c
                pa, pb, pc = abs(v - a), abs(v - b), abs(v - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        elif f != 0:
            raise ValueError(f'filter {f}')
        pixels[y * stride:(y + 1) * stride] = line
        prev = line
    return width, height, channels, pixels


def downscale(width, height, channels, pixels, target):
    out = bytearray(target * target * channels)
    scale = width / target
    for oy in range(target):
        for ox in range(target):
            x0, y0 = int(ox * scale), int(oy * scale)
            x1, y1 = min(int((ox + 1) * scale), width), min(int((oy + 1) * scale), height)
            acc = [0] * channels
            n = 0
            for y in range(y0, y1):
                for x in range(x0, x1):
                    base = (y * width + x) * channels
                    for c in range(channels):
                        acc[c] += pixels[base + c]
                    n += 1
            base = (oy * target + ox) * channels
            for c in range(channels):
                out[base + c] = acc[c] // max(n, 1)
    return out


def write_png(path, size, pixels):
    channels = len(pixels) // (size * size)
    ctype = 6 if channels == 4 else 2
    raw = bytearray()
    stride = size * channels
    for y in range(size):
        raw.append(0)
        raw += pixels[y * stride:(y + 1) * stride]
    blob = struct.pack('>IIBBBBB', size, size, 8, ctype, 0, 0, 0)
    ihdr = b'IHDR' + blob
    ihdr = struct.pack('>I', len(blob)) + ihdr + struct.pack('>I', zlib.crc32(ihdr) & 0xFFFFFFFF)
    comp = zlib.compress(bytes(raw), 9)
    idat = b'IDAT' + comp
    idat = struct.pack('>I', len(comp)) + idat + struct.pack('>I', zlib.crc32(idat) & 0xFFFFFFFF)
    iend = struct.pack('>I', 0) + b'IEND' + struct.pack('>I', zlib.crc32(b'IEND') & 0xFFFFFFFF)
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + ihdr + idat + iend)
    print(f'{path}: {size}x{size} ch={channels}')


def main():
    width, height, channels, pixels = read_png('public/omni-logo.png')
    assert width == height, 'logo carré attendu'
    rgb = pixels
    if channels == 4:
        rgb = bytearray()
        for i in range(0, len(pixels), 4):
            rgb += pixels[i:i + 3]
        channels = 3
    write_png('public/pwa-icon-192.png', 192, downscale(width, height, channels, rgb, 192))
    write_png('public/pwa-icon-512.png', 512, downscale(width, height, channels, rgb, 512))
    # Maskable : logo à 80% centré sur fond thème (zone de sécurité).
    inner = downscale(width, height, channels, rgb, 410)
    bg = (0xF9, 0xF9, 0xF7)
    canvas = bytearray(512 * 512 * 3)
    for y in range(512):
        for x in range(512):
            canvas[(y * 512 + x) * 3:(y * 512 + x) * 3 + 3] = bytes(bg)
    off = (512 - 410) // 2
    for y in range(410):
        for x in range(410):
            dst = ((y + off) * 512 + (x + off)) * 3
            src = (y * 410 + x) * 3
            canvas[dst:dst + 3] = inner[src:src + 3]
    write_png('public/pwa-maskable-512.png', 512, canvas)


if __name__ == '__main__':
    main()
