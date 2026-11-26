# Sharks n Fish 🦈🐟

Our home game's leaderboard. **r u a poker shark or fish?**

Everything on the site (rankings, the shark and the fish, stats, headlines, charts) is
calculated from the files in `src/data/`. You never edit the leaderboard by hand: add a game
file, push, and the site rebuilds itself in about a minute.

---

## After game night: add a game

Make a new file in `src/data/games/` named after the date, e.g. `2026-12-04.yml`:

```yaml
date: 2026-12-04
host: jacob            # optional: a player id
location: Jacob's place  # optional
stakes: "0.25/0.50"    # optional
notes: "Anything funny that happened."   # optional, shows as Dealer's notes
results:
  - { player: jacob, buyin: 40, cashout: 92 }   # buyin = total put in, rebuys included
  - { player: alex,  buyin: 60, cashout: 8 }
  - { player: priya, buyin: 40, cashout: 40 }
```

**From your phone:** open the repo on github.com → `src/data/games` → **Add file → Create new
file** → paste → **Commit changes**. That's it.

The build checks every game before publishing. If the cash-outs don't add up to the buy-ins,
or a name is misspelled, the update stops and the Actions tab tells you exactly which file and
what's wrong, so a typo never reaches the leaderboard. If some money really did leave the table
(pizza, a tip), add `rake: 15` to the game file.

## New player

1. Add `src/data/players/<id>.yml`. The file name is their id, used in game files:
   ```yaml
   name: Priya
   nickname: "Pocket Rockets"     # optional
   bio: "Tight, patient, terrifying."   # optional
   ```
2. Optional: add a photo as `photos/<id>.png` (see below). Until then they get a drawn stand-in.

Players show up on the leaderboard after their first game.

## Player photos (the cutout look)

Every face goes through the same treatment automatically: black and white, halftone dots, and
a white sticker border. So you only need to supply **a PNG of the person with the background
removed**:

1. **Pick a photo:** face toward the camera, head and shoulders, decent light. Colour is fine.
2. **Remove the background**, any of these:
   - **iPhone:** open the photo, press and hold the person → **Copy** (or Share → Save Image),
     then AirDrop or save it as PNG.
   - **Mac:** right-click the image in Finder → **Quick Actions → Remove Background**.
   - **Anywhere:** remove.bg (download the PNG).
3. **Crop it** from roughly mid-chest up, with a **flat cut at the bottom** (the cutouts sit on
   paper labels, so a straight bottom edge looks best). Leave the top of the head uncropped.
4. Save it as `photos/<id>.png`, e.g. `photos/priya.png`, and commit.

`scripts/photos.mjs` runs before every build. It trims the empty space around the person,
resizes huge phone images, and writes the result to `public/players/`. JPG and HEIC can't be
see-through, so they're skipped with a warning.

> `photos/jacob.png` is a drawn test image showing how a real photo is treated. Replace it
> with a real one.

## Run it on your computer

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # what GitHub runs; fails loudly if any data is wrong
```

## Putting it online (GitHub Pages)

1. Create a GitHub repo and push this folder to its `main` branch.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. Push anything. The **Deploy to GitHub Pages** workflow builds and publishes to
   `https://<you>.github.io/<repo>/`.

### Custom domain

1. Buy one (Cloudflare Registrar or Porkbun are cheap, about $10–12/year for a .com).
2. **Settings → Pages → Custom domain**: enter it (e.g. `sharksnfish.com`) and save.
3. At your registrar, add DNS records:
   - `www` → **CNAME** → `<you>.github.io`
   - the bare domain → **A** records `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
4. Once GitHub shows the domain as verified, tick **Enforce HTTPS**. The workflow
   picks up the new address on its own.

The site is marked `noindex`, so it won't show up when someone googles your friends.

## Where things live

```
src/data/players/*.yml   one file per player
src/data/games/*.yml     one file per game night
photos/                  cutout PNGs, named <player-id>.png
src/lib/data.ts          reads + checks the data, computes every stat
src/lib/paper.ts         torn edges, tilts, money formatting
src/components/          Cutout, Sticker, GameCard, PlayerDialog, Ransom, Dymo
src/pages/index.astro    the page
src/styles/global.css    colours, fonts, the collage look
```
