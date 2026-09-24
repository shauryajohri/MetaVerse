# TODO

Things we've agreed to do later. Move items to "Done" (or delete them) as they land.

## Campus map

- [ ] Buy **Modern Exteriors** by LimeZu — https://limezu.itch.io/modernexteriors ($2.50 on sale, normally $5, updates included)
  - Download `Modern_Exteriors_v42.3` (222 MB, not the RPG Maker zip) and unzip into `assets/`
  - License: use/edit freely, **no redistributing the raw files**, **credit required** (link to the pack)
  - Keep the GitHub repo **private** while raw tile PNGs are in it
- [ ] Decide the first campus layout (4–5 buildings + rough positions)
  - DOCS.md: Classroom, Library, Club Room, Event Hall, Department Office
  - README also lists: Labs, Admin Block, Auditorium, Cafeteria, Hostels, Parking, Placement Cell
- [ ] Set up Phaser + Tiled pipeline: paint map in Tiled → export JSON → load in Phaser
  - Walking avatar, collision layer, door trigger zones ("walk into the library → library opens")
- [ ] Add LimeZu credit to the app and README
- [ ] Later: buy **Modern Interiors** (separate pack) for building insides

## Attendance & data

- [ ] Teacher / mentor screen to mark class and PBL attendance (replaces demo data)
- [ ] PostgreSQL schema + move users, students, attendance and PBL out of the in-memory store
- [ ] Replace demo subjects/faculty with the real Semester 5 timetable
- [ ] GEHU ERP import (records already carry a `source` field for this)

## Housekeeping

- [ ] Decide the tech stack and update README sections to match: README says Godot / FastAPI / Flutter, code is React + Electron / Express
- [ ] Set a real `JWT_SECRET` in `server/.env` before any deployment
- [ ] Desktop installer (electron-builder)
- [ ] Password reset flow (currently "ask your admin")
