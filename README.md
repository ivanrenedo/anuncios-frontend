# Bomelh Frontend

Web publica y panel admin de Bomelh, construido con Next.js App Router.

## Requisitos

- Node 22
- Backend disponible en `NEXT_PUBLIC_API_URL`

`.env.local` minimo:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3000/graphql
NEXT_PUBLIC_SHARE_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

## Desarrollo

```bash
npm ci
npm run dev
```

Por defecto corre en `http://localhost:3001`.

## Verificacion

```bash
npx tsc --noEmit
npm run build
```

El build usa fuentes del sistema para no depender de Google Fonts durante CI/deploy.

## Areas Principales

- `src/app/(shop)`: experiencia publica del marketplace.
- `src/app/admin`: panel admin.
- `src/components`: UI compartida.
- `src/graphql`: queries y mutations.
- `src/hooks`: estado remoto y flujos de producto.
- `src/lib`: configuracion, formato y utilidades.

## Deploy

El deploy se ejecuta por GitHub Actions en push a `main`. La imagen Docker usa `output: "standalone"` y hornea los `NEXT_PUBLIC_*` en build time.

Ver `../docs/DEPLOYMENT.md` y `../docs/SMOKE_TESTS.md`.
