# Shiny Stone Sales OS — Stability Guide

## What Caused the Styling Failure

The UI appeared as unstyled HTML (default fonts, blue links, bullet navigation) because **Tailwind/global CSS was not loading in the browser**.

### Root cause

The Next.js **development server cache (`.next/`) became stale/corrupted** after long-running sessions, multiple restarts, overlapping dev servers, or **`npm run build` running while `npm run dev` is still active**.

Symptoms observed:

1. HTML referenced `/_next/static/css/app/layout.css?v=...` → **HTTP 404**
2. The actual compiled CSS file on disk had a different hashed name (or was removed by a concurrent build)
3. Terminal showed webpack/RSC errors such as:
   - `__webpack_modules__[moduleId] is not a function`
   - `SegmentViewNode` React Client Manifest errors

When CSS returns 404, React components still render but **all Tailwind/shadcn classes have no effect**, so the page looks like plain HTML.

### What was NOT the cause

- Tailwind v4 configuration was correct (`@import "tailwindcss"` in `globals.css`, `@tailwindcss/postcss` in PostCSS)
- Root layout correctly imports `./globals.css` once
- Component `className` attributes were intact
- No design system files were missing

---

## Files Changed (Fix)

| File | Change |
|------|--------|
| `package.json` | Added `dev:clean` script to clear `.next` before starting dev server |
| `docs/STABILITY.md` | This document |

No CSS, layout, or component redesign changes were required.

---

## Fix Applied

1. Stopped all processes on ports 3000/3001
2. Deleted the `.next` cache directory
3. Ran `npm install` (dependencies were already valid)
4. Started a fresh dev server with `npm run dev`
5. Verified CSS URL returns **HTTP 200** (~64KB) and contains theme tokens (`bg-sidebar`, `brand-lime`, etc.)
6. Ran `npm run build` successfully

---

## How to Start the Project

```bash
npm install
npm run dev
```

Open: **http://localhost:3000/dashboard**

### If styling breaks again during development

```bash
npm run dev:clean
```

Or manually:

1. Stop the dev server (Ctrl+C)
2. Delete the `.next` folder
3. Run `npm run dev` again
4. Hard refresh the browser (Ctrl+Shift+R)

**Important:** Run only **one** dev server at a time. Multiple servers on ports 3000/3001 cause cache conflicts.

---

## How to Verify CSS Is Working

### Browser check

1. Open http://localhost:3000/dashboard
2. You should see:
   - Dark green sidebar (`#0B1914`)
   - Shiny Stone branding with lime accent (`#B3E64F`)
   - White rounded cards
   - KPI cards and charts on dashboard
   - Proper sans-serif typography (Geist)

3. The page must **NOT** look like default HTML with blue underlined links.

### DevTools check

1. Open Network tab
2. Reload the page
3. Find the CSS request (e.g. `/_next/static/css/app/layout.css?...` or a hashed `/_next/static/css/*.css`)
4. Status must be **200** (not 404)
5. Response size should be **> 40KB** and include tokens such as `bg-sidebar` and `brand-lime`

**HTTP 200 on the HTML document alone is not sufficient** — an unstyled page still returns 200 when CSS fails to load.

### Terminal check

- No repeated `__webpack_modules__` errors
- Routes should compile with `✓ Compiled /dashboard`

---

## Production Build

```bash
npm run build
npm run start
```

Build must complete with `✓ Compiled successfully` and all 19 routes listed.

---

## Routes Tested (CSS + Tailwind classes present)

- `/login`
- `/dashboard`
- `/customers`
- `/contacts`
- `/deals`
- `/pipeline`
- `/inbox`
- `/purchase-orders`
- `/follow-ups`
- `/automation`
- `/reports`
- `/users`
- `/settings`

All returned HTTP 200 with CSS linked and Tailwind classes in HTML.

---

## Development Rules (Do Not Violate)

1. **Do not remove** `import "./globals.css"` from `src/app/layout.tsx`
2. **Do not add** a Tailwind v3 `tailwind.config.js` — this project uses **Tailwind v4** via `@import "tailwindcss"`
3. **Do not run** multiple `npm run dev` instances simultaneously
4. **Stop the dev server before** `npm run build`; restart with `npm run dev:clean` afterward if developing locally
5. **Do not say "fixed"** without verifying CSS returns HTTP 200 in the browser
5. If UI looks unstyled after long dev sessions, **clear `.next` first** before changing code
6. Preserve existing design tokens in `globals.css` — do not replace the file blindly
7. After `npm run build`, restart `npm run dev` if styles appear broken in development

---

## Known Remaining Issues

- Occasional `Fast Refresh had to perform a full reload due to a runtime error` warning in dev — does not block CSS when cache is clean
- Next.js devtools `SegmentViewNode` manifest warnings can appear during corrupted cache states — resolved by clearing `.next`
- `npm audit` reports 2 vulnerabilities in dev dependencies — unrelated to styling

---

## Quick Recovery Checklist

```
[ ] Stop all dev servers
[ ] Delete .next folder
[ ] npm run dev  (or npm run dev:clean)
[ ] Hard refresh browser
[ ] Confirm CSS network request is 200
[ ] Confirm sidebar is dark green with lime accent
```
