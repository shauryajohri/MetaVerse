# METAVERSE — Project Documentation

> **A Digital University Ecosystem with an Explorable 2D Campus**
> *"A university that you walk through, instead of log into."*
> *"The world is the interface."*

**Institution:** Graphic Era Hill University (GEHU), Dehradun
**Department:** Computer Science & Engineering
**Programme:** B.Tech CSE, Third Year
**Status:** Planning & design — **no code written yet**
**Document compiled:** 2026-09-03

---

## 0. About this document

This is a consolidation of every METAVERSE artefact found on this machine. There is **no source code
repository** for this project anywhere on the system — the working directory `C:\Users\shaur\metaverse`
was empty when this was written. Everything below comes from proposal/synopsis documents in
`C:\Users\shaur\Downloads`.

### Source documents

| # | File | Date | Role |
|---|------|------|------|
| S1 | `GEHU-METAVERSE-Revised.pdf` (38 pp.) | 2025-08-25 | **Ancestor concept** — "GEHUVerse" by Arpan Singh. Large, maximalist vision doc. Not the current project. |
| S2 | `Project Synopsis(metaverse).docx` / `.pdf` (3 pp.) | 2025-10-01 | **Early 2-person synopsis** — Arpan Singh + Shaurya Johri. Gather.Town-inspired, NPC-centric. |
| S3 | `🌍 METAVERSE.docx` | 2026-07-20 | **Vision reset** — the current METAVERSE concept. Desktop + mobile two-client model. |
| S4 | `METAVERSE_Project_Proposal.pdf` (18 pp.) | 2026-08-07 | **Full major-project proposal** — solo, most technically detailed document. The reference spec. |
| S5 | `METAVERSE_Overview.pdf` (8 pp.) | 2026-08-07 | **Presentation/overview deck** — same content as S4, narrative framing. |
| S6 | `METAVERSE_Synopsis.pdf` (3 pp.) | 2026-08-10 | **Latest and authoritative** — 4-member team, formal submission synopsis. |

**Precedence rule used here:** where documents conflict, **S6 (latest synopsis) wins** on team, timeline
and scope; **S4 (proposal) wins** on technical depth — it is the only document with schema, workflow and
testing detail. Conflicts are called out explicitly in §18.

---

## 1. The idea

Being a student today means juggling five or six disconnected systems. Attendance sits on paper or in a
standalone portal. Assignments arrive by email. Notices go on a board nobody walks past. Everything
social happens in WhatsApp groups the institution has no visibility into. None of these share a data layer,
so no single reliable picture of student engagement exists anywhere.

METAVERSE puts all of it behind one backend and one database — and then does something unusual with
the front of it. Instead of a dashboard with a sidebar and twelve menu items, the primary client renders a
**top-down, walkable, multiplayer 2D campus in the browser**. You control an avatar. So does everyone
else who is online. You can see them moving.

Want to attend class? Walk into the classroom. Want to study with friends? Walk into the library and see
who is already there. Want to join the coding club? Walk into the club room. **The building is the button.**

### The one-line version

> A university management system where the interface is a multiplayer 2D world — and where AI handles the
> three things that world makes hard: proving you're actually present, routing questions to the right teacher,
> and spotting students falling behind before it's too late.

### Headline numbers

| | |
|---|---|
| Unified platform | 1 |
| User roles | 3 (Student, Teacher, Admin) |
| Campus | 2D, live, multiplayer |
| AI/ML models | 3 |
| Database tables | ~22 |

---

## 2. Team and mentorship

**Per S6 (latest, authoritative):**

| Team member | Primary responsibility | Modules |
|---|---|---|
| **Rashika Pal** | Frontend & the 2D Campus Client — React app, Phaser campus world, avatar movement, proximity interactions, responsive UI layer | M2 |
| **Sujal Verma** | Backend & Real-Time Systems — Express REST API, auth & RBAC, Socket.IO sync layer, deployment pipeline | M1, part of M2 |
| **Anjali Sindhwal** | Communication & Administration — chat and group channels, notices and events, admin dashboard, system testing | M5, M7 |
| **Shaurya Johri** | Database & Machine Learning — relational schema design, attendance module, one-shot facial verification, few-shot query routing, attendance-risk model | M3, M4, M6, §9 |

**Faculty Mentor:** Mr. Nishant Bhandari
**Team size:** 4
**Core subject areas:** Full Stack Web Development · Database Management Systems · Machine Learning & AI · Few-Shot Learning

> ⚠️ **Note:** S4 (the 18-page proposal) is written as an **individual major project** submitted solely by
> Shaurya Johri, with supervisor and enrolment number left as `[ to be filled ]`. S6 supersedes it. If S4 is
> ever submitted as-is, its title page and risk table must be rewritten for a 4-person team.

---

## 3. Problem statement

Five concrete, independently verifiable problems:

| # | Problem | Consequence |
|---|---------|-------------|
| **P1** | **Fragmentation of tools.** Attendance, assignments, notices, marks and peer communication live in separate, unconnected systems. | No unified record of a student exists; cross-cutting questions cannot be answered. |
| **P2** | **Unverified attendance.** Manual roll-call and simple digital check-ins are trivially delegated to a peer. | Attendance data is unreliable and therefore unusable for downstream analysis. |
| **P3** | **Late detection of disengagement.** Shortfall against the minimum attendance requirement is typically discovered only at end of term. | Intervention occurs after the outcome is already fixed. |
| **P4** | **Unstructured query resolution.** Doubts are raised in informal group chats with no routing, ownership or retention. | Faculty time used inefficiently; answers are not reusable. |
| **P5** | **Absence of institutional social space.** Clubs, study groups and peer discovery occur entirely outside any institutional system. | Participation cannot be encouraged, measured or supported. |

