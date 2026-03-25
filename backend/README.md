# Backend

The active backend lives in this directory and serves all API routes under `/api`.

## What it serves

- Auth: `/api/auth/*`
- Admin dashboard and billing: `/api/admin/*`
- Feed: `/api/feed/*`
- User profile and owner selection: `/api/user/*`
- Payments: `/api/payments/*`

## Configuration

The backend now reads runtime configuration from environment variables with local defaults:

- `SERVER_PORT`
- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGINS`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME`
- `SEED_ADMIN_PHONE`

Example local values:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/tolunity?useSSL=false&serverTimezone=UTC"
$env:DB_USERNAME="shiwans"
$env:DB_PASSWORD="shiwans123"
$env:JWT_SECRET="replace-with-a-long-random-secret"
$env:CORS_ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:8081"
```

## Run

```powershell
./mvnw spring-boot:run
```

Default seeded admin credentials remain `admin@tolunity.com` / `admin123` unless overridden via environment variables.
