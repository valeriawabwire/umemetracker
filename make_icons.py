import struct
import zlib

BOLT = [(0.58, 0.08), (0.26, 0.54), (0.46, 0.54), (0.40, 0.92), (0.74, 0.44), (0.54, 0.44), (0.66, 0.08)]


def inside(px, py, poly):
    result = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
            result = not result
        j = i
    return result


def chunk(tag, data):
    body = tag + data
    return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)


def make_icon(size, path):
    # keep the bolt inside the centre 60% so it survives round or squircle masks
    poly = [(0.2 + 0.6 * x, 0.2 + 0.6 * y) for x, y in BOLT]
    rows = []
    for y in range(size):
        t = y / size
        bg = (int(11 + 7 * t), int(27 + 21 * t), int(52 + 40 * t))
        row = bytearray([0])
        for x in range(size):
            if inside((x + 0.5) / size, (y + 0.5) / size, poly):
                row.extend((245, 158, 11))
            else:
                row.extend(bg)
        rows.append(bytes(row))
    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(b"".join(rows), 9))
        + chunk(b"IEND", b"")
    )
    with open(path, "wb") as f:
        f.write(png)
    print("wrote", path)


make_icon(192, "static/img/icon-192.png")
make_icon(512, "static/img/icon-512.png")