**Structural dependency:** *P2 is a prerequisite for P3.* Any predictive model built on attendance records is
only as trustworthy as the records themselves; if presence can be faked, a risk classifier trained on that
data learns from noise. The verification component (§9.1) is therefore **not an optional enhancement but a
structural requirement** of the analytics component.

A sixth, softer problem is stated in S5: **dashboards are boring.** Students avoid college software because it
feels like paperwork. If the interface is a place instead of a form, people actually open it.

---

## 4. Objectives

### Primary

1. Design and implement a **full-stack web application** unifying academic, administrative and social functions of a university under a single backend and a single normalised database.
2. Implement a **real-time, multi-user, explorable 2D campus** as the primary interface, with server-authoritative position synchronisation and spatially-triggered interactions.
3. Design a **normalised relational schema (3NF)** supporting three user roles with strict RBAC enforced at both the application and database layers.
4. Implement **one-shot facial verification** for attendance, reliable from a single enrolment image per student, with no retraining required as the roster changes.
5. Implement **few-shot text classification** to route student queries to the correct subject and faculty member, functioning from 5–10 labelled examples per category.
6. Implement a **supervised model predicting attendance-shortfall risk** in advance, with explanations surfaced to faculty rather than raw scores.

### Secondary

- Provide a responsive interface usable on mobile devices without maintaining a separate native codebase.
- Deliver an administrative analytics view reporting engagement, attendance trends and participation across departments.
- Deploy the complete system to a publicly reachable environment with continuous integration.

---

## 5. Scope

> The scope boundary is treated as a **commitment**, not a guideline. Items in the right-hand column are
> recorded as future scope and will not be attempted within the project duration, *irrespective of available time*.
> As S5 puts it: "the fastest way to finish nothing is to keep adding."

| ✅ Within scope | ❌ Explicitly out of scope |
|---|---|
| Authentication & authorisation for Student, Teacher, Admin | Financial modules — fee payment, receipts, accounting |
| Real-time 2D campus with avatar movement and presence | 3D rendering, VR or AR clients |
| Classroom, Library, Club Room, Event Hall as enterable spaces | A geographically accurate replica of the physical campus |
| Attendance capture with one-shot facial verification | Biometric hardware (fingerprint, RFID, turnstiles) |
| Assignment upload, submission and status tracking | Automated grading of subjective answers |
| Real-time private, group and academic chat with file sharing | Voice or video calling |
| Few-shot query classification and routing | A general-purpose conversational agent |
| Attendance-risk prediction with explanations | Prediction of final examination marks or grades |
| Administrative analytics dashboard | Integration with any existing university ERP / SIS |
| Responsive web client usable on mobile browsers | Native Android or iOS apps published to stores |

### Recorded change from the initial concept

S3 described a **native Windows desktop client alongside a separate native mobile app**. Both have been
consolidated into a **single responsive web client**. The 2D campus renders in the browser on an HTML5
canvas, which preserves the entire immersive interaction model while removing a second codebase, a
second build pipeline and a second deployment target. This reduces implementation risk substantially and
aligns the project with the Full Stack Web Development subject area **without any loss of functionality**.

---

## 6. Architecture

Three-tier architecture with a **separated machine-learning service**. The application backend and the ML
service communicate over internal HTTP, so the two can be developed, tested, scaled and deployed
independently.

```
+------------------------- CLIENT TIER (Browser) --------------------------+
|                                                                          |
|   React SPA                                                              |
|    |- Campus Canvas .... Phaser 3 / HTML5 Canvas: avatars, map, collision|
|    |- Overlay UI ....... Chat, assignments, timetable, notices, profile  |
|    |- Admin Console .... User + department management, analytics charts  |
|    +- Responsive ....... Same codebase adapts to the mobile viewport     |
|                                                                          |
+------------+---------------------------------------------+--------------+
             |  REST (HTTPS / JSON)                         |  WebSocket
             v                                              v
+------------------------ APPLICATION TIER (Node.js) ----------------------+
|                                                                          |
|   Express REST API                    Socket.IO Real-Time Gateway        |
|    |- Auth + RBAC (JWT)                |- Movement + position broadcast  |
|    |- Academic services                |- Room presence (join / leave)   |
|    |- Assignment services              |- Chat message delivery          |
|    |- Notice + event services          |- Live notifications             |
|    +- Admin services                   +- Typing / online indicators     |
|                                                                          |
+--------+---------------------+-------------------------+----------------+
         |                     |  internal HTTP          |
         v                     v                         v
+------------------+  +------------------------+  +----------------------+
|   PostgreSQL     |  |  ML SERVICE (FastAPI)  |  |   Redis              |
|   -----------    |  |  --------------------  |  |   -----              |
|   Relational core|  |  One-shot face verify  |  |   Session store      |
|   3NF, ~22 tables|<-|  Few-shot classifier   |  |   Live presence map  |
|   Views, triggers|  |  Risk prediction (RF)  |  |   Socket room state  |
|   pgvector column|  |  Embedding generation  |  |   Rate limiting      |
+------------------+  +------------------------+  +----------------------+
```

### Rationale for the split-service design

- **Language fit.** The real-time gateway benefits from Node.js's event-driven I/O model; the ML components require the Python scientific stack. Forcing either into the other's language would be a compromise made for uniformity rather than merit.
- **Failure isolation.** If the ML service is unavailable, attendance falls back to teacher confirmation and the platform keeps running. A monolith would not degrade so gracefully.
- **Independent scaling.** Inference is CPU-intensive and bursty around class start times; the socket gateway is memory-bound and continuous. Separate processes let each be sized correctly.

---

## 7. Technology stack

Presented against the four prescribed subject areas so coverage of each is explicit and auditable.

### 7.1 Full Stack Web Development

