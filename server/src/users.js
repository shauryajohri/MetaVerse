import bcrypt from 'bcryptjs';
import { db, save } from './store.js';
import { studentProfile } from './seed.js';

// Users live in data/db.json (see store.js). Students carry their academic details in `profile`.

export const findByRollNo = (rollNo) => db.users.find((u) => u.rollNo === rollNo);
export const findById = (id) => db.users.find((u) => u.id === id);
export const usersByRole = (role) => db.users.filter((u) => u.role === role);
export const publicUser = ({ passwordHash, profile, ...u }) => u;

export const MIN_PASSWORD = 8;

export function createUser({ role, rollNo, name, password }) {
  const user = { id: db.nextId++, rollNo, name, role, passwordHash: bcrypt.hashSync(password, 10) };
  if (role === 'student') user.profile = studentProfile(name, rollNo);
  db.users.push(user);
  save();
  return user;
}

export function setPassword(user, password) {
  user.passwordHash = bcrypt.hashSync(password, 10);
  save();
}
