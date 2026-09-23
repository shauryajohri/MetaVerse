// Academic records: student profiles, class attendance and PBL.
//
// Temporary in-memory store mirroring the DOCS.md schema (`students`, `subjects`,
// `class_sessions`, `attendance`, plus PBL groups). Attendance is generated
// deterministically for demo purposes until teachers mark it in-app; every record
// carries `source` so rows imported from the GEHU ERP later can live alongside ours.

export const THRESHOLD = 75; // % attendance required

const TERM_START = '2026-07-20';

const students = {
  1: { course: 'B.Tech', branch: 'CSE', department: 'Computer Science & Engineering', semester: 5, section: 'A', batch: '2023–2027', email: 'student.2301001@gehu.ac.in', pblGroup: 'G-07' },
  4: { course: 'B.Tech', branch: 'CSE', department: 'Computer Science & Engineering', semester: 5, section: 'A', batch: '2023–2027', email: 'aarav.2301002@gehu.ac.in', pblGroup: 'G-07' },
  5: { course: 'B.Tech', branch: 'CSE', department: 'Computer Science & Engineering', semester: 5, section: 'A', batch: '2023–2027', email: 'isha.2301003@gehu.ac.in', pblGroup: 'G-07' },
  6: { course: 'B.Tech', branch: 'CSE', department: 'Computer Science & Engineering', semester: 5, section: 'A', batch: '2023–2027', email: 'kabir.2301004@gehu.ac.in', pblGroup: 'G-07' },
};

// days: 0=Sun … 6=Sat. `rate` only drives the demo generator.
const subjects = [
  { code: 'CS-501', name: 'Design & Analysis of Algorithms', faculty: 'Dr. Meenakshi Joshi', days: [1, 3, 5], rate: 0.86 },
  { code: 'CS-502', name: 'Database Management Systems', faculty: 'Mr. Rohit Pant', days: [1, 2, 4], rate: 0.9 },
  { code: 'CS-503', name: 'Computer Networks', faculty: 'Dr. Ankit Sharma', days: [2, 4], rate: 0.64 },
  { code: 'CS-504', name: 'Operating Systems', faculty: 'Ms. Priya Kandari', days: [1, 3, 4], rate: 0.8 },
  { code: 'CS-505', name: 'Machine Learning', faculty: 'Dr. Vikas Thapliyal', days: [2, 5], rate: 0.93 },
  { code: 'CS-551', name: 'DBMS Lab', faculty: 'Mr. Rohit Pant', days: [3], rate: 0.64 },
];

const pblGroups = {
  'G-07': {
    id: 'G-07',
    mentor: { name: 'Mr. Nishant Bhandari', department: 'CSE' },
    members: [
      { userId: 4, name: 'Aarav Negi', rollNo: '2301002', role: 'Frontend' },
      { userId: 1, name: 'Demo Student', rollNo: '2301001', role: 'Team Lead · Database' },
      { userId: 5, name: 'Isha Rawat', rollNo: '2301003', role: 'Backend' },
      { userId: 6, name: 'Kabir Bisht', rollNo: '2301004', role: 'ML & Testing' },
    ],
    project: {
      title: 'METAVERSE — Digital University Ecosystem',
      domain: 'Full Stack · DBMS · Machine Learning',
      summary: 'A university management platform whose interface is a walkable, multiplayer 2D campus.',
    },
    day: 6, // weekly PBL session on Saturdays
    milestones: [
      { title: 'Team formation & topic approval', due: '2026-07-25', status: 'completed', remarks: 'Topic approved by mentor.' },
      { title: 'Synopsis submission', due: '2026-08-10', status: 'completed', remarks: 'Accepted.' },
      { title: 'SRS & ER model review', due: '2026-09-05', status: 'completed', remarks: 'Settle the final table count before next review.' },
      { title: 'Mid-term review — working prototype', due: '2026-10-10', status: 'in-progress', remarks: null },
      { title: 'Final evaluation & report', due: '2026-12-05', status: 'upcoming', remarks: null },
    ],
  },
};

// --- deterministic demo attendance ------------------------------------------

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  // murmur3 finaliser — FNV alone clusters on strings that differ only at the end
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const iso = (d) => d.toISOString().slice(0, 10);

/** Dates on the given weekdays from term start up to and including today. */
function sessionDates(days) {
  const out = [];
  const end = iso(new Date());
  for (let d = new Date(`${TERM_START}T00:00:00Z`); iso(d) <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    if (days.includes(d.getUTCDay())) out.push(iso(d));
  }
  return out;
}

const record = (userId, key, date, rate) => ({
  date,
  status: hash(`${userId}:${key}:${date}`) < rate ? 'present' : 'absent',
  source: 'metaverse',
});

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

// --- queries -----------------------------------------------------------------

export const getStudent = (userId) => students[userId] ?? null;

export function getAttendance(userId) {
  const list = subjects.map((s) => {
    const records = sessionDates(s.days).map((d) => record(userId, s.code, d, s.rate));
    return { code: s.code, name: s.name, faculty: s.faculty, ...summarise(records), records };
  });
  const all = list.flatMap((s) => s.records);
  return { threshold: THRESHOLD, overall: summarise(all), subjects: list };
}

export function getPbl(userId) {
  const group = pblGroups[students[userId]?.pblGroup];
  if (!group) return null;
  const topics = ['Stand-up & task review', 'Schema walkthrough', 'Code review', 'Mentor feedback', 'Demo & planning'];
  const sessions = sessionDates([group.day]).map((d, i) => ({ ...record(userId, 'PBL', d, 0.88), topic: topics[i % topics.length] }));
  const { day, members, ...rest } = group;
  return {
    ...rest,
    members: members.map(({ userId: id, ...m }) => ({ ...m, you: id === userId })),
    attendance: { threshold: THRESHOLD, ...summarise(sessions), sessions },
  };
}