| Layer | Technology | Role |
|---|---|---|
| Frontend framework | **React 18 + Vite** | Component architecture, routing, state for all overlay UI and the admin console |
| Campus rendering | **Phaser 3** (HTML5 Canvas / WebGL) | Tile-based campus map, sprite animation, collision detection, camera follow |
| Styling | **Tailwind CSS** | Utility-first responsive layout; one codebase serves desktop and mobile viewports |
| Backend runtime | **Node.js + Express** | REST API, business logic, authentication, role-based authorisation |
| Real-time transport | **Socket.IO** (WebSocket) | Position broadcast, room presence, chat delivery, live notifications |
| ML service | **Python + FastAPI** | Isolated inference service exposing the three AI capabilities over internal HTTP |
| Authentication | **JWT + bcrypt** | Stateless access tokens, refresh rotation, hashed credential storage |
| File handling | **Multer + object storage** | Assignment submissions, shared resources, profile and enrolment images |
| Testing | **Jest, Supertest, Pytest** | Unit tests, API integration tests, ML component tests |
| Deployment | **Docker, GitHub Actions, Render / Railway** | Containerised services, automated build and deploy on push |

### 7.2 Database Management Systems

| Component | Technology | Role |
|---|---|---|
| Primary database | **PostgreSQL 16** | Normalised relational store for all persistent entities |
| Schema design | **3NF, ~22 relations** | Full ER model with primary, foreign and composite keys |
| Integrity | Constraints, triggers, transactions | Attendance writes are transactional; triggers maintain derived attendance counters |
| Query optimisation | B-tree & composite indexes, materialised views | Indexed lookups on hot paths; pre-aggregated views for the analytics dashboard |
| Procedural logic | **PL/pgSQL** stored procedures | Attendance percentage computation and defaulter-list generation executed in-database |
| Vector storage | **pgvector** extension | Face and text embeddings stored alongside relational data, queried by cosine distance |
| Cache / ephemeral state | **Redis** | Session tokens, live avatar positions, socket room membership, rate limiting |
| Access control | Database roles + **row-level security** | Role separation enforced at the database layer, not only in application code |

### 7.3 Machine Learning, AI, and Few-Shot Learning

| Component | Technique / Library | Applied to |
|---|---|---|
| One-shot face verification | Siamese network with **FaceNet / ArcFace** embeddings; triplet loss | Confirming the student marking attendance is the enrolled student |
| Few-shot text classification | **Sentence-BERT** embeddings + **Prototypical Networks** | Routing student queries to the correct subject and faculty member |
| Attendance-risk prediction | **Random Forest / Gradient Boosting** (scikit-learn) | Identifying students trending toward attendance shortfall |
| Model explainability | **SHAP** | Presenting the reasons behind a risk flag to faculty in readable terms |
| Semantic search | Sentence embeddings + pgvector similarity | Retrieval over notices, shared resources and past resolved queries |
| Supporting libraries | PyTorch, scikit-learn, OpenCV, sentence-transformers, NumPy, Pandas | Training, image pre-processing, feature engineering, evaluation |

---

## 8. Functional modules

### M1 — Authentication and Role Management

Three roles: **Student, Teacher, Admin**. Each authenticates through a common endpoint and receives a
signed JWT carrying its role claim. Authorisation is enforced **twice** — by middleware on every protected
route, and independently by row-level security policies in PostgreSQL — so a defect in application logic
cannot by itself expose data across role boundaries. Each role gets a distinct entry experience: students
enter the campus world, teachers get a class-management console, admins get the institutional dashboard.

### M2 — The 2D Campus (Real-Time World)

A tile-based map rendered on canvas. Each connected student is an avatar whose position is transmitted to
the server and rebroadcast to all clients in the same zone. **The server is authoritative**: it validates every
movement against the collision map and the client's last known position before accepting it, preventing
position spoofing and teleportation.

Interaction is spatial, not menu-driven. Each building carries a defined proximity trigger; entering it opens
the corresponding functional context *and simultaneously registers presence in that room*. This is how "the
world is the interface" is realised in code.

| Building | Entering it opens | Presence effect |
|---|---|---|
| **Classroom** | Active session view, materials, attendance prompt | Registers the student in the live class roster |
| **Library** | Shared resources, semantic search over materials | Shows the count of students currently studying |
| **Club Room** | Club chat, membership, announcements | Marks the student as active in that club |
| **Event Hall** | Event listings, registration, live event feed | Registers attendance at an ongoing event |
| **Department Office** | Faculty directory, query submission | Routes queries via the M6 classifier |

**Design rule:** no popup spam, no nested menus, no modal dialogs stacked on modal dialogs. If you want to
do a thing, you go to the place where that thing happens. Proximity triggers everything.

### M3 — Attendance

Attendance combines **three independent signals**, which together make delegation to a peer impractical:

1. **Spatial presence** — the student's avatar is inside the virtual classroom during the session window.
2. **Identity verification** — a single camera capture verified against the stored enrolment embedding (§9.1).
3. **Teacher confirmation** — the teacher retains a final confirmation view and may override any record, with the override retained in an audit trail.

The three signals are **recorded separately in the database rather than collapsed into a single boolean**, so a
record may be marked verified, unverified or manually overridden, and so the reliability of the underlying
data is itself measurable.

### M4 — Academic Management

- **Timetable** — per-programme, per-semester schedules; a student's next class is surfaced contextually within the world (a soft marker glows over the relevant block).
- **Assignments** — creation and distribution by faculty, submission with file upload by students, deadline tracking, submission status.
- **Resources** — subject-wise materials, indexed for semantic retrieval.
- **Marks** — internal assessment records, visible to the student and concerned faculty only.

### M5 — Communication

Real-time messaging across four channel types:

