# Castmaster

A static, dependency-free cast directory for Taskmaster UK Series 1–22. The home page shows all contestants in series order. Each series has its own page at `series_1/` through `series_22/`. The header search accepts series numbers and contestant names, and contestant cards link to Wikipedia.

## Update every six months

Add the next series to `lineups.json` (five names and Wikipedia article titles), then run:

```sh
node scripts/build.mjs
```

Commit the source and generated `docs/` directory. In GitHub Pages settings, publish from the repository's default branch and `/docs` folder. No framework or package install is required.

Portraits listed in `lineups.json` are stored in `src/assets/` and copied into `docs/assets/` by the build. The 41 Taskmaster Wiki portraits requested in November 2026 are listed with their article sources in `fandom-early.json` and `fandom-late.json`. Cards without a local portrait request Wikipedia's page image when they approach the viewport; initials appear if no image is available.

Cast data: [Taskmaster TV series cast](https://en.wikipedia.org/wiki/Taskmaster_(TV_series)#Cast). Series 22 lineup: [Channel 4 press release](https://www.channel4.com/press/news/taskmaster-announces-series-22-line).
