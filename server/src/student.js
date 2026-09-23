import { Router } from 'express';
import { requireAuth, requireRole } from './auth.js';
import { getAttendance, getPbl, getStudent } from './academics.js';
import { publicUser } from './users.js';

// Everything here is scoped to the logged-in student — no roll number in the URL,
// so one student can never request another's records.
export const studentRouter = Router();
studentRouter.use(requireAuth, requireRole('student'));

studentRouter.get('/profile', (req, res) => {
  res.json({ ...publicUser(req.user), ...getStudent(req.user.id) });
});

studentRouter.get('/attendance', (req, res) => res.json(getAttendance(req.user.id)));

studentRouter.get('/pbl', (req, res) => {
  const pbl = getPbl(req.user.id);
  if (!pbl) return res.status(404).json({ error: 'You are not in a PBL group yet.' });
  res.json(pbl);
});