| Channel type | Purpose |
|---|---|
| Student ↔ Student | Private DMs and group chat, study groups, file sharing |
| Student ↔ Teacher | Academic queries, doubt solving, assignment discussion, resource sharing |
| Teacher ↔ Teacher | Departmental / faculty communication |
| Admin → Everyone | Announcements, notices, emergency alerts |

Groups are both **academic** (CSE Third Year, Operating Systems, DBMS, Placement Cell) and
**interest-based** (Coding Club, Photography Club, Anime Club). Each group maintains its own message
history, shared file store, announcements and membership roster. Messages are persisted relationally and
delivered over the socket gateway, so history survives disconnection.

### M6 — Intelligent Query Routing

A student raising a doubt writes it in natural language **without selecting a category**. The few-shot
classifier (§9.2) assigns it to a subject and thereby to the responsible faculty member, and simultaneously
runs a similarity search over previously resolved queries. Where a close match exists, the earlier answer is
surfaced immediately — which reduces repeated questions and gives the resolved-query store
**compounding value over time**.

### M7 — Analytics and Administration

User, department, subject and event management for administrators, plus an analytics view reporting
attendance trends by cohort, engagement distribution, club participation, and the output of the risk model.
Risk output is presented to faculty as a **ranked list accompanied by SHAP-derived explanations** — e.g. that
a flag is driven principally by consecutive absence in a single subject rather than a uniform decline — on the
reasoning that **an unexplained score is not actionable**.

---

## 9. Machine learning components

Three learning components. Two operate under extreme data scarcity and are framed as few-shot
problems; the third is a conventional supervised task. **The distinction is deliberate and is the analytical
core of the project.**

### 9.1 One-shot facial verification for attendance

**Why this is a one-shot problem.** A conventional face classifier needs many labelled images per student and
must be retrained whenever a student joins or leaves. Neither condition holds in a university: enrolment
provides one or two photographs per student, and the roster changes every term. The problem must
therefore be **reformulated from classification to verification** — learning a similarity function rather than a
set of classes.

**Approach**

- A **Siamese convolutional network** is trained on a *public* face dataset (LFW or CASIA-WebFace) using **triplet loss**, learning to embed faces into a space where distance corresponds to identity difference. *It is never trained on the university's own students.*
- At enrolment, a single photograph per student is passed through the network and the resulting **128-dimensional embedding** is stored in a `pgvector` column against that student.
- At attendance time, the captured frame is embedded and compared to the stored embedding by **cosine distance**. A distance below a calibrated threshold verifies the student.
- **Adding a new student requires storing one embedding. No retraining is required at any point.** This property is the practical justification for the approach.

**Evaluation.** Verification accuracy, precision and recall on a held-out split; **FAR** (false acceptance rate) and
**FRR** (false rejection rate) reported across a range of thresholds. The operating threshold is selected to
**prioritise a low FAR** — wrongly admitting an impostor corrupts the attendance record, whereas wrongly
rejecting a genuine student is recoverable through teacher override.

**Limitations to be reported, not omitted.** Performance under poor lighting, partial occlusion and low-quality
webcams; susceptibility to a photograph-of-a-photograph, for which a basic **liveness check** (prompted blink
or head turn) is proposed as mitigation.

### 9.2 Few-shot classification for query routing

**Why this is a few-shot problem.** The system begins with **no labelled corpus** of student queries. Categories
correspond to subjects and departments, which differ between institutions and change between semesters,
and new categories must become usable immediately rather than after a data-collection exercise. Training a
conventional text classifier is impossible at launch — the classic **cold-start** condition.

**Approach**

- A pre-trained **Sentence-BERT** encoder produces sentence embeddings with no task-specific training.
- For each category, **5–10 example queries** are supplied and averaged into a single **prototype vector** — the Prototypical Networks formulation.
- An incoming query is embedded and assigned to the nearest prototype by cosine similarity. Where the margin between the top two prototypes falls below a confidence threshold, the query is **escalated to manual routing rather than misrouted silently**.
- Every resolved query is appended to its category's support set, so prototypes **improve continuously as the system is used, with no retraining step**.

**Evaluation.** N-way K-shot accuracy at **K = 1, 5 and 10** to demonstrate the effect of support-set size;
comparison against a **TF-IDF + logistic regression baseline** trained on the same limited data, expected to
establish the advantage of the few-shot approach specifically in the low-K regime.

### 9.3 Attendance-risk prediction (supervised)

Unlike the preceding two, this task accumulates ample data — *every attendance record is a labelled
example* — and is approached conventionally. A **Random Forest** classifier predicts the probability a student
will fall below the minimum attendance requirement by end of term.

| Feature | Description |
|---|---|
| Attendance ratio to date | Sessions attended ÷ sessions held, overall and per subject |
| Consecutive absence streak | Longest and most recent run of unattended sessions |
| Trend slope | Direction and gradient of attendance over a rolling window |
| Day and slot pattern | Whether absence concentrates on particular weekdays or time slots |
| Subject variance | Whether absence is uniform or concentrated in one subject |
| Platform engagement | Assignment submission rate, resource access frequency, chat activity |
| Social participation | Club membership and event attendance counts |

**Evaluation.** Accuracy, precision, recall, F1 and ROC-AUC under stratified cross-validation, with **recall
prioritised** — failing to flag an at-risk student is materially more costly than raising a false alarm. **SHAP
values are computed for every prediction** and surfaced in the faculty interface.

### 9.4 Data and ethics

- Facial embeddings are stored as **irreversible numerical vectors**. No raw attendance images are retained beyond the verification request.
- Enrolment in facial verification is **consent-based**, and a **manual alternative** remains available to any student who declines.
- Risk predictions are visible to **faculty and to the student concerned**, and are **never used punitively** — the stated purpose is early support.
- For development and demonstration, the system is populated with **synthetic student records and publicly licensed face datasets**, not real student data.

