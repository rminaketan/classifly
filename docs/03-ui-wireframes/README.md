# Phase 3 — Web and Mobile UI Wireframes

Interactive, clickable HTML prototypes for the Classifly.in product. These are not production code; they are a **design specification** that engineers reference when building the real Next.js + Flutter apps, and that you can share with stakeholders to validate flows before code is written.

## Files

| File | What it is |
|---|---|
| `prototype.html` | Self-contained interactive prototype. Toggle between **Web** and **Mobile** views; click between all key screens. Open by double-clicking the file in Explorer. |
| `design-tokens.json` | Source-of-truth design tokens (colors, typography, spacing, radii, shadows). Feed into Tailwind config (web) and Flutter `ThemeData` (mobile) so visual parity is guaranteed. |
| `screen-inventory.md` | Catalog of every screen in the prototype with notes on edge cases, empty states, and India-specific UX patterns. |
| `README.md` | This file. |

## Design principles

1. **Mobile-first, vernacular-first.** Every screen is designed to work in Hindi or any of the 10 other Indian languages we support, and to render acceptably on a 360×640 mid-tier Android.
2. **Trust signals are first-class UI.** Verified badges, KYC tier indicators, "phone masked" labels, and dispute SLAs appear on every listing — not buried in settings.
3. **Action over chrome.** Buttons say what they do ("Chat with seller", "Apply for this job"), never generic ("Submit"). Hindi alternates included in the prototype where space allows.
4. **One-thumb operation on mobile.** All primary CTAs sit in the lower 60% of the screen, within thumb reach on a 6.5" phone.
5. **Empty states do work.** Every empty list shows the next-best action ("Save your first listing", "Post your CV to start applying").
6. **Indian numerical conventions.** Lakhs and crores for large numbers (`₹5.2 L` for ₹5.2 lakh), not `$520k`. Phone numbers in `+91 9####-####` masked form.
7. **Low-data mode** toggle visible in mobile settings; reduces image quality and disables autoplay.

## Screens included

### Web (desktop, ≥ 1024px)

1. **Home feed** — hero search, vertical pills (Buy/Sell · Jobs · Services · Real Estate), featured carousel, hyperlocal feed by city.
2. **Search results** — left filter sidebar, listing grid with map toggle, sort controls, saved-search button.
3. **Listing detail** — image gallery, price block, seller card with KYC badge and rating, in-page chat panel, attribute table, similar listings.
4. **Post-ad wizard** — 4-step flow (Category → Details → Photos → Location & Price), progress rail on left.
5. **Profile / My account** — listings, saved, chats, ratings, settings, KYC progress.
6. **Chat** — three-pane layout (conversation list, thread, listing context).
7. **Jobs hub** — distinct from listings: skill filters, salary range, work mode, voice-CV-friendly cards.
8. **Services hub** — calendar booking, verified-pro badges, instant-quote CTA.

### Mobile (Flutter target, simulated in 390×844 frame)

1. **Bottom nav** — Home · Search · Sell (FAB) · Chat · Profile.
2. **Home** — vertical pills, recently-viewed strip, hyperlocal feed.
3. **Search + filter sheet** — full-screen filter modal, chips for active filters.
4. **Listing detail** — full-bleed image carousel, sticky chat CTA, expandable seller card.
5. **Post-ad** — step-by-step full-screen sheets with camera-first photo capture.
6. **Chat list and thread** — WhatsApp-familiar layout with listing-context header.
7. **Profile / Wallet** — KYC progress card, earnings widget for sellers, language switcher.

## Using the tokens

The design tokens are the contract that keeps web and mobile visually identical.

### Tailwind (web)

```js
// tailwind.config.js
import tokens from '../docs/03-ui-wireframes/design-tokens.json';

export default {
  theme: {
    extend: {
      colors: tokens.colors,
      fontFamily: tokens.fontFamily,
      fontSize: tokens.fontSize,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.boxShadow,
    }
  }
};
```

### Flutter `ThemeData` (mobile)

```dart
// lib/theme.dart — generated from design-tokens.json via build_runner
final lightTheme = ThemeData(
  colorScheme: const ColorScheme.light(
    primary: Color(0xFF1F3A5F),       // tokens.colors.primary.DEFAULT
    secondary: Color(0xFFFF6B35),     // tokens.colors.accent.DEFAULT
    surface: Color(0xFFFFFFFF),
    error: Color(0xFFDC2626),
  ),
  textTheme: TextTheme(
    displayLarge: GoogleFonts.inter(fontSize: 32, fontWeight: FontWeight.w700),
    bodyLarge:    GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w400),
    // ...mapped 1:1 from tokens.fontSize
  ),
  cardTheme: CardTheme(
    elevation: 0,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
  ),
);
```

A Style Dictionary build is the canonical way to keep these in sync; we recommend wiring it in once the team grows past one designer.

## What this prototype is **not**

- It is not a Figma file. For polished marketing visuals, hand off the tokens + screen flows to a designer.
- It is not pixel-perfect on every device. It's a high-fidelity wireframe — close enough to convey intent.
- It does not include onboarding flows (KYC capture screens, OTP entry, language selector). Those land in a follow-on round once we validate the core marketplace flows.
- It does not include admin / moderation tools. Those are an internal product and live in a separate spec.

## How to open

Double-click `prototype.html` from the project folder. It works fully offline.

For sharing with non-technical stakeholders, upload the single HTML file to any web host (Cloudflare Pages, Netlify Drop, Vercel) — it has no server-side dependencies.
