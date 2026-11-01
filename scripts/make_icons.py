#!/usr/bin/env python3
"""Gera os ícones do app só com a biblioteca padrão (zlib + struct).

Uso: python3 -I scripts/make_icons.py
"""
import math
import os
import struct
import zlib

BG = (0x14, 0x21, 0x3D)
YELLOW = (0xFC, 0xBF, 0x49)
ORANGE = (0xF7, 0x7F, 0x00)
WHITE = (0xFF, 0xFF, 0xFF)
SS = 4  # supersampling 4x4


def color_at(x, y, scale):
    """Cor no ponto (x, y) em [0, 1]; scale reduz o desenho (zona segura)."""
    d = math.hypot(x - 0.5, y - 0.5) / scale
    if d < 0.18:
        return WHITE
    if d < 0.36:
        return YELLOW
    if d < 0.43:
        return ORANGE
    return BG


def render(size, scale=1.0):
    rows = []
    for py in range(size):
        row = bytearray([0])  # filtro PNG: nenhum
        for px in range(size):
            r = g = b = 0
            for sy in range(SS):
                for sx in range(SS):
                    c = color_at((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, scale)
                    r += c[0]
                    g += c[1]
                    b += c[2]
            n = SS * SS
            row += bytes((r // n, g // n, b // n))
        rows.append(bytes(row))
    return b''.join(rows)


def write_png(path, size, scale=1.0):
    raw = render(size, scale)

    def chunk(tag, data):
        body = tag + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(png)
    print(path)


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
    os.makedirs(out, exist_ok=True)
    write_png(os.path.join(out, 'icon-192.png'), 192)
    write_png(os.path.join(out, 'icon-512.png'), 512)
    # Maskable: a bola cabe nos 80% centrais (zona segura).
    write_png(os.path.join(out, 'icon-maskable-512.png'), 512, scale=0.9)
    write_png(os.path.join(out, 'apple-touch-icon.png'), 180)
