# apps/mobile — Classifly Flutter app

Skeleton Flutter project. Theme + routing + bottom nav are wired up; feature screens are placeholders that the engineer will fill in by mirroring the web app's data-fetching patterns and the mobile screens in `docs/03-ui-wireframes/prototype.html`.

## First-time setup

```bash
# From this folder
flutter pub get
flutter doctor                  # ensure Android Studio + Xcode are healthy
flutter create . --platforms=android,ios --org in.classifly
```

(`flutter create .` materialises the `android/` and `ios/` folders — they're not committed because they're generated and platform-specific.)

## Run locally

```bash
# With Supabase env vars passed via --dart-define
flutter run \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

## What's wired up

- `lib/theme.dart` — colors / typography / shapes that mirror `packages/ui/src/tokens.ts`.
- `lib/router.dart` — `go_router` for `/`, `/login`, `/search`, `/sell`, `/profile`, `/listings/:id`.
- `lib/widgets/bottom_nav.dart` — 5-tab nav with the orange "Sell" FAB-style centre.
- `lib/screens/*.dart` — placeholder screens for every route. Replace these with real implementations.

## What's NOT wired up yet

- Supabase queries (use `supabase_flutter` — same patterns as the web app).
- Listing media via R2 — use the same `/api/upload-url` endpoint from the Next.js app.
- Push notifications — `firebase_core` and `firebase_messaging` are in `pubspec.yaml`; you'll need to add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) after creating a Firebase project.
- KYC / payments / chat — defer to MVP Week 5+.

## Build for release

```bash
flutter build appbundle --release --flavor prod \
  --dart-define=SUPABASE_URL=$PROD_SUPABASE_URL \
  --dart-define=SUPABASE_ANON_KEY=$PROD_SUPABASE_ANON_KEY

flutter build ipa --release --flavor prod
```

CI runs these via Fastlane — see `.github/workflows/mobile-release.yml`.
