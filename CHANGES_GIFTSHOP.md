# GiftShop Panel changes

- Rebranded UI and project references from Whale Panel to GiftShop Panel.
- Changed SQLite database filename from `walpanel.db` to `gs.db`.
- Updated backend database connection to use `/app/data/gs.db`.
- Updated backup/restore API to download and restore `gs.db`.
- Updated Alembic SQLite URL to `../data/gs.db`.
- Updated Docker Compose service/container name to `giftshop-panel`.
- Updated default Docker image to `darvish021/giftshop-panel:latest`.
- Rebuilt installer around Docker Compose with install directory `/opt/giftshop-panel`.
- Added CLI helper command: `giftshop-panel`.
- Added CLI backup command that copies `/opt/giftshop-panel/data/gs.db`.
- Added `INSTALL_GIFTSHOP.md` with install and manual compose commands.
- Fixed TypeScript deprecation setting with `ignoreDeprecations: "5.0"`.

Frontend build check passed after `npm ci`.
Python compile check passed for backend files.
