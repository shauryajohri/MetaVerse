# METAVERSE — Command Pack

Everything you type to set up, run and share the project. Run commands from any terminal
(PowerShell, Command Prompt, or the terminal in VS Code).

> `metaverse` works from any folder once the project is on your PATH (already done on Shaurya's PC).
> Without that, run it from the project folder as `.\metaverse <command>` (PowerShell) or
> `./metaverse <command>` (macOS/Linux).

---

## 0. The METAVERSE environment (like a Python venv)

Activate it in PowerShell. The first time, it downloads a private Node.js LTS into `env\` and installs all packages with it:

```powershell
(Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned) ; (& C:\Users\shaur\metaverse\activate.ps1)
```

| Command | What it does |
|---|---|
| `deactivate` | Leave the environment (back to your system Node, old prompt and folder) |
| `& .\activate.ps1 -Recreate` | Delete `env\` and rebuild it with the newest Node LTS |
| `Remove-Item -Recurse -Force env` | Remove the environment completely |

While active, the prompt shows `(metaverse)` and `node`, `npm`, `metaverse`, `vite`, `electron` all come from this project.

---

## 1. The `metaverse` command

| Command | What it does |
|---|---|
| `metaverse setup` | **First time / after pulling changes.** Checks Node, downloads all packages, creates `server/.env` |
| `metaverse dev` | Run the **web app** → open http://localhost:5180 |
| `metaverse desktop` | Run the **desktop app** (opens its own window) |
| `metaverse build` | Type-check and build the production version into `client/dist` |
| `metaverse reset` | Delete all saved data (users, password changes, attendance marks) and go back to demo data. Asks first; add `--yes` to skip the question |
| `metaverse help` | List all commands |

**Stop a running app:** press `Ctrl + C` in its terminal.

### Same thing with npm (if `metaverse` isn't available)

| metaverse | npm |
|---|---|
| `metaverse setup` | `npm install` |
| `metaverse dev` | `npm run dev` |
| `metaverse desktop` | `npm run dev:desktop` |
| `metaverse build` | `npm run build` |
| — | `npm run desktop` — build, then open the desktop app from the build (start the API first with `npm run dev -w server`) |

---

## 2. Log in (demo accounts)

Pick the matching tab on the login screen.

| Tab | ID | Password |
|---|---|---|
| Student | `2301001` (up to `2301024`) | `student123` |
| Teacher | `T1001` | `teacher123` |
| Admin | `A0001` | `admin123` — **change it** in Admin → Settings |

**Preview night / dusk on the login screen:** add `?hour=21` or `?hour=18.3` to the URL, e.g. http://localhost:5180/?hour=21

---

## 3. Git & GitHub

Repo: https://github.com/shauryajohri/MetaVerse (private)

| Command | When |
|---|---|
| `git status` | See what you've changed |
| `git pull` | Get teammates' latest changes (then run `metaverse setup` in case packages changed) |
| `git add -A` | Stage all your changes |
| `git commit -m "What you changed"` | Save a snapshot locally |
| `git push` | Upload your commits to GitHub |
| `git log --oneline -10` | See the last 10 commits |
| `git switch -c my-feature` | Start a new branch for a feature |
| `git switch main` | Go back to the main branch |

**Typical day:** `git pull` → `metaverse setup` → `metaverse dev` → work → `git add -A` → `git commit -m "..."` → `git push`

---

## 4. New teammate setup

1. Install **Node.js 22.9+** (LTS) from https://nodejs.org and **Git** from https://git-scm.com
2. `git clone https://github.com/shauryajohri/MetaVerse.git`
3. `cd MetaVerse`
4. `.\metaverse setup`
5. `.\metaverse dev` → open http://localhost:5180

Optional — use `metaverse` from any folder (PowerShell, run once, then open a new terminal):

```powershell
[Environment]::SetEnvironmentVariable('Path', [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + (Get-Location).Path, 'User')
```

---

## 5. Where things are

| Path | What |
|---|---|
| `client/` | React web app (login, dashboards, pixel town) |
| `server/` | Express API (login, attendance, admin) |
| `desktop/` | Electron desktop shell |
| `server/data/db.json` | All saved data — git-ignored; delete (or `metaverse reset`) to start fresh |
| `server/.env` | Secret key and port — git-ignored, created by `metaverse setup` |
| `env/` | The METAVERSE environment: private Node.js + npm cache — git-ignored, created by `activate.ps1` |
| `TODO.md` | What's next |
| `DOCS.md` | Full project spec |

---

## 6. Fixes for common problems

| Problem | Fix |
|---|---|
| `metaverse` is not recognized | Open a **new** terminal (PATH only loads on start). Or use `.\metaverse` inside the project folder |
| **Port 5180 (or 4000) is already in use** | Another copy is running. Close that terminal, or find and stop it: `netstat -ano \| findstr :5180` then `taskkill /PID <number> /F`. Careful: another project (e.g. AURA) may be the one using it |
| **"Can't reach the campus server"** on login | The API isn't running. Use `metaverse dev` (not only the client) |
| Login says "Invalid ID or password" | Check you picked the right tab (Student / Teacher / Admin) |
| Logged out unexpectedly | Sessions last 8 hours, and `metaverse reset` logs everyone out |
| `npm install` fails | Check internet, then run `metaverse setup` again |
| Something is weird after `git pull` | Run `metaverse setup`, then restart `metaverse dev` |
| Want a clean slate | `metaverse reset`, then restart the app |
