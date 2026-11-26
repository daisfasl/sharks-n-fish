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
title: "revenge game"  # optional headline; leave out for an auto-written one
stakes: "0.25/0.50"    # optional
location: Jacob's place  # optional
notes: "Anything funny that happened."   # optional, shows as Dealer's notes
results:
  - { player: jacob,  buyin: 75, cashout: 52.90 }   # buyin = total put in, rebuys included
  - { player: nicole, buyin: 25, cashout: 47.10 }
```

Cents are fine (`49.45`). Player ids are the file names in `src/data/players/`.

**From your phone:** open the repo on github.com → `src/data/games` → **Add file → Create new
file** → paste → **Commit changes**. That's it.

The build checks every game before publishing. If the cash-outs don't add up to the buy-ins,
or a name is misspelled, the update stops and the Actions tab tells you exactly which file and
what's wrong, so a typo never reaches the leaderboard. If some money really did leave the table
(pizza, a tip), add `rake: 15` to the game file.

## New player

1. Add `src/data/players/<id>.yml`. The file name is their id, used in game files:
   ```yaml
   name: Nicole
   nickname: "The Closer"     # optional
   bio: "One line about them."   # optional
   ```
2. Optional: add a photo as `photos/<id>.png` (see below). Until then they get a drawn stand-in.

Players show up on the leaderboard after their first game.

## Player photos (the cutout look)

Every face goes through the same treatment automatically: black and white, halftone dots, and
a white sticker border. So you only need to supply **a PNG of the person with the background
removed**:

1. **Pick a photo:** face toward the camera, head and shoulders visible, decent light.
   Colour is fine. Don't crop the top of their head off.
2. **Cut them out.** On a Mac, one command does it (uses macOS's built-in subject lifting):
   ```bash
   npm run cutout -- ~/Downloads/priya.jpg priya
   ```
   That writes `photos/priya.png`. Works with JPG, PNG and HEIC.
   Other ways: on iPhone, press and hold the person in the photo → **Copy**/Share; in Finder,
   right-click → **Quick Actions → Remove Background**; or remove.bg. Save the result as
   `photos/<id>.png`.
3. Commit it.

`scripts/photos.mjs` runs before every build. It trims the empty space around the person,
crops to head and shoulders with a flat bottom edge, shrinks huge phone photos, and writes the
result to `public/players/`. JPG and HEIC files in `photos/` are skipped with a warning because
they can't have a see-through background (run `npm run cutout` on them first).

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
