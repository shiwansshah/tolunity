# TolUnity Workspace

This repository contains three active applications and a couple of legacy folders that were causing confusion.

## Active applications

- `backend/`: Spring Boot API on port `8080`
- `web-admin/`: React + Vite admin dashboard
- `tolunity-mob/`: Expo mobile client

## Backend access path

Both frontends talk to the backend under `/api`.

- `web-admin` uses `VITE_API_BASE_URL` and proxies to `VITE_BACKEND_ORIGIN` in development
- `tolunity-mob` uses `EXPO_PUBLIC_API_BASE_URL`, or infers the Expo host and falls back to local emulator defaults

## Legacy folders

- `tolunity-mob/web-admin/`: unused Vite starter, not the real admin app
- `tolunity-mob/navigation/`: old navigation experiment, not the active Expo Router setup

## Local startup order

1. Start `backend/`
2. Start `web-admin/` or `tolunity-mob/`
3. Override env files when you are not using default localhost development

## Notes

- Backend runtime configuration is now environment-driven instead of hardcoded in source.
- Admin and mobile readmes contain app-specific setup details.
