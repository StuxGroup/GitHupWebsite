"""The Discord link previews (component embeds) written into each page's <head> by
scripts/build-discord-embeds.py. Spec: https://docs.discord.com/developers/link-previews/component-embeds"""
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"

_spec = importlib.util.spec_from_file_location("build_discord_embeds", ROOT / "scripts/build-discord-embeds.py")
B = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(B)

BLOCK = re.compile(r'<script id="discord:component-embed" type="application/json">(.*?)</script>', re.S)
ALLOWED_TYPES = {1, 2, 9, 10, 11, 12, 14, 17}
BUTTON_KEYS = {"id", "type", "url", "style", "label", "emoji", "disabled"}


def pages():
    return sorted(SITE.rglob("*.html"))


def walk(component):
    yield component
    for child in component.get("components", []):
        yield from walk(child)
    if "accessory" in component:
        yield from walk(component["accessory"])


class DiscordEmbedTest(unittest.TestCase):
    def assert_valid(self, raw: str, where: str):
        self.assertLessEqual(len(raw.encode("utf-8")), 3000, where + ": over Discord's 3,000-byte limit")
        self.assertNotIn("</script", raw.lower(), where)
        data = json.loads(raw)
        root = data["component"]
        self.assertEqual(17, root["type"], where + ": the root must be one Container")
        nested = list(walk(root))[1:]
        self.assertFalse([c for c in nested if c["type"] == 17], where + ": no nested Containers")
        self.assertLessEqual(len(nested) + 1, 40, where + ": at most 40 components")
        for c in nested:
            self.assertIn(c["type"], ALLOWED_TYPES, where)
            if c["type"] == 2:
                self.assertEqual(5, c["style"], where + ": link buttons only")
                self.assertLessEqual(set(c), BUTTON_KEYS, where)
                self.assertRegex(c["url"], r"^https?://", where)
        return data

    def test_every_page_but_404_has_one_valid_embed(self):
        self.assertTrue(pages())
        for p in pages():
            name = p.relative_to(SITE).as_posix()
            html = p.read_text(encoding="utf-8")
            head = html.split("</head>", 1)[0]
            blocks = BLOCK.findall(head)
            if name == "404.html":
                self.assertEqual([], blocks, "error pages get no embed")
                self.assertNotIn("discord:component-embed", html)
                continue
            self.assertEqual(1, len(blocks), name)
            self.assertEqual(1, len(BLOCK.findall(html)), name + ": the embed belongs in <head>")
            self.assert_valid(blocks[0], name)
            self.assertIn('property="og:title"' if name != "changelog/index.html" else "<title>", html,
                          name + ": Open Graph tags stay as the fallback")

    def test_main_page_types_have_their_own_preview(self):
        seen = {}
        for path, url in (("index.html", "/"), ("docs/index.html", "/docs/"), ("changelogs/index.html", "/changelogs/"),
                          ("legal/index.html", "/legal/"), ("legal/privacy/index.html", "/legal/privacy/")):
            raw = BLOCK.search((SITE / path).read_text(encoding="utf-8")).group(1)
            seen[url] = raw
            self.assertIn(B.ICON, raw)
            self.assertEqual(int(B.ACCENT.lstrip("#"), 16), json.loads(raw)["component"]["accent_color"])
        self.assertEqual(4, len({seen[u] for u in ("/", "/docs/", "/changelogs/", "/legal/")}))

    def test_committed_blocks_are_up_to_date(self):
        sources = {p: p.read_text(encoding="utf-8") for p in B.pages()}
        descs = {B.meta(t)["url"]: B.meta(t)["desc"] for t in sources.values() if B.meta(t)["desc"]}
        for p, html in sources.items():
            self.assertEqual(html, B.build(html, descs), f"{p.name}: run python scripts/build-discord-embeds.py")

    def test_markdown_is_escaped(self):
        self.assertEqual(r"\*\*bold\*\* a\_b", B.discord_md("**bold** a_b"))
        self.assertNotIn("$1", B.discord_md("**bold** a_b"))
        self.assertEqual(r"\~\~s\~\~ \`c\` \|\|x\|\| \[l\](u) a\\b", B.discord_md(r"~~s~~ `c` ||x|| [l](u) a\b"))
        self.assertEqual("\\# h\n\\> q\n\\- l\nmid # > -", B.discord_md("# h\n> q\n- l\nmid # > -"))

    def test_data_with_markdown_and_script_tags_renders_safely(self):
        title = "**Bold** _it_ ~~x~~ `c` ||s|| > # [a](b) </script><!--"
        for builder in (B.home_embed, B.docs_embed, B.changelogs_embed, B.legal_embed, B.page_embed):
            out = builder(title, title, B.BASE_URL + "/x/")
            raw = BLOCK.fullmatch(out).group(1)
            self.assert_valid(raw, builder.__name__)
            content = "\n".join(c["content"] for c in walk(json.loads(raw)["component"]) if c["type"] == 10)
            self.assertIn(r"\*\*Bold\*\* \_it\_ \~\~x\~\~ \`c\` \|\|s\|\|", content, builder.__name__)
            self.assertIsNone(re.search(r"(?<!\\)\*\*Bold", content), builder.__name__)
            self.assertIn(r"\[a\](b) </script>", content, builder.__name__)
            self.assertNotIn("$1", raw)
            self.assertNotIn("<", raw, "'<' is written as \\u003c so data can't close the tag or open a comment")

    def test_oversized_payload_falls_back_to_a_comment(self):
        out = B.page_embed("x" * 4000, "y", B.BASE_URL + "/")
        self.assertTrue(out.startswith("<!-- discord:component-embed"), out[:80])
        self.assertNotIn("<script", out)


if __name__ == "__main__":
    unittest.main()
