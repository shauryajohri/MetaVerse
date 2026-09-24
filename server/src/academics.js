// Academic records: student profiles, classes, PBL groups and attendance.
//
// Temporary store mirroring the DOCS.md schema (`students`, `subjects`,
// `class_sessions`, `attendance`, plus PBL groups) until PostgreSQL lands.
//
// Attendance has two sources:
//   - marks saved by teachers (persisted to data/attendance.json), and
//   - generated demo history for sessions before DEMO_UNTIL,
// so sessions after DEMO_UNTIL stay "pending" until a teacher marks them.
// Every record carries `source` so rows imported from the GEHU ERP later can sit alongside.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { findById, usersByRole } from './users.js';

export const THRESHOLD = 75; // % attendance required

const TERM_START = '2026-07-20';
const DEMO_UNTIL = '2026-09-18'; // last day of generated demo history

const DATA_DIR = new URL('../data/', import.meta.url);
const MARKS_FILE = new URL('attendance.json', DATA_DIR);

// ---- people ------------------------------------------------------------------

const students = new Map(
  usersByRole('student').map((u, i) => [
    u.id,
    {
      course: 'B.Tech',
      branch: 'CSE',
      department: 'Computer Science & Engineering',
      semester: 5,
      section: 'A',
      batch: '2023–2027',
      email: `${u.name.split(' ')[0].toLowerCase()}.${u.rollNo}@gehu.ac.in`,
      pblGroup: `G-${String(7 + Math.floor(i / 4)).padStart(2, '0')}`, // groups of four: G-07, G-08, …
    },
  ]),
);

const DEMO_TEACHER = 2;

// days: 0=Sun … 6=Sat. `rate` only drives the demo generator.
// `teacherId` links a subject to a login; others show the faculty name only.
const subjects = [
  { code: 'CS-501', name: 'Design & Analysis of Algorithms', faculty: 'Dr. Meenakshi Joshi', days: [1, 3, 5], rate: 0.86 },
  { code: 'CS-502', name: 'Database Management Systems', teacherId: DEMO_TEACHER, days: [1, 2, 4], rate: 0.9 },
  { code: 'CS-503', name: 'Computer Networks', faculty: 'Dr. Ankit Sharma', days: [2, 4], rate: 0.64 },
  { code: 'CS-504', name: 'Operating Systems', faculty: 'Ms. Priya Kandari', days: [1, 3, 4], rate: 0.8 },
  { code: 'CS-505', name: 'Machine Learning', faculty: 'Dr. Vikas Thapliyal', days: [2, 5], rate: 0.93 },
  { code: 'CS-551', name: 'DBMS Lab', teacherId: DEMO_TEACHER, days: [3], rate: 0.82 },
].map((s) => ({ ...s, section: 'A', faculty: s.teacherId ? findById(s.teacherId).name : s.faculty }));

const PROJECTS = [
  ['METAVERSE — Digital University Ecosystem', 'Full Stack · DBMS · Machine Learning', 'A university management platform whose interface is a walkable, multiplayer 2D campus.'],
  ['Smart Parking for Dehradun', 'IoT · Computer Vision', 'Camera-based detection of free parking spots, published live to a mobile map.'],
  ['Doon Air Quality Forecaster', 'Machine Learning · Data Engineering', 'Predicts next-day AQI for city wards from weather and traffic data.'],
  ['Campus Lost & Found', 'Full Stack · Mobile', 'A reporting and matching app for items lost around the university.'],
  ['Crop Disease Detector', 'Deep Learning · Mobile', 'Identifies common crop diseases from a leaf photo, offline on a phone.'],
  ['Hostel Mess Feedback System', 'Full Stack · Analytics', 'Daily meal ratings with trend dashboards for the mess committee.'],
];

const MILESTONES = [
  ['Team formation & topic approval', '2026-07-25', 'completed', 'Topic approved.'],
  ['Synopsis submission', '2026-08-10', 'completed', 'Accepted.'],
  ['SRS & design review', '2026-09-05', 'completed', 'Tighten the scope before the next review.'],
  ['Mid-term review — working prototype', '2026-10-10', 'in-progress', null],
  ['Final evaluation & report', '2026-12-05', 'upcoming', null],
];

const pblGroups = new Map();
for (const [id, s] of students) {
  if (!pblGroups.has(s.pblGroup)) {
    const n = pblGroups.size;
    const [title, domain, summary] = PROJECTS[n % PROJECTS.length];
    pblGroups.set(s.pblGroup, {
      id: s.pblGroup,
      // Demo Teacher mentors the first two groups so the marking page has PBL work to do.
      mentorId: n < 2 ? DEMO_TEACHER : null,
      mentor: { name: n < 2 ? findById(DEMO_TEACHER).name : 'Ms. Kavita Rana', department: 'CSE' },
      project: { title, domain, summary },
      day: 6, // weekly PBL session on Saturdays
      memberIds: [],
      milestones: MILESTONES.map(([t, due, status, remarks]) => ({ title: t, due, status, remarks })),
    });
  }
  pblGroups.get(s.pblGroup).memberIds.push(id);
}
const PBL_ROLES = ['Team Lead', 'Frontend', 'Backend', 'ML & Testing'];

// ---- saved marks -------------------------------------------------------------

/** marks[classKey][date] = { by, at, statuses: { [userId]: 'present' | 'absent' } } */
const marks = existsSync(MARKS_FILE) ? JSON.parse(readFileSync(MARKS_FILE, 'utf8')) : {};

function saveMarks() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(MARKS_FILE, JSON.stringify(marks, null, 2));
}

