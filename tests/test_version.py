"""GitHupWebsite uses Date Versioning (https://datevers.ing): the UTC release date as YY.MM.DD,
plus -1, -2... for later releases the same day."""
import datetime
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# The spec's own pattern (2000-2099 form), which leaves calendar validity to a separate check.
DATEVER = re.compile(r"^[0-9]{2}\.(0[1-9]|1[0-2])\.(0[1-9]|[12][0-9]|3[01])(?:-[1-9][0-9]*)?$")


def version() -> str:
    return (ROOT / "VERSION.md").read_text(encoding="utf-8").strip()


class VersionTest(unittest.TestCase):
    def test_version_is_a_real_date_version(self):
        v = version()
        self.assertRegex(v, DATEVER)
        yy, mm, dd = (int(p) for p in v.split("-")[0].split("."))
        try:
            datetime.date(2000 + yy, mm, dd)
        except ValueError:
            self.fail(f"{v} isn't a real calendar date")

    def test_version_is_not_in_the_future(self):
        yy, mm, dd = (int(p) for p in version().split("-")[0].split("."))
        today = datetime.datetime.now(datetime.timezone.utc).date()
        self.assertLessEqual(datetime.date(2000 + yy, mm, dd), today, "Date Versions are never dated after today (UTC)")

    def test_changelog_leads_with_the_current_version(self):
        m = re.search(r"^## v(\S+)", (ROOT / "CHANGELOG.md").read_text(encoding="utf-8"), re.M)
        self.assertEqual(version(), m.group(1) if m else None,
                         "the newest CHANGELOG.md entry should be the version in VERSION.md")


if __name__ == "__main__":
    unittest.main()
