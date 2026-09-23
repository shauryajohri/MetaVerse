# METAVERSE

A digital university ecosystem with an explorable 2D campus. See [DOCS.md](DOCS.md) for the full spec.

## Layout

| Folder     | What                                                                 |
|------------|----------------------------------------------------------------------|
| `client/`  | React + Vite web app (login + live pixel-town backdrop)              |
| `server/`  | Express auth API — roll number + password → JWT                      |
| `desktop/` | Electron shell that runs the same client as a native desktop app    |

## Run

```bash
npm install
npm run dev           # web: API on :4000, app on http://localhost:5173
npm run dev:desktop   # same, plus the desktop window
npm run desktop       # build the client and open it in the desktop shell
```

Dev accounts (in-memory until the PostgreSQL schema lands):

| Roll no.  | Password     | Role    |
|-----------|--------------|---------|
| `2301001` | `student123` | student |
| `T1001`   | `teacher123` | teacher |
| `A0001`   | `admin123`   | admin   |

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` before deploying.

## Backdrop

The town is generated and animated in `client/src/town/` (no image assets). Lighting follows the
local clock; preview other times with `?hour=21` (night) or `?hour=18.3` (dusk).
