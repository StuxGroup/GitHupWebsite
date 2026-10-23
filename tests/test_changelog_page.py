"""The /changelogs/ page (site/assets/changelogs.js + site.css): Date Version headings and the
fixed section order and colours."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS = (ROOT / "site/assets/changelogs.js").read_text(encoding="utf-8")
CSS = (ROOT / "site/assets/site.css").read_text(encoding="utf-8")

ORDER = ["Added", "Changed", "Fixed", "Removed", "Security", "Deprecated"]
COLOURS = {"added": "#2ecc71", "changed": "#3ba7ff", "fixed": "#ffa64d",
           "removed": "#ff4d4d", "security": "#b06bff", "deprecated": "#8a8a94"}

SAMPLE = "# Changelog\n\nIntro.\n\n## v26.10.23-1\n\n### Fixed\n\n- b\n\n## v26.10.23\n\n### Added\n\n- a\n\n## v1.4.4\n"


def js_regex(pattern_start: str) -> re.Pattern:
    """A regex literal from changelogs.js (they're plain enough to read as Python regexes)."""
    m = re.search(r"md\.match\(/(" + re.escape(pattern_start) + r"[^/]*)/m\)", JS)
    assert m, "regex not found in changelogs.js: " + pattern_start
    return re.compile(m.group(1), re.M)


class ChangelogPageTest(unittest.TestCase):
    def test_release_headings_accept_date_versions(self):
        # Every "## ..." line is a release; the heading text is shown as written.
        heading = re.compile(re.search(r"line\.match\(/(\^##\\s\+\(\.\+\)\$)/\)", JS).group(1))
        for v in ("v26.10.23", "v26.10.23-1", "v26.10.23-12", "v1.4.4"):
            m = heading.match("## " + v)
            self.assertIsNotNone(m, v)
            self.assertEqual(v, m.group(1))

    def test_version_badge_keeps_the_same_day_suffix(self):
        top = js_regex(r"^##\s+v?")
        self.assertEqual("26.10.23-1", top.search(SAMPLE).group(1))
        self.assertEqual("26.10.23", top.search(SAMPLE.replace("## v26.10.23-1\n\n### Fixed\n\n- b\n\n", "")).group(1))

    def test_section_order(self):
        m = re.search(r"var ORDER = \[([^\]]*)\]", JS)
        self.assertEqual(ORDER, re.findall(r'"([A-Za-z]+)"', m.group(1)))

    def test_badge_colours(self):
        for name, hex_ in COLOURS.items():
            m = re.search(r"^\.cl-label-" + name + r"\s*\{\s*--cl:\s*(#[0-9a-f]{6})", CSS, re.M)
            self.assertIsNotNone(m, name)
            self.assertEqual(hex_, m.group(1), name)


if __name__ == "__main__":
    unittest.main()
