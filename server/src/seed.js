// First-run demo data. Written to data/db.json once; after that the file is the source of truth.
// Delete data/db.json to start over from this seed.

import bcrypt from 'bcryptjs';

// CSE 5th sem, section A. Roll numbers 2301001… in this order.
const SECTION_A = [
  'Demo Student', 'Aarav Negi', 'Isha Rawat', 'Kabir Bisht', 'Ananya Joshi', 'Rohan Pant',
  'Sneha Chauhan', 'Aditya Rana', 'Priya Bhatt', 'Vivek Semwal', 'Neha Gusain', 'Arjun Thapa',
  'Kritika Uniyal', 'Harsh Nautiyal', 'Simran Kaur', 'Yash Dobhal', 'Tanya Mehra', 'Mohit Kandpal',
  'Riya Sati', 'Deepak Bora', 'Aisha Khan', 'Nikhil Dhyani', 'Pooja Rautela', 'Sahil Arora',
];

const DEMO_TEACHER = 2;

export const studentProfile = (name, rollNo, pblGroup = null) => ({
  course: 'B.Tech',
  branch: 'CSE',
  department: 'Computer Science & Engineering',
  semester: 5,
  section: 'A',
  batch: '2023–2027',
  email: `${name.split(' ')[0].toLowerCase()}.${rollNo}@gehu.ac.in`,
  pblGroup,
});

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

export function seed() {
  const hash = (pw) => bcrypt.hashSync(pw, 10);
  const studentHash = hash('student123'); // same demo password for everyone — hash once

  const students = SECTION_A.map((name, i) => {
    const rollNo = String(2301001 + i);
    const group = `G-${String(7 + Math.floor(i / 4)).padStart(2, '0')}`; // groups of four: G-07, G-08, …
    return { id: 100 + i, rollNo, name, role: 'student', passwordHash: studentHash, profile: studentProfile(name, rollNo, group) };
  });

  const users = [
    ...students,
    { id: DEMO_TEACHER, rollNo: 'T1001', name: 'Demo Teacher', role: 'teacher', passwordHash: hash('teacher123') },
    { id: 3, rollNo: 'A0001', name: 'Demo Admin', role: 'admin', passwordHash: hash('admin123') },
  ];

  // days: 0=Sun … 6=Sat. `rate` only drives the demo generator.
  // `faculty` is the display name used when no teacher account is assigned.
  const subjects = [
    { code: 'CS-501', name: 'Design & Analysis of Algorithms', faculty: 'Dr. Meenakshi Joshi', teacherId: null, days: [1, 3, 5], rate: 0.86 },
    { code: 'CS-502', name: 'Database Management Systems', faculty: null, teacherId: DEMO_TEACHER, days: [1, 2, 4], rate: 0.9 },
    { code: 'CS-503', name: 'Computer Networks', faculty: 'Dr. Ankit Sharma', teacherId: null, days: [2, 4], rate: 0.76 },
    { code: 'CS-504', name: 'Operating Systems', faculty: 'Ms. Priya Kandari', teacherId: null, days: [1, 3, 4], rate: 0.8 },
    { code: 'CS-505', name: 'Machine Learning', faculty: 'Dr. Vikas Thapliyal', teacherId: null, days: [2, 5], rate: 0.93 },
    { code: 'CS-551', name: 'DBMS Lab', faculty: null, teacherId: DEMO_TEACHER, days: [3], rate: 0.82 },
  ].map((s) => ({ ...s, section: 'A' }));

  const pblGroups = [];
  for (const s of students) {
    let g = pblGroups.find((x) => x.id === s.profile.pblGroup);
    if (!g) {
      const n = pblGroups.length;
      const [title, domain, summary] = PROJECTS[n % PROJECTS.length];
      g = {
        id: s.profile.pblGroup,
        // Demo Teacher mentors the first two groups so the marking page has PBL work to do.
        mentorId: n < 2 ? DEMO_TEACHER : null,
        mentorName: 'Ms. Kavita Rana',
        project: { title, domain, summary },
        day: 6, // weekly PBL session on Saturdays
        memberIds: [],
        milestones: MILESTONES.map(([t, due, status, remarks]) => ({ title: t, due, status, remarks })),
      };
      pblGroups.push(g);
    }
    g.memberIds.push(s.id);
  }

  return { version: 1, nextId: 1000, users, subjects, pblGroups, marks: {} };
}
