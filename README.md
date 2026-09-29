<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="site/assets/logo-dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="site/assets/logo.svg">
    <img src="site/assets/logo.svg" width="220" height="64" alt="GitHup">
  </picture>
</p>

# GitHupWebsite

### *The website for [GitHup](https://github.com/StuxGroup/GitHup), with a live demo that GitHup runs itself. [A Stux.Group Service](https://services.stux.group).*

**Website:** [githup.stux.group](https://githup.stux.group) · **Live demo:** [githup.stux.group/demo](https://githup.stux.group/demo/)

## What's here

- **`site/`**: the static website (home page, `404.html`, the **Boring Legal Stuff** hub at
  `/legal/` with its six sub-pages, and `assets/`). Plain HTML, one stylesheet and one small
  script, no build step. The look follows GitHup's social preview: dark `#0d1117` with the
  purple-to-blue (`#b06bff` → `#3ba7ff`) gradient.
- **`.githup.yml`**: the demo's monitors: Stux.Group services and companies, plus one monitor
  (`thispagedoesnotexist.stuxgroup.net`) that is meant to be down, so the demo always shows an outage.
- **`data/`**: the demo's monitoring history, committed by `github-actions[bot]` every 5 minutes.
- **`.github/workflows/site.yml`**: runs a GitHup `check` every 5 minutes, then (when a status
  changes, hourly, and on every push to `site/`) copies `site/` into `_site`, builds the GitHup
  status page into `_site/demo` with `site-dir`, and deploys `_site` with `actions/deploy-pages`.

Incidents on the demo are real: when a demo monitor goes down, GitHup opens an Issue on this
repository labelled `githup`, `incident` and `demo`, and closes it on recovery.

## Local development

```bash
./dev-server.sh                 # or dev-server.bat on Windows; add a port as the last argument
./dev-server.sh --no-dev-mode   # production rendering; open /?nodev=1 to hide the site banner
```

`dev-server` copies `site/` into `.dev/public`, generates 90 days of example data for the demo
monitors, builds the demo into `.dev/public/demo` and serves everything at
`http://127.0.0.1:8000`, so `/demo/` works just as it does live. It uses GitHup from
`$GITHUP_PATH`, a sibling `../GitHup` checkout, or a fresh clone in `.dev/GitHup`.

## Hosting

GitHub Pages, deployed by Actions (**Settings → Pages → Source: GitHub Actions**), with the custom
domain `githup.stux.group` set in the Pages settings. DNS: a `CNAME` record for `githup` pointing
at `stuxgroup.github.io`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

The website code is MIT, copyright © Stux.Group, see [LICENSE](LICENSE). The GitHup name, logo
and branding are not covered by the license.

---

*GitHup is [a Stux.Group Service](https://services.stux.group), built & maintained by <img src="https://github.com/StuxGroup.png" height="14" alt="Stux.Group" valign="middle"> [Stux.Group](https://github.com/StuxGroup).  
GitHup is a part of the <img src="https://global.media.stux.group/icon.png" height="14" alt="Stux.Group" valign="middle"> Stux.Group Brand of Companies.*
