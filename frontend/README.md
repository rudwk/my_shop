# My Shop Frontend

Static SPA + minimal Node server.

## Run

- Frontend: `npm run dev`
- Backend proxy target (optional): `API_TARGET=http://localhost:3000 npm run dev`

The frontend serves static files from `public/` and proxies `/api/*` to the backend.

