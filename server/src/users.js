import bcrypt from 'bcryptjs';

// Temporary in-memory store. Replaced by the PostgreSQL `users` / `students` /
// `teachers` tables in Phase 1 — keep the same function signatures.

// CSE 5th sem, section A. Roll numbers 2301001… in this order.
const SECTION_A = [
  'Demo Student', 'Aarav Negi', 'Isha Rawat', 'Kabir Bisht', 'Ananya Joshi', 'Rohan Pant',
  'Sneha Chauhan', 'Aditya Rana', 'Priya Bhatt', 'Vivek Semwal', 'Neha Gusain', 'Arjun Thapa',
  'Kritika Uniyal', 'Harsh Nautiyal', 'Simran Kaur', 'Yash Dobhal', 'Tanya Mehra', 'Mohit Kandpal',
  'Riya Sati', 'Deepak Bora', 'Aisha Khan', 'Nikhil Dhyani', 'Pooja Rautela', 'Sahil Arora',
];

const seed = [
  ...SECTION_A.map((name, i) => ({ id: 100 + i, rollNo: String(2301001 + i), name, role: 'student', password: 'student123' })),
  { id: 2, rollNo: 'T1001', name: 'Demo Teacher', role: 'teacher', password: 'teacher123' },
  { id: 3, rollNo: 'A0001', name: 'Demo Admin', role: 'admin', password: 'admin123' },
];

const users = seed.map(({ password, ...u }) => ({ ...u, passwordHash: bcrypt.hashSync(password, 8) }));

export const findByRollNo = (rollNo) => users.find((u) => u.rollNo === rollNo);
export const findById = (id) => users.find((u) => u.id === id);
export const usersByRole = (role) => users.filter((u) => u.role === role);
export const publicUser = ({ passwordHash, ...u }) => u;
