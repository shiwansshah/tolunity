# TolUnity Mobile

The active mobile client uses Expo Router and lives under `app/` and `src/`.

## Active structure

- `app/`: route entrypoints
- `src/screens/`: feature screens used by routes
- `src/api/`: backend client and endpoint helpers
- `src/context/`: auth/session state
- `src/styles/`: design tokens and shared styles

## Legacy folders

- `navigation/`: old navigation experiment, not the active router
- `web-admin/`: unused Vite starter copied inside the mobile project

## Environment

Create `.env` from `.env.example` when you need an explicit backend URL:

- `EXPO_PUBLIC_API_BASE_URL`

If this is not provided, the app defaults to `http://192.168.1.8:8080/api`.

## Run

```powershell
npm install
npx expo start
```
