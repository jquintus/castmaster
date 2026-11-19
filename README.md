# Castmaster

A static, dependency-free cast directory for Taskmaster UK Series 1–22, Taskmaster New Zealand Seasons 1–7, and Taskmaster Australia Seasons 1–5. Each show has a cast overview and individual season pages. The header search accepts shows, season numbers, and contestant names.

- UK: `/` and `/series_1/` through `/series_22/`
- New Zealand: `/nz/` and `/nz/season_1/` through `/nz/season_7/`
- Australia: `/au/` and `/au/season_1/` through `/au/season_5/`

## Update every six months

Add the next UK series to `lineups.json`, or an NZ/AU season to `shows.json` (five names per season), then run:

```sh
node scripts/build.mjs
```

Commit the source and generated `docs/` directory. In GitHub Pages settings, publish from the repository's default branch and `/docs` folder. No framework or package install is required.

Contestant portraits from Taskmaster Wiki are stored in `src/assets/fandom/` and copied into `docs/assets/fandom/` by the build. UK portrait sources are recorded in the `fandom-*.json` manifests. NZ/AU portrait filenames are recorded in `wiki-portraits.json`; add the wiki filename and a local WebP image for each new contestant. NZ/AU Wikipedia article titles are recorded in `wikipedia-titles.json`; use `null` when no matching article exists so the card links to Taskmaster Wiki. Initials appear if an image is unavailable.

Cast data: [UK cast](https://en.wikipedia.org/wiki/Taskmaster_(TV_series)#Cast), [New Zealand cast](https://taskmaster.fandom.com/wiki/Taskmaster_New_Zealand), [Australia cast](https://taskmaster.fandom.com/wiki/Taskmaster_Australia). [TVNZ confirms New Zealand Season 7](https://www.tvnz.co.nz/tvseries/taskmaster-nz). Series 22 lineup: [Channel 4 press release](https://www.channel4.com/press/news/taskmaster-announces-series-22-line).