---

## 10. Database design

Normalised to **Third Normal Form**; approximately **22 relations**.

### 10.1 Tables by group

| Group | Tables |
|---|---|
| **People** | `users`, `students`, `teachers`, `departments` |
| **Academics** | `subjects`, `enrollments`, `class_sessions`, `attendance`, `assignments`, `submissions`, `marks` |
| **Social** | `channels`, `channel_members`, `messages`, `clubs`, `club_members`, `events` |
| **Platform** | `notices`, `queries`, `resources`, `timetable` |
| **AI** | `face_embeddings`, `risk_scores`, `query_prototypes` |

### 10.2 Principal entities

| Entity | Key attributes | Relationships |
|---|---|---|
| `users` | `user_id` (PK), `email`, `password_hash`, `role`, `created_at` | Supertype for students, teachers, admins |
| `students` | `student_id` (PK, FK→users), `roll_no`, `dept_id` (FK), `semester`, `section` | Belongs to department; enrols in subjects |
| `teachers` | `teacher_id` (PK, FK→users), `employee_id`, `dept_id` (FK), `designation` | Belongs to department; teaches subjects |
| `departments` | `dept_id` (PK), `name`, `code`, `hod_id` (FK→teachers) | Contains students, teachers, subjects |
| `subjects` | `subject_id` (PK), `code`, `name`, `dept_id` (FK), `semester`, `credits` | Taught by teachers; enrolled in by students |
| `enrollments` | `student_id` (FK), `subject_id` (FK) — composite PK | Resolves M:N between students and subjects |
| `class_sessions` | `session_id` (PK), `subject_id` (FK), `teacher_id` (FK), `start_at`, `end_at`, `room` | One live class instance |
| `attendance` | `attendance_id` (PK), `session_id` (FK), `student_id` (FK), `status`, `verification_method`, `confidence`, `marked_at` | Composite unique on (`session_id`, `student_id`) |
| `face_embeddings` | `student_id` (PK, FK), `embedding vector(128)`, `enrolled_at` | One enrolment embedding per student |
| `assignments` | `assignment_id` (PK), `subject_id` (FK), `teacher_id` (FK), `title`, `description`, `due_at` | Issued to a subject cohort |
| `submissions` | `submission_id` (PK), `assignment_id` (FK), `student_id` (FK), `file_url`, `submitted_at`, `marks` | One submission per student per assignment |
| `messages` | `message_id` (PK), `sender_id` (FK), `channel_id` (FK), `body`, `sent_at` | Belongs to a channel |
| `channels` | `channel_id` (PK), `type`, `name`, `created_by` (FK) | Private, group, club or announcement |
| `channel_members` | `channel_id` (FK), `user_id` (FK) — composite PK | Resolves M:N between users and channels |
| `clubs` | `club_id` (PK), `name`, `description`, `coordinator_id` (FK) | Has members and events |
| `events` | `event_id` (PK), `title`, `club_id` (FK), `venue`, `start_at` | Attended by students |
| `queries` | `query_id` (PK), `student_id` (FK), `body`, `predicted_subject_id` (FK), `confidence`, `assigned_teacher_id` (FK), `status`, `embedding vector(384)` | Routed by the M6 classifier |
| `notices` | `notice_id` (PK), `title`, `body`, `posted_by` (FK), `audience_scope`, `posted_at` | Broadcast by administrators |
| `risk_scores` | `student_id` (FK), `subject_id` (FK), `score`, `computed_at`, `top_factors` (JSONB) | Output of the risk model with SHAP factors |

### 10.3 Notable design decisions

- **Supertype/subtype for users.** Shared credential and role fields are held once in `users`; role-specific attributes live in `students` and `teachers`. Avoids the wide, sparsely populated table a single combined relation would produce.
- **Attendance verification is recorded, not assumed.** The `attendance` relation stores `verification_method` and the model's `confidence` alongside `status`, so the provenance of every record is auditable and manual overrides stay distinguishable from verified entries.
- **Embeddings are stored in-database.** `pgvector` keeps face and text vectors adjacent to the relational data they describe — no separate vector store, and similarity search is expressible in ordinary SQL alongside relational predicates.
- **Derived values are maintained by trigger.** Attendance percentages are updated by an `AFTER INSERT` trigger rather than recomputed on read, since dashboards read them far more often than attendance is written.
- **Ephemeral state is excluded from PostgreSQL.** Live avatar positions change several times per second and have no archival value; they live in Redis, keeping the relational store free of high-frequency write traffic.
- **Permissions enforced twice.** Once in API middleware, and again with row-level security in the database — so a bug in the code alone cannot leak data across roles.

---

## 11. Representative system workflow

A single attendance event traced across every tier:

```
  1.  Teacher opens a session       ->  POST /api/sessions
                                        INSERT INTO class_sessions
                                        Socket broadcast to enrolled cohort

  2.  Student enters the classroom  ->  Avatar crosses the proximity trigger
                                        Socket: room:join { session_id }
                                        Redis: presence registered
                                        [ SIGNAL 1 - spatial presence ]

  3.  Verification prompt           ->  Client captures a single frame
                                        POST /api/attendance/verify (multipart)

  4.  Node forwards to ML service   ->  POST http://ml-service/verify

  5.  ML service                    ->  Pre-process, detect and align face
                                        Siamese network -> 128-d embedding
                                        SELECT embedding FROM face_embeddings
                                        Cosine distance vs. enrolment vector
                                        Return { verified, distance, confidence }
                                        [ SIGNAL 2 - identity verification ]

  6.  Node persists the record      ->  BEGIN
                                          INSERT INTO attendance
                                            (session_id, student_id, status,
                                             verification_method, confidence)
                                        COMMIT
                                        Trigger updates the attendance counter

  7.  Teacher confirms the roster   ->  Live roster with per-student status
                                        Override available, kept in audit trail
                                        [ SIGNAL 3 - teacher confirmation ]

  8.  Downstream effects            ->  Risk model re-scores affected students
                                        SHAP factors written to risk_scores
                                        Analytics materialised view refreshed
```

