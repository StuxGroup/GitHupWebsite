<p align="center">
  <img src="site/assets/icon.svg" width="72" height="72" alt="GitHup">
</p>

# Contributing to GitHupWebsite

GitHupWebsite is the website for GitHup, [a Stux.Group Service](https://services.stux.group).
Issues and pull requests are welcome. Bugs or ideas for GitHup itself belong in
[StuxGroup/GitHup](https://github.com/StuxGroup/GitHup/issues).

## Local setup

You need Python 3.11+ and nothing else.

```bash
./dev-server.sh [--no-dev-mode] [port]   # or dev-server.bat on Windows
```

See the [README](README.md#local-development) for what it does.

## Tests

```bash
./tests/run.sh        # add -v for each test's name
```

Plain Python `unittest`, no dependencies. The tests check `VERSION.md` and the changelog, the
`/changelogs/` page's version and section handling, the Discord previews and the favicon set.
Run them before every release.

## Project conventions

- **Static and dependency-free.** Plain HTML in `site/`, one stylesheet (`site/assets/site.css`)
  and one script (`site/assets/site.js`). No frameworks, no build step, no external scripts or
  fonts. Pages use root-relative links (`/assets/…`, `/legal/…`), because the site is served
  from the root of `githup.stux.group`.
- **Header and footer are repeated in every page.** When you change one, change all of them:
  `index.html`, `404.html`, `docs/index.html`, `changelogs/index.html`, `legal/index.html` and
  the six `legal/*/index.html` pages. Each page's `<head>` also carries the one-line theme boot
  script, so the chosen theme applies before the page paints, and the same favicon tags
  (`/favicon.ico`, `/assets/icon.png`, `/apple-touch-icon.png`, `/site.webmanifest`); a new page
  needs them too.
- **Discord previews.** Every page except `404.html` has a Discord link preview (a
  `discord:component-embed` JSON block) in its `<head>`, generated from the page's `<title>`,
  description and URL. After changing a page's title or description, or adding a page, run
  `python scripts/build-discord-embeds.py` (after `build-sitemap.py`) and commit the result;
  `--check` only reports pages that are out of date. Never edit the JSON by hand.
- **Brand.** Dark `#0d1117` background, text `#f0f3f6` / `#c9d1d9`, muted `#8b949e`, and the
  `#b06bff` → `#3ba7ff` gradient from GitHup's social preview. The light theme uses `#f6f7fb` /
  white with `#16181d` / `#3b4250` text. Every colour is a token on `:root` in `site.css`,
  redefined for light under `prefers-color-scheme: light` and `[data-theme="light"]`; add new
  colours as tokens in both places, never inline. The theme choice is stored under
  `githup-theme`, the same key GitHup status pages use, so the site and `/demo/` agree.
- **Docs.** `/docs/` is GitHup's `README.md`, fetched from the `v1` tag and rendered by
  `assets/docs.js`; to change the docs, change the README in the GitHup repo. The logo files in `site/assets/`
  are copies of the ones in the GitHup repo; update both together.
- **Legal pages.** The footer always links to **Boring Legal Stuff** at `/legal/`, which links to
  Privacy Policy, Terms and Ethics, Cookies Policy, Imprint, Disclaimer and Opt-Out Preferences.
  Keep them accurate when the site changes (for example if it ever adds analytics or cookies).
- **Sitemap.** `site/sitemap.xml`, `site/sitemap/index.html` and `site/robots.txt` are generated: after adding or removing a page, edit the `PAGES` list in `scripts/build-sitemap.py` and run `python scripts/build-sitemap.py`, then commit the result. Every footer also links to **Sitemap** next to Boring Legal Stuff.
- **Don't edit `data/` by hand.** It belongs to GitHup and the workflow.

## Versioning and changelog

- GitHupWebsite uses [Date Versioning](https://datevers.ing): the version is the UTC release
  date as `YY.MM.DD`, plus `-1`, `-2`... for later releases the same UTC day. Use UTC
  (`date -u +%y.%m.%d`), never local time, and never a future date: check `git tag -l "vYY.MM.DD*"`
  for today's date and take the next free number. Releases up to v1.4.4 used Semantic Versioning.
- The version lives in `VERSION.md` (the bare version, no `v`). Bump it on every release, and
  start the release's `CHANGELOG.md` entry with `## vYY.MM.DD`.
- Every release gets a `CHANGELOG.md` entry using `###` subsections in this order: Added,
  Changed, Fixed, Removed, Security, Deprecated. Never a bare bullet list under a version.
- `commit.sh` (bash) and `commit.bat` (Windows) read `VERSION.md`, refuse a version that isn't
  a valid Date Version or is dated after today (UTC), warn when it's dated before today, then
  commit and create the annotated `vYY.MM.DD` tag. They don't push: push with
  `git push origin main vYY.MM.DD`.
