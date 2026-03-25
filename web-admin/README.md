# Web Admin

The active admin dashboard lives here. It talks to the Spring backend in `../backend` and expects all API routes under `/api`.

## Environment

Create a `.env` file from `.env.example` when you need to override local defaults.

- `VITE_APP_NAME`
- `VITE_API_BASE_URL`
- `VITE_BACKEND_ORIGIN`

Default local development behavior:

- Browser requests default to `http://192.168.1.8:8080/api`
- If you set `VITE_API_BASE_URL=/api`, Vite proxies `/api` to `http://192.168.1.8:8080` by default

## Run

```powershell
npm install
npm run dev
```