### A day inside the campus (student UX flow)

```
You log in
  -> Short cinematic, then you drop into the campus. No tutorial, no popup.
  -> You're outside the main block. Twelve other avatars are moving around.
     Two are your friends -- you can see their names.
  -> Your next class is in 10 minutes. A soft marker glows over the CS block.
  -> You walk in. The room opens: today's topic, materials, and the roster
     of who's already inside.
  -> Attendance prompt. One camera capture. Verified in ~2 seconds.
     The teacher sees you turn green on their live roster.
  -> Class ends. You walk to the library. It shows "9 students studying".
     You drop into a study group chat with the people actually in the room.
  -> On the way out you pass the Coding Club. "5 active sessions" floats
     above the door. You walk in. You're now a member.
```

---

## 12. Roles — what each one gets

| | **Student** | **Teacher** | **Admin** |
|---|---|---|---|
| Entry experience | The campus world | A class console | An institution dashboard |
| | Walk around · attend classes | Start / end sessions | Manage users & departments |
| | Submit assignments | Confirm attendance rosters | Subjects and timetables |
| | Chat & study groups | Upload assignments | Broadcast notices |
| | Join clubs and events | Answer routed doubts | Event management |
| | Ask doubts · see marks | Faculty channels | Analytics & trends |
| | Track own attendance | See at-risk student flags | Moderation and settings |

---

## 13. Implementation roadmap

Seven phases. **Phases 1–4 constitute the MVP and are the committed deliverable**; phases 5–7 extend it.
This ordering guarantees a demonstrable, defensible system well before the deadline — the principal
risk-management measure of the plan.

### Timeline per S6 (latest synopsis) — 32 weeks total

| Phase | Duration | Deliverable |
|---|---|---|
| 1. Foundation | 3 wks | Schema, ER model, project scaffolding, CI |
| 2. Core backend | 5 wks | REST API, auth, RBAC, academic CRUD |
| 3. Campus client | 6 wks | Real-time 2D campus with 3 enterable buildings |
| 4. Attendance | 5 wks | One-shot verification wired into the attendance flow (**MVP complete**) |
| 5. Communication | 4 wks | Chat, groups, clubs, notifications |
| 6. Intelligence layer | 5 wks | Query routing, risk model, analytics dashboard |
| 7. Hardening & delivery | 4 wks | Testing, deployment, documentation, demo |

### Timeline per S4/S5 (proposal) — 40 weeks total, ~2 semesters

| Phase | Duration | Deliverable | Subject area |
|---|---|---|---|
| 1. Foundation | 4 wks | Requirements spec, ER model, normalised schema, PostgreSQL setup, scaffolding, CI pipeline | DBMS |
| 2. Core backend | 6 wks | Express REST API, JWT auth, RBAC, academic CRUD services, unit + integration tests | Full Stack |
| 3. Campus client | 8 wks | React app, Phaser campus map, avatar control, Socket.IO movement sync, three enterable buildings | Full Stack |
| 4. Attendance + verification | 6 wks | Session lifecycle, Siamese model trained and evaluated, FastAPI inference service, end-to-end attendance flow | Few-Shot / AI |
| 5. Communication | 5 wks | Channels, real-time chat, groups and clubs, file sharing, notifications | Full Stack |
| 6. Intelligence layer | 6 wks | Few-shot query classifier, prototype store, risk model with SHAP, analytics dashboard | ML / Few-Shot |
| 7. Hardening & delivery | 5 wks | Test coverage, load testing of the socket layer, deployment, documentation, report, demonstration | All |

**Milestones.** A reviewable increment is targeted at the end of **phases 2, 4 and 6** — respectively a working
API with seeded data, a complete verified attendance flow inside the campus, and the full intelligence layer.
Each is independently demonstrable.

---

## 14. Testing strategy

| Level | Method | Coverage target |
|---|---|---|
| **Unit** | Jest (Node), Pytest (Python) | Business logic, validators, utility functions, model pre-processing |
| **Integration** | Supertest against a seeded test database | Every REST endpoint under each of the three roles, including negative authorisation cases |
| **Database** | Transaction and constraint tests | Referential integrity, trigger correctness, concurrent attendance writes to the same session |
| **Real-time** | Socket.IO client harness | Movement sync, room join/leave, message delivery ordering, reconnection behaviour |
| **Machine learning** | Held-out evaluation, N-way K-shot protocol | Verification FAR/FRR curves; few-shot accuracy at K = 1, 5, 10; risk model cross-validation |
| **Load** | Artillery / k6 | Concurrent socket connections with sustained movement broadcast, to establish the practical ceiling |
| **Security** | Manual and automated review | JWT handling, upload validation, SQL injection, role escalation, rate limiting |
| **Acceptance** | Scenario walkthrough | Complete journeys for each role from login to task completion |

