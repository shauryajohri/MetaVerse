import { Router } from 'express';
import { requireAuth, requireRole } from './auth.js';
import { THRESHOLD, getRoster, getSessions, getTeacherClasses, isSessionDate, saveSession, teacherClass, today } from './academics.js';

// Attendance marking. A teacher can only see and mark classes they teach or PBL
// groups they mentor — every route re-checks ownership via teacherClass().
export const teacherRouter = Router();
teacherRouter.use(requireAuth, requireRole('teacher'));

teacherRouter.get('/classes', (req, res) => res.json({ threshold: THRESHOLD, classes: getTeacherClasses(req.user.id) }));

function ownClass(req, res, next) {
  req.cls = teacherClass(req.user.id, req.params.key);
  if (!req.cls) return res.status(404).json({ error: 'Class not found.' });
  next();
}

function validDate(req, res, next) {
  const { date } = req.params;
  if (!isSessionDate(req.cls, date)) return res.status(400).json({ error: 'There is no session of this class on that date.' });
  if (date > today()) return res.status(400).json({ error: "You can't mark attendance for a future session." });
  next();
}

teacherRouter.get('/classes/:key/sessions', ownClass, (req, res) => res.json({ sessions: getSessions(req.cls) }));

teacherRouter.get('/classes/:key/sessions/:date', ownClass, validDate, (req, res) => {
  res.json({ date: req.params.date, roster: getRoster(req.cls, req.params.date) });
});

teacherRouter.put('/classes/:key/sessions/:date', ownClass, validDate, (req, res) => {
  const input = req.body?.statuses ?? {};
  const statuses = {};
  for (const id of req.cls.roster) {
    const s = input[id];
    if (s !== 'present' && s !== 'absent') return res.status(400).json({ error: 'Mark every student present or absent before saving.' });
    statuses[id] = s;
  }
  saveSession(req.cls, req.params.date, statuses, req.user.id);
  res.json({ date: req.params.date, roster: getRoster(req.cls, req.params.date), sessions: getSessions(req.cls) });
});
