// Academic records: student profiles, classes, PBL groups and attendance, read from the store.
//
// Attendance has two sources:
//   - marks saved by teachers (db.marks), and
//   - generated demo history for sessions up to DEMO_UNTIL,
// so sessions after DEMO_UNTIL stay "pending" until a teacher marks them.
// Every record carries `source` so rows imported from the GEHU ERP later can sit alongside.

import { db, save } from './store.js';
import { findById, usersByRole } from './users.js';

export const THRESHOLD = 75; // % attendance required

const TERM_START = '2026-07-20';
const DEMO_UNTIL = '2026-09-18'; // last day of generated demo history
const PBL_RATE = 0.88;
const PBL_ROLES = ['Team Lead', 'Frontend', 'Backend', 'ML & Testing'];

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
  const saved = db.marks[key]?.[date]?.statuses[userId];
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

// ---- lookups --------------------------------------------------------------------

const students = () => usersByRole('student');
const findGroup = (id) => db.pblGroups.find((g) => g.id === id);
const findSubject = (code) => db.subjects.find((s) => s.code === code);
const pblKey = (groupId) => `PBL-${groupId}`;

export const facultyName = (s) => (s.teacherId ? findById(s.teacherId)?.name : s.faculty) ?? 'Unassigned';
export const mentorName = (g) => (g.mentorId ? findById(g.mentorId)?.name : g.mentorName) ?? 'Unassigned';

/** Anything a teacher takes attendance for: a subject or a PBL group. */
function classByKey(key) {
  const s = findSubject(key);
  if (s) {
    return { key, kind: 'subject', title: s.name, subtitle: `${s.code} · CSE ${s.section}`, teacherId: s.teacherId, days: s.days, rate: s.rate, roster: students().map((u) => u.id) };
  }
  const g = key.startsWith('PBL-') && findGroup(key.slice(4));
  if (g) {
    return { key, kind: 'pbl', title: g.project.title, subtitle: `PBL group ${g.id}`, teacherId: g.mentorId, days: [g.day], rate: PBL_RATE, roster: g.memberIds };
  }
  return null;
}

const allClassKeys = () => [...db.subjects.map((s) => s.code), ...db.pblGroups.map((g) => pblKey(g.id))];
const recordsFor = (userId, c) => sessionDates(c.days).map((d) => recordFor(userId, c.key, d, c.rate)).filter(Boolean);
const pendingSessions = (c) => sessionDates(c.days).filter((d) => d > DEMO_UNTIL && !db.marks[c.key]?.[d]).length;

// ---- student queries ------------------------------------------------------------

export const getStudent = (userId) => findById(userId)?.profile ?? null;

export function getAttendance(userId) {
  const list = db.subjects.map((s) => {
    const records = recordsFor(userId, classByKey(s.code));
    return { code: s.code, name: s.name, faculty: facultyName(s), ...summarise(records), records };
  });
  return { threshold: THRESHOLD, overall: summarise(list.flatMap((s) => s.records)), subjects: list };
}

export function getPbl(userId) {
  const g = findGroup(getStudent(userId)?.pblGroup);
  if (!g) return null;
  const topics = ['Stand-up & task review', 'Design walkthrough', 'Code review', 'Mentor feedback', 'Demo & planning'];
  const sessions = sessionDates([g.day])
    .map((d, i) => {
      const r = recordFor(userId, pblKey(g.id), d, PBL_RATE);
      return r && { ...r, topic: topics[i % topics.length] };
    })
    .filter(Boolean);
  return {
    id: g.id,
    mentor: { name: mentorName(g), department: 'CSE' },
    project: g.project,
    milestones: g.milestones,
    members: g.memberIds.map((id, i) => {
      const u = findById(id);
      return { name: u.name, rollNo: u.rollNo, role: PBL_ROLES[i] ?? 'Member', you: id === userId };
    }),
    attendance: { threshold: THRESHOLD, ...summarise(sessions), sessions },
  };
}

// ---- teacher queries -----------------------------------------------------------

/** Classes this teacher takes attendance for, with how many sessions still need marking. */
export function getTeacherClasses(teacherId) {
  return allClassKeys()
    .map(classByKey)
    .filter((c) => c.teacherId === teacherId)
    .map((c) => ({ key: c.key, kind: c.kind, title: c.title, subtitle: c.subtitle, students: c.roster.length, pending: pendingSessions(c) }));
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
      const m = db.marks[c.key]?.[date];
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
  db.marks[c.key] ??= {};
  db.marks[c.key][date] = { by: teacherId, at: new Date().toISOString(), statuses };
  save();
}

// ---- admin queries ---------------------------------------------------------------

/** Per-student overall attendance plus the subjects they're short in. */
export function getStudentStandings() {
  return students().map((u) => {
    const a = getAttendance(u.id);
    const pbl = getPbl(u.id);
    return {
      userId: u.id,
      rollNo: u.rollNo,
      name: u.name,
      section: u.profile?.section ?? '—',
      pblGroup: u.profile?.pblGroup ?? null,
      overall: a.overall.percent,
      pbl: pbl?.attendance.percent ?? null,
      short: a.subjects.filter((s) => s.percent < THRESHOLD).map((s) => ({ code: s.code, name: s.name, percent: s.percent, mustAttend: s.mustAttend })),
    };
  });
}

export function getOverview() {
  const standings = getStudentStandings();
  const teachers = usersByRole('teacher');
  const classes = allClassKeys().map(classByKey);
  const pendingByTeacher = teachers
    .map((t) => ({ userId: t.id, name: t.name, pending: classes.filter((c) => c.teacherId === t.id).reduce((n, c) => n + pendingSessions(c), 0) }))
    .filter((t) => t.pending > 0)
    .sort((a, b) => b.pending - a.pending);
  const avg = standings.length ? Math.round((standings.reduce((n, s) => n + s.overall, 0) / standings.length) * 10) / 10 : 0;
  return {
    threshold: THRESHOLD,
    counts: { students: standings.length, teachers: teachers.length, subjects: db.subjects.length, pblGroups: db.pblGroups.length },
    averageAttendance: avg,
    belowThreshold: standings.filter((s) => s.overall < THRESHOLD).length,
    withShortSubjects: standings.filter((s) => s.short.length).length,
    unassigned: db.subjects.filter((s) => !s.teacherId).length + db.pblGroups.filter((g) => !g.mentorId).length,
    pendingByTeacher,
  };
}

export function getClassesAdmin() {
  return {
    subjects: db.subjects.map((s) => ({ code: s.code, name: s.name, section: s.section, days: s.days, teacherId: s.teacherId, faculty: facultyName(s), pending: pendingSessions(classByKey(s.code)) })),
    pblGroups: db.pblGroups.map((g) => ({
      id: g.id,
      title: g.project.title,
      mentorId: g.mentorId,
      mentor: mentorName(g),
      members: g.memberIds.map((id) => findById(id)?.name).filter(Boolean),
      pending: pendingSessions(classByKey(pblKey(g.id))),
    })),
  };
}

/** Assign (or clear, with null) the teacher account for a subject or PBL group. */
export function assignTeacher(kind, id, teacherId) {
  const item = kind === 'subject' ? findSubject(id) : findGroup(id);
  if (!item) return false;
  if (kind === 'subject') item.teacherId = teacherId;
  else item.mentorId = teacherId;
  save();
  return true;
}

export const teachingLoad = (teacherId) => allClassKeys().map(classByKey).filter((c) => c.teacherId === teacherId).length;
