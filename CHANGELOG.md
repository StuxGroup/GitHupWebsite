# Changelog

All notable changes to GitHupWebsite (githup.stux.group) are documented here. It follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## v1.0.0

### Added

- The GitHup website for `githup.stux.group`, styled after GitHup's social preview (dark background, purple-to-blue gradient): a home page with a hero, a live preview of the demo's current status, features, how it works, a quick start with copyable config and workflow snippets, and a demo call-to-action
- A live GitHup demo at `/demo/`: a real GitHup status page for a few Stux.Group services and GitHub, checked every 5 minutes from this repository (`.githup.yml`), with real incident Issues
- `.github/workflows/site.yml`: a GitHup `check` every 5 minutes, then a build that copies `site/` and builds the demo into `/demo` with GitHup's `site-dir` input, deployed with `actions/deploy-pages` when a status changes, hourly and on pushes
- The **Boring Legal Stuff** hub at `/legal/` with Privacy Policy, Terms and Ethics, Cookies Policy, Imprint, Disclaimer and Opt-Out Preferences, linked from every footer
- "A Stux.Group Service" branding on the home page and in every footer, the README and CONTRIBUTING, a custom 404 page, Open Graph tags using GitHup's social preview, and favicons
- `dev-server.sh`/`dev-server.bat` that build the site and a demo from generated example data into `.dev/public` and serve it locally with `DEV_MODE` on by default (`--no-dev-mode` to opt out)
- `commit.sh`/`commit.bat` release scripts that read `VERSION.md` and tag `vX.Y.Z`
