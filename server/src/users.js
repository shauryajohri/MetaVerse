import bcrypt from 'bcryptjs';

// Temporary in-memory store. Replaced by the PostgreSQL `users` / `students` /
// `teachers` tables in Phase 1 — keep the same function signatures.
const seed = [
  { id: 1, rollNo: '2301001', name: 'Demo Student', role: 'student', password: 'student123' },
  { id: 2, rollNo: 'T1001', name: 'Demo Teacher', role: 'teacher', password: 'teacher123' },
  { id: 3, rollNo: 'A0001', name: 'Demo Admin', role: 'admin', password: 'admin123' },
];

const users = seed.map(({ password, ...u }) => ({ ...u, passwordHash: bcrypt.hashSync(password, 10) }));

export const findByRollNo = (rollNo) => users.find((u) => u.rollNo === rollNo);
export const findById = (id) => users.find((u) => u.id === id);
export const publicUser = ({ passwordHash, ...u }) => u;
