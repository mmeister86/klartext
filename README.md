# Klartext

## Übersicht

Dieses Projekt besteht aus der Expo-App und einem kleinen Node-Backend, das Audioaufnahmen serverseitig transkribiert und zusammenfasst.

## Voraussetzungen

- Node.js 20+
- npm 10+
- Ein gültiger `OPENAI_API_KEY`

## Umgebungsvariablen

Lege eine `.env` im Projektroot an (wird bereits ignoriert) und ergänze mindestens:

```
OPENAI_API_KEY=dein-openai-schluessel
PORT=4000
CORS_ALLOW_ORIGIN=http://localhost:8081
EXPO_PUBLIC_API_BASE_URL=http://localhost:4000
```

Hinweise:

- `OPENAI_API_KEY` darf **nicht** ins Frontend oder als `EXPO_PUBLIC_*` gelangen.
- `EXPO_PUBLIC_API_BASE_URL` zeigt auf das Backend und ist die einzige notwendige Public-Variable.
- Passe `CORS_ALLOW_ORIGIN` an die URL des Expo-Dev-Servers an.

## Entwicklung starten

Backend in einem Terminal starten:

```
npm run dev:backend
```

Expo-App in einem zweiten Terminal starten:

```
npm start
```

Die App lädt Audio-Dateien hoch und erhält Transkript + Zusammenfassung vom Backend (`/api/transcribe`).

## Produktion

- Hinterlege `OPENAI_API_KEY` nur in sicheren Server- oder Edge-Umgebungen (z. B. Vercel Function, Cloud Run, Fly.io).
- Setze `EXPO_PUBLIC_API_BASE_URL` auf die öffentlich erreichbare Backend-URL.
- Aktiviere Authentifizierung/Rate-Limiting nach Bedarf und logge keine sensiblen Inhalte.