// ---- demo generator -----------------------------------------------------------

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  // murmur3 finaliser — FNV alone clusters on strings that differ only at the end
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const iso = (d) => d.toISOString().slice(0, 10);

/** Local calendar date (the server's timezone), not UTC. */
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Scheduled dates on the given weekdays from term start up to and including today. */
function sessionDates(days) {
  const out = [];
  const end = today();
  for (let d = new Date(`${TERM_START}T00:00:00Z`); iso(d) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.includes(d.getUTCDay())) out.push(iso(d));
  }
  return out;
}

/** A student's record for one session, or null if nobody has marked it yet. */
function recordFor(userId, key, date, rate) {
  const saved = marks[key]?.[date]?.statuses[userId];
  if (saved) return { date, status: saved, source: 'metaverse' };
  if (date > DEMO_UNTIL) return null;
  return { date, status: hash(`${userId}:${key}:${date}`) < rate ? 'present' : 'absent', source: 'metaverse' };
}

export function summarise(records) {
  const held = records.length;
  const attended = records.filter((r) => r.status === 'present').length;
  const t = THRESHOLD / 100;
  return {
    held,
    attended,
    percent: held ? Math.round((attended / held) * 1000) / 10 : 100,
    canMiss: Math.max(0, Math.floor(attended / t - held)), // classes you can skip and stay ≥ threshold
    mustAttend: Math.max(0, Math.ceil((t * held - attended) / (1 - t))), // consecutive classes needed to reach it
  };
}

// ---- classes (a subject or a PBL group — anything a teacher takes attendance for) ----

const pblKey = (groupId) => `PBL-${groupId}`;

function classByKey(key) {
  const s = subjects.find((x) => x.code === key);
  if (s) {
    return {
      key,
      kind: 'subject',
      title: s.name,
      subtitle: `${s.code} · CSE ${s.section}`,
      teacherId: s.teacherId,
      days: s.days,
      rate: s.rate,
      roster: [...students.keys()],
    };
  }
  const g = pblGroups.get(key.replace(/^PBL-/, ''));
  if (g && key.startsWith('PBL-')) {
    return { key, kind: 'pbl', title: g.project.title, subtitle: `PBL group ${g.id}`, teacherId: g.mentorId, days: [g.day], rate: 0.88, roster: g.memberIds };
  }
  return null;
}

const recordsFor = (userId, c) => sessionDates(c.days).map((d) => recordFor(userId, c.key, d, c.rate)).filter(Boolean);

// ---- student queries ------------------------------------------------------------

export const getStudent = (userId) => students.get(userId) ?? null;

export function getAttendance(userId) {
  const list = subjects.map((s) => {
    const records = recordsFor(userId, classByKey(s.code));
    return { code: s.code, name: s.name, faculty: s.faculty, ...summarise(records), records };
  });
  return { threshold: THRESHOLD, overall: summarise(list.flatMap((s) => s.records)), subjects: list };
}

export function getPbl(userId) {
  const g = pblGroups.get(students.get(userId)?.pblGroup);
  if (!g) return null;
  const topics = ['Stand-up & task review', 'Design walkthrough', 'Code review', 'Mentor feedback', 'Demo & planning'];
  const dates = sessionDates([g.day]);
  const sessions = dates
    .map((d, i) => {
      const r = recordFor(userId, pblKey(g.id), d, 0.88);
      return r && { ...r, topic: topics[i % topics.length] };
    })
    .filter(Boolean);
  const { day, memberIds, mentorId, ...rest } = g;
  return {
    ...rest,
    members: memberIds.map((id, i) => {
      const u = findById(id);
      return { name: u.name, rollNo: u.rollNo, role: PBL_ROLES[i], you: id === userId };
    }),
    attendance: { threshold: THRESHOLD, ...summarise(sessions), sessions },
  };
}

// ---- teacher queries -----------------------------------------------------------

/** Classes this teacher takes attendance for, with how many sessions still need marking. */
export function getTeacherClasses(teacherId) {
  const keys = [...subjects.map((s) => s.code), ...[...pblGroups.keys()].map(pblKey)];
  return keys
    .map(classByKey)
    .filter((c) => c.teacherId === teacherId)
    .map((c) => ({
      key: c.key,
      kind: c.kind,
      title: c.title,
      subtitle: c.subtitle,
      students: c.roster.length,
      pending: sessionDates(c.days).filter((d) => d > DEMO_UNTIL && !marks[c.key]?.[d]).length,
    }));
}

/** Returns the class if this teacher may mark it, else null. */
export function teacherClass(teacherId, key) {
  const c = classByKey(key);
  return c && c.teacherId === teacherId ? c : null;
}

/** Recent scheduled sessions, newest first, with whether each has been marked. */
export function getSessions(c) {
  return sessionDates(c.days)
    .reverse()
    .slice(0, 14)
    .map((date) => {
      const m = marks[c.key]?.[date];
      return { date, state: m ? 'marked' : date > DEMO_UNTIL ? 'pending' : 'demo', markedAt: m?.at ?? null };
    });
}

export const isSessionDate = (c, date) => sessionDates(c.days).includes(date);

/** Roster for one session: each student's mark for that date plus their running percentage. */
export function getRoster(c, date) {
  return c.roster.map((id) => {
    const u = findById(id);
    const rec = recordFor(id, c.key, date, c.rate);
    return { userId: id, rollNo: u.rollNo, name: u.name, status: rec?.status ?? null, percent: summarise(recordsFor(id, c)).percent };
  });
}

export function saveSession(c, date, statuses, teacherId) {
  marks[c.key] ??= {};
  marks[c.key][date] = { by: teacherId, at: new Date().toISOString(), statuses };
  saveMarks();
}
