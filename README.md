<div align="center">

# 🌍 Metaverse

### A Cross-Platform Digital University Ecosystem

Transforming university life through an interactive 2D campus, real-time collaboration, and intelligent academic services.

![Status](https://img.shields.io/badge/status-under%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Android-green)
![Backend](https://img.shields.io/badge/backend-FastAPI-009688)
![Game](https://img.shields.io/badge/game-Godot%204-478CBF)

</div>

---

# 📖 Overview

Metaverse is a **next-generation digital university platform** designed to unify academics, communication, administration, and student life into a single connected ecosystem.

Unlike traditional ERP systems and LMS platforms, Metaverse provides an **interactive 2D campus** where students, teachers, and administrators interact naturally while accessing real university services.

The project consists of:

- 🖥️ Desktop Client (Interactive 2D Campus)
- 📱 Mobile Companion App
- 🌐 FastAPI Backend
- 🗄️ PostgreSQL Database
- ⚡ Real-time Communication Layer

---

# 🎯 Vision

To create a unified digital university where students no longer need multiple disconnected applications for communication, attendance, assignments, events, and academic management.

Every university service should be accessible from one connected platform.

---

# ✨ Features

## 👨‍🎓 Student

- Interactive 2D campus
- Attendance
- Timetable
- Assignments
- Clubs
- Events
- Virtual Library
- Communication Hub
- Student Profile

---

## 👨‍🏫 Teacher

- Class Management
- Attendance
- Assignment Management
- Student Communication
- Resource Sharing
- Announcements

---

## 👨‍💼 Administrator

- User Management
- Department Management
- Event Management
- Analytics Dashboard
- Attendance Monitoring
- System Configuration

---

# 💬 Communication Hub

- Private Messaging
- Group Chats
- Department Channels
- Club Communities
- File Sharing
- Presence System
- Read Receipts
- Real-Time Notifications

---

# 🎮 Interactive Campus

The desktop experience transforms university services into an explorable 2D world.

Buildings include:

- 🏫 Classrooms
- 📚 Library
- 💻 Computer Labs
- 🏢 Administration Block
- 🎭 Auditorium
- ☕ Cafeteria
- 🏠 Hostels
- 🚗 Parking
- 🎯 Clubs
- 💼 Placement Cell

Every building serves an actual academic purpose.

---

# 📱 Cross Platform

| Platform | Status |
|-----------|--------|
| Windows | 🚧 In Development |
| Android | 📅 Planned |
| iOS | 📅 Planned |

Both applications share the same backend and synchronize in real time.

---

# 🧠 Future Intelligent Features

Metaverse is designed with future AI integration in mind.

Planned modules include:

- Intelligent Campus Search
- Academic Knowledge Retrieval
- Communication Memory
- Notification Summarization
- Assignment Retrieval
- University Policy Search
- Modular Retrieval-Augmented Generation (RAG)

---

# 🏗️ Architecture

```text
                 Desktop Client (Godot)

                         │

                  REST + WebSockets

                         │

                 FastAPI Backend

      Authentication │ Chat │ Attendance

 Assignments │ Events │ Notifications │ Users

                         │

                   PostgreSQL

                         │

                     Mobile App
```

---

# 🛠️ Tech Stack

### Desktop

- Godot 4

### Mobile

- Flutter

### Backend

- FastAPI

### Database

- PostgreSQL

### Cache

- Redis

### Authentication

- JWT

### Communication

- WebSockets

---

# 🧑‍💻 Getting Started

### Code layout

| Folder     | What                                                                 |
|------------|----------------------------------------------------------------------|
| `client/`  | React + Vite web app (login + live pixel-town backdrop)              |
| `server/`  | Express auth API — roll number + password → JWT                      |
| `desktop/` | Electron shell that runs the same client as a native desktop app    |

### Run

You need [Node.js](https://nodejs.org) 22.9+. Then, from the project folder:

```bash
metaverse setup       # first time: checks Node, downloads all packages, creates server/.env
metaverse dev         # web app → http://localhost:5180
metaverse desktop     # desktop app
metaverse build       # production build
metaverse reset       # wipe saved data, back to the demo data
metaverse help        # list commands
```

In PowerShell type `.\metaverse <command>`; on macOS/Linux `./metaverse <command>`.
The same things work as npm scripts (`npm install`, `npm run dev`, `npm run dev:desktop`, `npm run build`).

Dev accounts (in-memory until the PostgreSQL schema lands). Pick the matching tab on the login screen:

| Tab     | ID                  | Password     | Notes |
|---------|---------------------|--------------|-------|
| Student | `2301001`           | `student123` | PBL group G-07 lead |
| Student | `2301002`–`2301024` | `student123` | rest of CSE 5th sem, section A |
| Teacher | `T1001`             | `teacher123` | teaches DBMS + DBMS Lab, mentors PBL G-07 and G-08 |
| Admin   | `A0001`             | `admin123`   | change this password in Settings |

Attendance before 18 Sep 2026 is generated demo history; later sessions show as "to mark" until the teacher marks them.
All data (users, classes, marks) is saved to `server/data/db.json` (git-ignored). Delete it to reset to the demo data.

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` before deploying.

### Backdrop

The town is generated and animated in `client/src/town/` (no image assets). Lighting follows the
local clock; preview other times with `?hour=21` (night) or `?hour=18.3` (dusk).

---

# 🚀 Project Roadmap

## Phase 1

- Authentication
- User Roles
- Backend
- Database

## Phase 2

- Desktop Dashboard
- Attendance
- Communication Hub
- Assignments
- Notifications

## Phase 3

- Mobile Companion Application

## Phase 4

- Interactive 2D Campus

## Phase 5

- Multiplayer
- Clubs
- Events

## Phase 6

- AI Features
- Intelligent Search
- Modular RAG

---

# 📂 Repository Structure

```text
Metaverse/

├── backend/
│
├── desktop/
│
├── mobile/
│
├── docs/
│
├── assets/
│
├── research/
│
└── README.md
```

---

# 🎓 Research

This project is also being developed as a final-year Computer Science major project.

Research areas being explored include:

- Smart Campus Systems
- Real-Time Collaboration
- Human-Computer Interaction
- Information Retrieval
- Retrieval-Augmented Generation (RAG)
- Cross-Platform Educational Platforms

---

# 🤝 Contributing

Contributions, ideas, and discussions are welcome.

Feel free to open issues or submit pull requests.

---

# 📄 License

This project is licensed under the MIT License.

---

<div align="center">

### 🌍 One Campus. One Platform. Connected Everywhere.

Building the future of digital universities.

</div>
