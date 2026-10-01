# Bible Reader

Offline Bible reading app for Android, built with React Native and Expo. A portfolio project that goes from scaffold to a published Google Play release.

## Stack

- TypeScript (strict mode)
- React Native + Expo (SDK 57)
- expo-router (file-based navigation)
- expo-sqlite (local SQLite + FTS5, fully offline)

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with the Expo Go app on an Android device.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Start Metro bundler |
| `npm run android` | Start on a connected Android device/emulator |
| `npm run lint` | ESLint (expo config) |
| `npm run format` | Prettier |
| `npm run typecheck` | TypeScript strict check |
| `npm run build:db` | Rebuild the bundled Bible database asset |
| `npm test` | Jest tests (database pipeline, `db/`, feature logic) |

## Architecture

Feature-based structure: every domain area (reading, search, bookmarks, settings) owns its components, hooks and data access. Screens are thin expo-router routes, SQL lives only inside feature repositories, design tokens live in `theme/`. See [`.ai-factory/ARCHITECTURE.md`](.ai-factory/ARCHITECTURE.md) for the full contract.

## Documentation

| Guide | Description |
| ----- | ----------- |
| [Database](docs/database.md) | Bundled bible.db: sources, composition, build and validation |

## Roadmap

- [x] Project scaffold (Expo, strict TypeScript, feature-based architecture)
- [x] Local SQLite database (books, chapters, verses, footnotes)
- [x] Reading screen
- [x] Full-text search
- [x] Bookmarks and reading history
- [x] Footnotes (KJV with Apocrypha; the Synodal text has no public-domain footnotes)
- [ ] Settings and theming (translation selection done; font size and theme toggle pending)
- [ ] Release build via EAS Build
- [ ] Google Play publication
