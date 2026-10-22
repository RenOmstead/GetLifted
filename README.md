# Get Lifted

An app to track health and fitness: workouts, calisthenics skills, mobility and flexibility, meals and calories, vitamins and supplements, fasting, and body weight.

It's an installable web app (PWA). Open it in your phone's browser and add it to your home screen; it then opens full-screen and works offline. Your data stays on your device.

## What it does

**Train**
- **Plan your week.** Build routines, assign them to weekdays, and start today's plan with one tap from the Today screen.
- **Log workouts fast.** Tap ✓ to log a set. Empty fields reuse last time's numbers, and the rest timer starts on its own (sound and vibration, ±15 s, skip). It tracks weight × reps, bodyweight reps (plus added weight), holds, and cardio time and distance.
- **Hold and stretch timer.** Holds and stretches get a 3-2-1 lead-in and a countdown. Moves done one side at a time switch sides automatically.
- **See how every move is done.** About 190 curated exercises plus a library of 870+, each with a picture:
  - Photos of the start and end positions, for gym lifts, machines and stretches.
  - Animated figures drawn for this app, for calisthenics progressions (levers, planche, L-sit, handstand, pistol) and mobility drills.
  - Step-by-step instructions and key form cues.
- **Your machine, your settings.** Add a photo of the machine at your gym and notes like "seat 4, pin 7" to any exercise.
- **Calisthenics skill trees.** Twelve progressions, including one-arm push-up, one-arm pull-up, muscle-up, front lever, back lever, planche, handstand and pistol squat. Each level has a target, for example 3 × 8 reps or 3 × 15 s. Hitting it in a workout unlocks the next step automatically.
- **Progress.** Personal records, estimated 1-rep max, a progress chart per exercise, and a workout summary that calls out new records and skill levels.
- **Mobility & flexibility.** Joint drills (CARs, 90/90, shoulder pass-throughs, ankle and wrist prep) and static stretches, plus ready-made routines you can add with one tap.

**Nutrition**
- **Meals.** Calorie and macro rings and a water tracker. Food comes from your recent foods, common whole foods (USDA values), or [Open Food Facts](https://world.openfoodfacts.org/) search and barcode lookup. Quick add is there for anything else.
- **Vitamins & supplements.** Find your exact product in the [NIH Dietary Supplement Label Database](https://dsld.od.nih.gov/) and the label's amounts fill in for you. Your daily stack (and what you took plus food today) is compared with the RDA/AI and the Tolerable Upper Limit for your age and sex. Each nutrient flags *below target*, *meets target*, *close to the upper limit* or *above the upper limit*, and links to its NIH fact sheet.

**Fasting.** A live timer with 13h, 16:8, 18:6, 20:4, 24h and 36h presets. It shows approximate fasting stages, your history, streak and averages, and lets you edit start and end times.

**Body.** Weight with a 7-day trend line, body fat %, waist, goal weight and BMI.

**Settings.** Profile (used for reference values), units (lb/kg), a calorie and macro calculator (Mifflin-St Jeor), rest-timer defaults, light and dark theme, and backup/restore to a JSON file.

## Data sources

| What | Source |
| --- | --- |
| Vitamin & mineral reference values (RDA/AI, UL) | National Academies Dietary Reference Intakes, via [NIH Office of Dietary Supplements](https://ods.od.nih.gov/factsheets/list-all/) fact sheets |
| Creatine, beta-alanine, caffeine, EPA+DHA guidance | ISSN position stands, U.S. FDA, NIH ODS (linked in the app) |
| Supplement labels | [NIH DSLD API](https://dsld.od.nih.gov/) (live search) |
| Packaged foods | [Open Food Facts](https://world.openfoodfacts.org/) (live search, ODbL) |
| Whole foods | USDA FoodData Central (built in, rounded) |
| Exercise photos & instructions | [Free Exercise DB](https://github.com/yuhonas/free-exercise-db) (published as public domain; loaded from GitHub at runtime and cached) |
| Calisthenics and mobility figures | Drawn by this app (`src/figures`) |

The Free Exercise DB photos appear to come originally from Bodybuilding.com. They're loaded from that repository at runtime rather than copied into this one. If you ever publish or sell this app, replace them with photos you have rights to.

Get Lifted gives general fitness and nutrition information, not medical advice.

## Install on your phone

1. Open the app's URL in Safari (iPhone) or Chrome (Android).
2. iPhone: tap Share, then **Add to Home Screen**. Android: tap ⋮, then **Install app**.

## Hosting (GitHub Pages)

`.github/workflows/deploy.yml` builds and deploys on every push to `main`. One-time setup: in the repo, go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**. The app is then served at `https://<user>.github.io/GetLifted/`.

## Development

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run lint       # oxlint
npm run build      # type-check + production build into dist/
```

- React 19 + TypeScript + Vite, with `vite-plugin-pwa` for offline support and installability.
- Data lives in IndexedDB via Dexie (`src/db`). Routing uses a hash router, so it works on any static host.
- Reference data: `src/data` (exercises, skills, nutrients, foods, starter routines).
- Logic with unit tests: `src/lib` (nutrient checks, label parsing, progression, 1RM, fasting stats, TDEE).
- Figures: `src/figures`. Each move is a set of key positions for a jointed stick figure. Open `#/dev/figures` to see every key position on one page.
