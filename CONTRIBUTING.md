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

## Project conventions

- **Static and dependency-free.** Plain HTML in `site/`, one stylesheet (`site/assets/site.css`)
  and one script (`site/assets/site.js`). No frameworks, no build step, no external scripts or
  fonts. Pages use root-relative links (`/assets/…`, `/legal/…`), because the site is served
  from the root of `githup.stux.group`.
- **Header and footer are repeated in every page.** When you change one, change all of them:
  `index.html`, `404.html`, `docs/index.html`, `changelogs/index.html`, `legal/index.html` and
  the six `legal/*/index.html` pages. Each page's `<head>` also carries the one-line theme boot
  script, so the chosen theme applies before the page paints.
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
- **Don't edit `data/` by hand.** It belongs to GitHup and the workflow.

## Versioning and changelog

- The version lives in `VERSION.md` (a bare version string). Bump it on every release.
- Every release gets a `CHANGELOG.md` entry using `###` subsections in this order: Added,
  Changed, Fixed, Removed, Security, Deprecated. Never a bare bullet list under a version.
- `commit.sh` (bash) and `commit.bat` (Windows) read `VERSION.md`, commit and create the
  annotated `vX.Y.Z` tag. Push with `git push origin main vX.Y.Z`.
