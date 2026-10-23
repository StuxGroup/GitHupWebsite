"""The favicon set at the site root and the tags every page's <head> carries for it."""
import json
import struct
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
PNG = b"\x89PNG\r\n\x1a\n"

TAGS = [
    '<link rel="icon" href="/favicon.ico" sizes="48x48">',
    '<link rel="icon" href="/assets/icon.png" type="image/png" sizes="512x512">',
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
    '<link rel="manifest" href="/site.webmanifest">',
]


def png_size(data: bytes):
    assert data[:8] == PNG
    return struct.unpack(">II", data[16:24])


def png_colour_type(data: bytes) -> int:
    return data[25]


class FaviconTest(unittest.TestCase):
    def test_favicon_ico_holds_16_32_and_48px_pngs(self):
        data = (SITE / "favicon.ico").read_bytes()
        reserved, kind, count = struct.unpack("<HHH", data[:6])
        self.assertEqual((0, 1), (reserved, kind))
        sizes = set()
        for i in range(count):
            entry = data[6 + 16 * i: 22 + 16 * i]
            size, offset = struct.unpack("<II", entry[8:16])
            image = data[offset:offset + size]
            self.assertEqual(PNG, image[:8], "PNG-in-ICO")
            sizes.add(png_size(image))
        self.assertEqual({(16, 16), (32, 32), (48, 48)}, sizes)

    def test_apple_touch_icon_is_180px_and_opaque(self):
        data = (SITE / "apple-touch-icon.png").read_bytes()
        self.assertEqual((180, 180), png_size(data))
        self.assertIn(png_colour_type(data), (0, 2), "no alpha channel: iOS fills transparency with black")

    def test_manifest(self):
        m = json.loads((SITE / "site.webmanifest").read_text(encoding="utf-8"))
        for key in ("name", "short_name", "theme_color", "background_color"):
            self.assertTrue(m.get(key), key)
        self.assertEqual("/", m["start_url"])
        self.assertEqual("browser", m["display"])
        found = set()
        for icon in m["icons"]:
            data = (SITE / icon["src"].lstrip("/")).read_bytes()
            w, h = png_size(data)
            self.assertEqual(icon["sizes"], f"{w}x{h}", icon["src"])
            if icon.get("purpose") == "maskable":
                self.assertIn(png_colour_type(data), (0, 2), "the maskable icon needs an opaque background")
            found.add((w, icon.get("purpose", "any")))
        self.assertLessEqual({(192, "any"), (512, "any"), (512, "maskable")}, found)

    def test_every_page_links_the_set(self):
        pages = sorted(SITE.rglob("*.html"))
        self.assertTrue(pages)
        for p in pages:
            head = p.read_text(encoding="utf-8").split("</head>", 1)[0]
            self.assertIn("<head", head, p)
            for tag in TAGS:
                self.assertIn(tag, head, p.relative_to(SITE).as_posix())


if __name__ == "__main__":
    unittest.main()