---

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Scope expansion beyond what the team can deliver** | The scope boundary in §5 is fixed in advance. Phases 1–4 form a self-contained MVP; phases 5–7 are additive and may be reduced without invalidating the deliverable. |
| **Real-time synchronisation proving harder than estimated** | Movement sync is scheduled early (Phase 3) rather than late, so difficulty is discovered while there is time to respond. A polling fallback is available if WebSocket performance is inadequate. |
| **Facial verification underperforming on low-quality webcams** | Verification is one of three attendance signals, not the sole determinant. Teacher confirmation always remains authoritative, so the flow degrades rather than fails. |
| **Insufficient real data for the risk model** | A synthetic dataset generator producing realistic attendance patterns is built in Phase 1, allowing model development to proceed independently of data collection. |
| **ML service latency delaying attendance at class start** | Embeddings are pre-computed at enrolment; only the query embedding is computed at request time. The service is separately deployable and can be scaled independently. |
| **Privacy concerns regarding facial data** | Only irreversible embeddings are stored, participation is consent-based, a manual alternative is always available, and development uses public datasets and synthetic records. |

---

## 16. Expected outcomes

- A **deployed, publicly accessible web platform** supporting three roles with a real-time, multi-user 2D campus as its primary interface.
- A **normalised PostgreSQL database** of ~22 relations with documented ER model, integrity constraints, procedural logic and an indexing strategy.
- A **one-shot facial verification component** with reported accuracy, FAR and FRR, requiring a single enrolment image per student and no retraining on roster change.
- A **few-shot query classifier** with accuracy reported at K = 1, 5 and 10, benchmarked against a conventional supervised baseline on identical data.
- An **attendance-risk model** with reported cross-validated metrics and SHAP-based explanations surfaced in the faculty interface.
- A complete **project report, API documentation, database documentation, and a recorded end-to-end demonstration**.

---

## 17. Future scope

- A **native mobile client** for offline access and push notification support.
- **Voice proximity chat** within the campus, replicating the acoustic behaviour of physical space.
- Expansion of the campus map to a **full replica of the institution**, with department-specific interiors.
- **Integration with an existing university ERP** or student information system.
- A **retrieval-augmented campus assistant** answering institutional questions from notices, timetables and policy documents.
- Automated preliminary assessment of objective assignment submissions.
- Migration of the campus renderer to **WebGL for a 2.5D or isometric presentation**.

---

## 18. Open items and inconsistencies

Things to resolve before submission — these are genuine conflicts between the source documents, not
oversights in this summary.

| # | Item | Detail |
|---|---|---|
| **O1** | **Team size conflict** | S4 (18-pp. proposal) is written as an **individual** project by Shaurya Johri; S6 (latest synopsis) states a **4-member** team. S4's title page, signature block and risk table ("scope beyond what a single developer can deliver") all need rewriting if S4 is submitted. |
| **O2** | **Timeline conflict** | S4/S5 total **40 weeks** (~2 semesters); S6 totals **32 weeks**. Every phase differs by 1–2 weeks. Pick one and make it consistent across documents. |
| **O3** | **Blank fields in S4** | Enrolment / Roll No., Semester, Project Supervisor and Session year are all `[ to be filled ]`. S6 names **Mr. Nishant Bhandari** as faculty mentor — propagate that. |
| **O4** | **Table count** | Both documents say "~22 tables". S4's entity table enumerates 19; the grouped list in S5/S6 enumerates 24. The final ER model needs to settle the actual number. |
| **O5** | **Name spelling** | The older synopsis (S2) lists "**Sharuya** Johri" — almost certainly a typo for Shaurya Johri. |
| **O6** | **Provenance of the concept** | S1 (`GEHU-METAVERSE-Revised.pdf`) is authored by **Arpan Singh** under the name *GEHUVerse*, and S2 lists Arpan Singh as Member 1. Neither appears in the current 4-member team. Worth being clear on attribution if any of that material is reused. |
| **O7** | **No code exists** | Nothing has been implemented. Phase 1 (schema + ER model + scaffolding + CI) has not started. |
| **O8** | **Repository** | S5 cites `github.com/shauryajohri` in every page footer, but no repository for this project exists locally. |

---

## Appendix A — Lineage: from GEHUVerse to METAVERSE

The current project is the fourth iteration of an idea that has narrowed considerably. Understanding what
was dropped is useful, because the dropped material is essentially the "future scope" list.

### A1. GEHUVerse (S1, Aug 2025) — Arpan Singh, with Asmit Bhandari

A 38-page maximalist vision for "a persistent, multi-style, social metaverse for campus students". Far
broader than the current project. Key elements, none of which survive into the current scope:

