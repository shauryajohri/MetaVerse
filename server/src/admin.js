import { Router } from 'express';
import { requireAuth, requireRole } from './auth.js';
import { assignTeacher, getClassesAdmin, getOverview, getStudentStandings, teachingLoad } from './academics.js';
import { MIN_PASSWORD, createUser, findById, findByRollNo, publicUser, setPassword, usersByRole } from './users.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

adminRouter.get('/overview', (_req, res) => res.json(getOverview()));

adminRouter.get('/students', (_req, res) => res.json({ students: getStudentStandings() }));

adminRouter.get('/users', (_req, res) => {
  const list = ['student', 'teacher', 'admin'].flatMap((role) =>
    usersByRole(role).map((u) => ({
      ...publicUser(u),
      detail: role === 'student' ? `CSE ${u.profile?.section ?? '—'} · ${u.profile?.pblGroup ?? 'no PBL group'}` : role === 'teacher' ? `${teachingLoad(u.id)} classes / groups` : 'Administrator',
    })),
  );
  res.json({ users: list });
});

const ID_PATTERN = /^[A-Z0-9-]{3,20}$/;

adminRouter.post('/users', (req, res) => {
  const role = req.body?.role;
  const rollNo = String(req.body?.rollNo ?? '').trim().toUpperCase();
  const name = String(req.body?.name ?? '').trim().replace(/\s+/g, ' ');
  const password = String(req.body?.password ?? '');
  if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ error: 'Pick Student, Teacher or Admin.' });
  if (!ID_PATTERN.test(rollNo)) return res.status(400).json({ error: 'ID must be 3–20 letters, digits or dashes.' });
  if (name.length < 2 || name.length > 60) return res.status(400).json({ error: 'Enter a full name.' });
  if (password.length < MIN_PASSWORD) return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  if (findByRollNo(rollNo)) return res.status(409).json({ error: `${rollNo} is already taken.` });
  res.status(201).json({ user: publicUser(createUser({ role, rollNo, name, password })) });
});

adminRouter.post('/users/:id/password', (req, res) => {
  const user = findById(Number(req.params.id));
  const password = String(req.body?.password ?? '');
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (password.length < MIN_PASSWORD) return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  setPassword(user, password);
  res.json({ ok: true });
});

adminRouter.get('/classes', (_req, res) => {
  res.json({ ...getClassesAdmin(), teachers: usersByRole('teacher').map((t) => ({ id: t.id, name: t.name, rollNo: t.rollNo })) });
});

// kind: 'subject' (id = subject code) or 'pbl' (id = group id). teacherId null = unassign.
adminRouter.put('/classes/:kind/:id/teacher', (req, res) => {
  const { kind, id } = req.params;
  const teacherId = req.body?.teacherId ?? null;
  if (kind !== 'subject' && kind !== 'pbl') return res.status(404).json({ error: 'Unknown class type.' });
  if (teacherId !== null && findById(teacherId)?.role !== 'teacher') return res.status(400).json({ error: 'That user is not a teacher.' });
  if (!assignTeacher(kind, id, teacherId)) return res.status(404).json({ error: 'Class not found.' });
  res.json(getClassesAdmin());
});