**Zones:** Main Campus Hub · Collaboration Hub (Monaco editor, whiteboards, scrum boards) ·
Competition Arena · **Faculty Dungeons** (gamified academic puzzles as an alternative merit system) ·
Club Rooms (AI, Robotics, Art, Cultural) · **Travel Memory Spots** mirroring real Dehradun landmarks
(Tapkeshwar Temple, Robber's Cave, Forest Research Institute, Sahastradhara, Paltan Bazaar) ·
Library / "Thought Temple" · Design Thinking Club · Event Grounds · Hall of Fame · Inter-Campus Portals
(Bhimtal, Haldwani, Roorkee) · Student Marketplace & Freelance Hub · Career Center · Builder's Hall
(student modding tools) · Secret Knowledge Rooms · Civic Partnership Spots (NGO / government zones).

**Social layer:** Discord-style chat · **StudentGram** (Instagram-style feed with stories and geotags) ·
Snapchat-style Explore heatmap · Reddit-style forums with karma · billboards with student- and
university-controlled ad slots · WebRTC proximity voice.

**Gamification:** XP for everything · badges and titles ("Debugger", "Wanderer", "Core Member") ·
leaderboards by department / club / skill · external profile integration (GitHub, Codeforces, HackerRank,
Kaggle, Behance, Spotify) · Dungeon Quest Chains · seasonal Competitive Leagues (Code, Design, Music,
Open) · Meta-Quests.

**Modes:** Visitor (alumni, parents, prospective students) · Student · Faculty.

**Stack (much heavier than current):** TypeScript, Phaser.js, React, Zustand, Tailwind + shadcn/ui, Vite,
**Electron**; Node.js, Express + tRPC, Socket.IO, Passport.js + JWT, Redis, PostgreSQL + **Prisma**, **BullMQ**;
Multer + Sharp, **Meilisearch**, Cloudflare R2 / MinIO; Docker, Fly.io / Railway / Render, Nginx,
GitHub Actions, Sentry, Prometheus + Grafana, Loki. Explicitly microservice-ready.

The document lists its own gaps: content creation pipeline, faculty tools, privacy & data ownership,
educational analytics, accessibility, mobile UX, identity verification, offline support, third-party extensions,
revenue model, end-to-end UX journeys.

### A2. GEHU Virtual Campus (S2, Oct 2025) — Arpan Singh + Shaurya Johri

A 3-page academic synopsis, much smaller. Explicitly **inspired by Gather.Town**. Core proposal: a 2D map
of GEHU, avatars, real-time multiplayer chat, and **AI-powered NPCs** (Library Assistant, Classroom Guide)
as the distinguishing feature, plus gamification (points, rewards, leaderboards).

Planned stack: **Phaser.js or Unity** frontend · Node.js + Socket.IO backend · MongoDB **or** PostgreSQL ·
Python Flask/FastAPI + NLP for the NPCs · Netlify/Vercel + Render/Heroku.

Prototype scope: one main building map, a Library NPC, multiplayer chat, a basic profile system.
Future: multiple floors, AI assistants, gamification, **college ERP integration**.

### A3. METAVERSE vision reset (S3, Jul 2026) — Shaurya Johri

The current concept's first statement, explicitly "**completely independent from AURA**" (a separate project).
Introduces the ideas that define the project today: *"the world is the interface"*, three roles with distinct
dashboards, a communication hub as a core feature, attendance as part of the platform, and one backend
powering everything.

**Two-client model (later dropped):**

- **Mobile app** — daily university tasks, fast and simple. No game. Login, attendance, timetable, assignments, notices, chat, notifications, events, clubs, profile, marks, fees (optional later).
- **Windows app** — the immersive playable 2D campus.

Attendance methods floated: teacher starts class → student joins classroom → auto-recorded; **or** QR-code
attendance with mobile scan and instant sync.

It also lists the planning deliverables to produce before coding: SRS, feature list (MVP → advanced),
UI/UX flow, system architecture, database schema, multiplayer & networking, tech stack, 12-month
roadmap, testing strategy, deployment plan.

### A4. What changed, and why it matters

| Dimension | GEHUVerse (S1) | Current METAVERSE (S4–S6) |
|---|---|---|
| Framing | Social metaverse / campus culture | University **management system** with a spatial interface |
| Clients | Electron desktop + future mobile | **One responsive web client** |
| Differentiator | Breadth: 15+ zones, StudentGram, marketplace, dungeons | Depth: **three ML components solving real data-scarcity problems** |
| Gamification | Central (XP, leagues, badges, titles) | **Absent** — not in scope |
| Social media layer | StudentGram, heatmaps, forums, billboards | **Absent** — replaced by structured channels |
| ORM / search / queues | Prisma, Meilisearch, BullMQ | Plain SQL, pgvector, no queue |
| Academic anchor | Full-stack + system design | Full Stack + **DBMS + ML + Few-Shot Learning** |

The narrowing is deliberate and is the project's main defence: the current version is small enough to finish,
and has a genuine research-flavoured core (one-shot and few-shot learning under real cold-start
conditions) that the earlier version lacked.

---

## Appendix B — References cited in the proposal

1. Koch, G., Zemel, R., Salakhutdinov, R. *"Siamese Neural Networks for One-shot Image Recognition."* ICML Deep Learning Workshop, 2015.
2. Schroff, F., Kalenichenko, D., Philbin, J. *"FaceNet: A Unified Embedding for Face Recognition and Clustering."* CVPR, 2015.
3. Snell, J., Swersky, K., Zemel, R. *"Prototypical Networks for Few-shot Learning."* NeurIPS, 2017.
4. Reimers, N., Gurevych, I. *"Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks."* EMNLP, 2019.
5. Deng, J., Guo, J., Xue, N., Zafeiriou, S. *"ArcFace: Additive Angular Margin Loss for Deep Face Recognition."* CVPR, 2019.
6. Lundberg, S., Lee, S. *"A Unified Approach to Interpreting Model Predictions."* NeurIPS, 2017.
7. Breiman, L. *"Random Forests."* Machine Learning, 45(1), 2001.
8. Wang, Y., Yao, Q., Kwok, J., Ni, L. *"Generalizing from a Few Examples: A Survey on Few-Shot Learning."* ACM Computing Surveys, 53(3), 2020.
9. Elmasri, R., Navathe, S. *Fundamentals of Database Systems*, 7th ed., Pearson, 2016.
10. PostgreSQL Global Development Group. *PostgreSQL 16 Documentation.*
11. *pgvector* — Open-source vector similarity search for PostgreSQL.
12. *Socket.IO Documentation* — Bidirectional and low-latency communication.
13. *Phaser 3 Documentation* — HTML5 game framework.

---

## Appendix C — Immediate next steps (Phase 1)

Nothing is built yet. Phase 1 of the roadmap calls for:

- [ ] Software Requirements Specification (SRS)
- [ ] ER model and normalised schema, settling the final table count (see O4)
- [ ] PostgreSQL 16 setup with the `pgvector` extension
- [ ] Repository scaffolding — `client/`, `server/`, `ml-service/`, Docker Compose for local dev
- [ ] GitHub Actions CI pipeline (lint, type check, test, build)
- [ ] Synthetic dataset generator for realistic attendance patterns (mitigates the risk-model data risk)
- [ ] Reconcile O1–O3 across the proposal and synopsis before submission
